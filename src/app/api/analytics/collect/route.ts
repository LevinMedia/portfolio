import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isbot } from 'isbot'

type Geo = {
  country?: string | null
  region?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
}

function getReferrerDomain(referrer: string | null): string | null {
  try {
    if (!referrer) return null
    const u = new URL(referrer)
    return u.hostname
  } catch {
    return null
  }
}

function parseUtm(url: string | null): Record<string, string> {
  if (!url) return {}
  try {
    const u = new URL(url)
    const params = u.searchParams
    const out: Record<string, string> = {}
    ;['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k => {
      const v = params.get(k)
      if (v) out[k] = v
    })
    return out
  } catch {
    return {}
  }
}

type HeaderGetter = { get(name: string): string | null }

function getClientIp(request: NextRequest, hdrs: HeaderGetter): string | null {
  const directIp = (request as NextRequest & { ip?: string | null }).ip?.trim()
  if (directIp) return directIp
  const forwarded = hdrs.get('x-forwarded-for')
  if (forwarded) {
    const [first] = forwarded.split(',')
    if (first && first.trim()) return first.trim()
  }
  const realIp = hdrs.get('x-real-ip')
  if (realIp && realIp.trim()) return realIp.trim()
  return null
}

function deriveVisitorId(existing: string | null | undefined, request: NextRequest, hdrs: HeaderGetter): string {
  if (existing) return existing

  const ip = getClientIp(request, hdrs)
  const ua = hdrs.get('user-agent') || ''
  const acceptLanguage = hdrs.get('accept-language') || ''

  if (ip || ua || acceptLanguage) {
    const hash = createHash('sha256')
    if (ip) hash.update(ip)
    hash.update('|')
    hash.update(ua)
    hash.update('|')
    hash.update(acceptLanguage)
    return hash.digest('hex')
  }

  return crypto.randomUUID()
}

function geoFromVercelHeaders(hdrs: HeaderGetter): Geo {
  const country = hdrs.get('x-vercel-ip-country')
  const region = hdrs.get('x-vercel-ip-country-region') || hdrs.get('x-vercel-ip-region')
  const city = hdrs.get('x-vercel-ip-city')
  const latitude = hdrs.get('x-vercel-ip-latitude')
  const longitude = hdrs.get('x-vercel-ip-longitude')

  const parsed: Geo = {}

  if (country) parsed.country = country
  if (region) parsed.region = region
  if (city) parsed.city = city
  if (latitude) parsed.latitude = Number.parseFloat(latitude)
  if (longitude) parsed.longitude = Number.parseFloat(longitude)

  return parsed
}

function extractLocale(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [first] = headerValue.split(',')
  if (!first) return null
  const [locale] = first.split(';')
  return locale?.trim().replace('_', '-') || null
}

function geoFromAcceptLanguage(hdrs: HeaderGetter): Geo {
  const locale = extractLocale(hdrs.get('accept-language'))
  if (!locale) return {}
  const parts = locale.split('-')
  const region = parts[parts.length - 1]
  if (!region || region.length !== 2) return {}

  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
    const country = displayNames.of(region.toUpperCase())
    if (!country) return {}
    return { country }
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const hdrs = request.headers
  const userAgent = hdrs.get('user-agent') || ''
  const dnt = hdrs.get('dnt') === '1'
  const referer = hdrs.get('referer')

  if (dnt) return NextResponse.json({ skipped: true, reason: 'dnt' }, { status: 200 })
  if (isbot(userAgent)) return NextResponse.json({ skipped: true, reason: 'bot' }, { status: 200 })

  const { path, isAdmin = false, isPrivate = false, currentUrl } = await request.json().catch(() => ({}))
  if (!path || typeof path !== 'string') return NextResponse.json({ error: 'path required' }, { status: 400 })
  if (path.startsWith('/admin')) return NextResponse.json({ skipped: true, reason: 'admin' }, { status: 200 })
  if (isPrivate) return NextResponse.json({ skipped: true, reason: 'private' }, { status: 200 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Server-side guard: if selected work is private, skip
  if (path.startsWith('/selected-works/')) {
    const slug = path.split('/')[2]
    if (slug) {
      const { data: sw } = await supabase.from('selected_works').select('is_private, is_published').eq('slug', slug).single()
      if (sw && sw.is_private === true) {
        return NextResponse.json({ skipped: true, reason: 'private' }, { status: 200 })
      }
    }
  }

  // Use cookies for visitor and session identification
  const cookieStore = request.cookies
  const visitorCookie = cookieStore.get('lm_vid')?.value || null
  const sessionCookie = cookieStore.get('lm_sid')?.value || null

  const visitorId = deriveVisitorId(visitorCookie, request, hdrs)
  const sessionId = sessionCookie || crypto.randomUUID()

  const newVisitor = !visitorCookie
  const newSession = !sessionCookie

  // Derive geo from platform if available and fall back to client hints
  let geo: Geo = (request as { geo?: Geo }).geo || {}

  if (!geo.country || !geo.region || !geo.city || geo.latitude == null || geo.longitude == null) {
    const headerGeo = geoFromVercelHeaders(hdrs)
    if (headerGeo.country && !geo.country) geo = { ...geo, country: headerGeo.country }
    if (headerGeo.region && !geo.region) geo = { ...geo, region: headerGeo.region }
    if (headerGeo.city && !geo.city) geo = { ...geo, city: headerGeo.city }
    if (typeof headerGeo.latitude === 'number' && geo.latitude == null) geo = { ...geo, latitude: headerGeo.latitude }
    if (typeof headerGeo.longitude === 'number' && geo.longitude == null) geo = { ...geo, longitude: headerGeo.longitude }
  }

  if (!geo.country) {
    // Use Accept-Language as a host-agnostic hint for visitor country
    const localeGeo = geoFromAcceptLanguage(hdrs)
    if (Object.keys(localeGeo).length > 0) {
      geo = { ...localeGeo, ...geo }
    }
  }
  
  // Add mock geo data for local development
  if (process.env.NODE_ENV === 'development' && (!geo.country)) {
    const mockGeoData = [
      { country: 'United States', region: 'California', city: 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
      { country: 'United Kingdom', region: 'England', city: 'London', latitude: 51.5074, longitude: -0.1278 },
      { country: 'Germany', region: 'Berlin', city: 'Berlin', latitude: 52.5200, longitude: 13.4050 },
      { country: 'Japan', region: 'Tokyo', city: 'Tokyo', latitude: 35.6895, longitude: 139.6917 },
      { country: 'Canada', region: 'Ontario', city: 'Toronto', latitude: 43.6532, longitude: -79.3832 }
    ]
    // Randomly select mock geo data for variety
    geo = mockGeoData[Math.floor(Math.random() * mockGeoData.length)]
  }

  const { error } = await supabase.from('analytics_pageviews').insert({
    path,
    referrer_domain: getReferrerDomain(referer),
    utm: parseUtm(currentUrl || null),
    visitor_id: visitorId,
    session_id: sessionId,
    is_bot: false,
    country: geo?.country || null,
    region: geo?.region || null,
    city: geo?.city || null,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
    is_admin: Boolean(isAdmin),
    is_private: Boolean(isPrivate)
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true })
  if (newVisitor) res.cookies.set('lm_vid', visitorId, { httpOnly: false, sameSite: 'lax', maxAge: 31536000, path: '/' })
  if (newSession) res.cookies.set('lm_sid', sessionId, { httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 4, path: '/' })
  return res
}


