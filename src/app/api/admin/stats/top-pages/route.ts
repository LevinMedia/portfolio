import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all'

function getWindow(range: RangeKey) {
  const now = new Date()
  // Add a larger buffer to account for timezone differences and ensure we capture recent data
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Add 24 hour buffer
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
    .select('path, visitor_id, occurred_at')
    .eq('is_bot', false)
    .eq('is_admin', false)
    .eq('is_private', false)
  if (start) q = q.gte('occurred_at', start.toISOString()).lte('occurred_at', end.toISOString())

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts = new Map<string, number>()
  const uniques = new Map<string, Set<string>>()
  for (const r of data || []) {
    counts.set(r.path, (counts.get(r.path) || 0) + 1)
    if (!uniques.has(r.path)) uniques.set(r.path, new Set<string>())
    uniques.get(r.path)!.add(r.visitor_id)
  }
  const rows = Array.from(counts.entries())
    .map(([path, views]) => ({ 
      path: path === '/' ? 'Home' : path, // Display "Home" instead of "/" for the root path
      views, 
      uniques: (uniques.get(path)?.size || 0) 
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 50)

  return NextResponse.json({ range, pages: rows })
}


