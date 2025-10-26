import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all'

function getWindow(range: RangeKey) {
  const now = new Date()
  // Use a much larger buffer and ensure we're using UTC
  const end = new Date(now.getTime() + 48 * 60 * 60 * 1000) // Add 48 hour buffer to be safe
  let start: Date | null = null
  let prevStart: Date | null = null
  
  switch (range) {
    case '24h':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      prevStart = new Date(start.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      prevStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      prevStart = new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      prevStart = new Date(start.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    case 'all':
      start = null
      prevStart = null
      break
  }
  return { start, end, prevStart, prevEnd: start }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const range = (url.searchParams.get('range') as RangeKey) || '7d'
  const { start, end, prevStart, prevEnd } = getWindow(range)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Create separate query builders to avoid mutation issues
  const baseQuery = () => supabase.from('analytics_pageviews').select('path, visitor_id, country, occurred_at', { count: 'exact', head: false })
    .eq('is_bot', false)
    .eq('is_admin', false)
    .eq('is_private', false)

  const curr = start ? baseQuery().gte('occurred_at', start.toISOString()).lte('occurred_at', end.toISOString()) : baseQuery()
  const prev = (prevStart && prevEnd) ? baseQuery().gte('occurred_at', prevStart.toISOString()).lte('occurred_at', prevEnd.toISOString()) : null

  const [{ data: currData, error: currErr }, prevRes] = await Promise.all([
    curr,
    prev ? prev : Promise.resolve({ data: null, error: null })
  ])


  if (currErr) return NextResponse.json({ error: currErr.message }, { status: 500 })

  const currViews = currData?.length || 0
  const currUnique = new Set((currData || []).map(r => r.visitor_id)).size
  const currCountries = new Set((currData || []).map(r => r.country).filter(Boolean)).size
  const topPage = (() => {
    const counts = new Map<string, number>()
    for (const r of currData || []) counts.set(r.path, (counts.get(r.path) || 0) + 1)
    let best: string | null = null, bestCount = -1
    for (const [p, c] of counts.entries()) if (c > bestCount) { best = p; bestCount = c }
    // Display "Home" instead of "/" for the root path
    const displayPath = best === '/' ? 'Home' : best
    return { path: displayPath, views: bestCount }
  })()

  let prevViews = 0, prevUnique = 0
  if (prevRes && 'data' in prevRes && prevRes.data) {
    const prevData = prevRes.data as { visitor_id: string }[]
    prevViews = prevData.length
    prevUnique = new Set(prevData.map(r => r.visitor_id)).size
  }

  function pct(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0
    return ((curr - prev) / prev) * 100
  }

  return NextResponse.json({
    range,
    totals: {
      pageViews: currViews,
      uniqueVisitors: currUnique,
      countries: currCountries,
      topPage
    },
    deltas: {
      pageViewsPct: pct(currViews, prevViews),
      uniqueVisitorsPct: pct(currUnique, prevUnique)
    }
  })
}


