import { cookies, headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isbot } from 'isbot'

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

export async function POST(request: NextRequest) {
  const hdrs = await headers()
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
  const cookieStore = await cookies()
  let visitorId = cookieStore.get('lm_vid')?.value
  let sessionId = cookieStore.get('lm_sid')?.value
  const newVisitor = !visitorId
  const newSession = !sessionId
  if (!visitorId) visitorId = crypto.randomUUID()
  if (!sessionId) sessionId = crypto.randomUUID()

  // Derive geo from platform if available (Vercel/Next edge)
  let geo = (request as { geo?: { country?: string; region?: string; city?: string; latitude?: number; longitude?: number } }).geo || {}
  
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
  if (newVisitor) res.cookies.set('lm_vid', visitorId!, { httpOnly: false, sameSite: 'lax', maxAge: 31536000 })
  if (newSession) res.cookies.set('lm_sid', sessionId!, { httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 4 })
  return res
}


