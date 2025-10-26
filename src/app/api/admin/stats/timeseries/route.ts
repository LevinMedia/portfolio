import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all'
type AggKey = 'hour' | 'day' | 'week' | 'month' | 'quarter'
const TZ = 'America/Los_Angeles'

interface Bucket {
  start: Date
  end: Date
}

// Timezone helpers (Los Angeles)
function getTZOffsetMinutes(date: Date): number {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
  const tz = f.formatToParts(date).find(p => p.type === 'timeZoneName')?.value || 'GMT+0'
  const m = tz.match(/GMT([+-]?)(\d{1,2})(?::(\d{2}))?/)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  const h = parseInt(m[2] || '0', 10)
  const mi = parseInt(m[3] || '0', 10)
  const minutesFromGMT = sign * (h * 60 + mi)
  return -minutesFromGMT // same sign convention as Date.getTimezoneOffset()
}

function floorToTZ(date: Date, unit: AggKey): Date {
  // shift to LA local timeline
  const off = getTZOffsetMinutes(date)
  const shifted = new Date(date.getTime() - off * 60_000)
  const s = new Date(shifted)
  if (unit === 'hour') {
    s.setUTCMinutes(0, 0, 0)
  } else if (unit === 'day') {
    s.setUTCHours(0, 0, 0, 0)
  } else if (unit === 'week') {
    s.setUTCHours(0, 0, 0, 0)
    const day = s.getUTCDay() // 0=Sun
    const diff = (day + 6) % 7 // Monday start
    s.setUTCDate(s.getUTCDate() - diff)
  } else if (unit === 'month') {
    s.setUTCHours(0, 0, 0, 0)
    s.setUTCDate(1)
  } else if (unit === 'quarter') {
    s.setUTCHours(0, 0, 0, 0)
    s.setUTCDate(1)
    const m = s.getUTCMonth()
    const qStart = m - (m % 3)
    s.setUTCMonth(qStart)
  }
  // convert back to UTC instant; re-evaluate offset at boundary for DST shifts
  const back = new Date(s.getTime() + getTZOffsetMinutes(new Date(s.getTime() + off * 60_000)) * 60_000)
  return back
}

function add(date: Date, agg: AggKey, n: number) {
  const d = new Date(date)
  if (agg === 'hour') d.setHours(d.getHours() + n)
  else if (agg === 'day') d.setDate(d.getDate() + n)
  else if (agg === 'week') d.setDate(d.getDate() + 7 * n)
  else if (agg === 'month') d.setMonth(d.getMonth() + n)
  else if (agg === 'quarter') d.setMonth(d.getMonth() + 3 * n)
  return d
}

function normalizeStart(d: Date, agg: AggKey) {
  return floorToTZ(d, agg)
}

function allowedAggs(range: RangeKey): AggKey[] {
  if (range === '24h') return ['hour']
  if (range === '7d' || range === '30d') return ['day']
  return ['day', 'week', 'month', 'quarter']
}

async function getAllPageviewsInWindow(
  supabase: SupabaseClient,
  start: Date | null,
  end: Date
) {
  let q = supabase
    .from('analytics_pageviews')
    .select('occurred_at, visitor_id', { head: false })
    .eq('is_bot', false)
    .eq('is_admin', false)
    .eq('is_private', false)

  if (start) q = q.gte('occurred_at', start.toISOString())
  q = q.lte('occurred_at', end.toISOString())
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data as { occurred_at: string; visitor_id: string }[]
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const range = (url.searchParams.get('range') as RangeKey) || '30d'
    const requestedAgg = (url.searchParams.get('agg') as AggKey) || 'day'
    const now = new Date()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const aggs = allowedAggs(range)
    const agg: AggKey = aggs.includes(requestedAgg) ? requestedAgg : aggs[0]

    // Determine start and buckets
    let start: Date | null = null
    let end = new Date(now.getTime() + 24 * 60 * 60 * 1000) // small future buffer

    if (range === '24h') start = add(now, 'hour', -24)
    else if (range === '7d') start = add(now, 'day', -7)
    else if (range === '30d') start = add(now, 'day', -30)
    else if (range === '1y') start = add(now, 'day', -365)
    else {
      // all time: find earliest record
      const { data: firstRec } = await supabase
        .from('analytics_pageviews')
        .select('occurred_at')
        .order('occurred_at', { ascending: true })
        .limit(1)
        .single()
      if (firstRec && firstRec.occurred_at) {
        start = new Date(firstRec.occurred_at)
      } else {
        start = add(now, 'day', -30)
      }
    }

    // Normalize to aggregation boundary. Advance end by one bucket so the
    // current bucket is included (e.g., include the current month/week/hour).
    start = normalizeStart(start!, agg)
    end = add(normalizeStart(end, agg), agg, 1)

    // Build buckets
    const buckets: Bucket[] = []
    let cursor = new Date(start)
    const hardEnd = end
    while (cursor < hardEnd) {
      const bStart = new Date(cursor)
      const bEnd = add(cursor, agg, 1)
      buckets.push({ start: bStart, end: bEnd })
      cursor = bEnd
    }

    // Fetch rows in window and aggregate
    const rows = await getAllPageviewsInWindow(supabase, start, hardEnd)

    const views = new Array(buckets.length).fill(0) as number[]
    const visitorSets = buckets.map(() => new Set<string>())

    for (const r of rows) {
      const t = new Date(r.occurred_at)
      // binary search could be used; linear scan is fine for small N
      const idx = buckets.findIndex(b => t >= b.start && t < b.end)
      if (idx >= 0) {
        views[idx] += 1
        visitorSets[idx].add(r.visitor_id)
      }
    }

    const points = buckets.map((b, i) => ({
      t: b.start.toISOString(),
      views: views[i],
      visitors: visitorSets[i].size,
    }))

    return NextResponse.json({ range, agg, allowedAggs: aggs, points })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


