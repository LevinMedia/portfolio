import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all'

function getWindow(range: RangeKey) {
  const now = new Date()
  // Add a small buffer to account for timezone differences
  const end = new Date(now.getTime() + 60 * 60 * 1000) // Add 1 hour buffer
  switch (range) {
    case '24h': return { start: new Date(now.getTime() - 24*60*60*1000), end }
    case '7d': return { start: new Date(now.getTime() - 7*24*60*60*1000), end }
    case '30d': return { start: new Date(now.getTime() - 30*24*60*60*1000), end }
    case '1y': return { start: new Date(now.getTime() - 365*24*60*60*1000), end }
    case 'all': return { start: null as Date | null, end }
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const range = (url.searchParams.get('range') as RangeKey) || '7d'
  const { start, end } = getWindow(range)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let q = supabase.from('analytics_pageviews')
    .select('visitor_id, country, region, city, latitude, longitude, occurred_at')
    .eq('is_bot', false)
    .eq('is_admin', false)
    .eq('is_private', false)
  // Note: In development, geo data might be null, so we don't filter it out
  if (start) q = q.gte('occurred_at', start.toISOString()).lte('occurred_at', end.toISOString())

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter out records with no geo data, then deduplicate
  const recordsWithGeo = (data || []).filter(r => r.country || r.region || r.city || r.latitude || r.longitude)
  
  if (recordsWithGeo.length === 0) {
    // In development or when no geo data is available, return empty array
    return NextResponse.json({ range, points: [] })
  }

  // Group by location and count unique visitors per location
  const key = (r: { country: string | null; region?: string | null; city?: string | null; latitude?: number | null; longitude?: number | null }) => 
    [r.country || 'Unknown', r.region || '', r.city || '', r.latitude || '', r.longitude || ''].join('|')
  
  const byKey = new Map<string, { 
    country: string, 
    region: string | null, 
    city: string | null, 
    latitude: number | null, 
    longitude: number | null, 
    visitors: Set<string> 
  }>()
  
  for (const r of recordsWithGeo) {
    const k = key(r)
    const curr = byKey.get(k)
    if (!curr) {
      byKey.set(k, { 
        country: r.country || 'Unknown', 
        region: r.region || null, 
        city: r.city || null, 
        latitude: r.latitude || null, 
        longitude: r.longitude || null, 
        visitors: new Set([r.visitor_id])
      })
    } else {
      curr.visitors.add(r.visitor_id)
    }
  }

  // Convert to final format with visitor count
  const points = Array.from(byKey.values()).map(loc => ({
    country: loc.country,
    region: loc.region,
    city: loc.city,
    latitude: loc.latitude,
    longitude: loc.longitude,
    count: loc.visitors.size
  }))
  return NextResponse.json({ range, points })
}


