import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchPublicAnalyticsPageviews } from '@/lib/analytics-pageviews-query'
import { normalizeCountry } from '@/lib/country-codes'

type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all'
const TZ = 'America/Los_Angeles'

function getTZOffsetMinutes(date: Date): number {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
  const tz = f.formatToParts(date).find(p => p.type === 'timeZoneName')?.value || 'GMT+0'
  const m = tz.match(/GMT([+-]?)((?:\d{1,2}))(?:\:(\d{2}))?/)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  const h = parseInt(m[2] || '0', 10)
  const mi = parseInt(m[3] || '0', 10)
  const minutesFromGMT = sign * (h * 60 + mi)
  return -minutesFromGMT
}

function floorToTZ(date: Date, unit: 'hour' | 'day') {
  const off = getTZOffsetMinutes(date)
  const shifted = new Date(date.getTime() - off * 60_000)
  const s = new Date(shifted)
  if (unit === 'hour') s.setUTCMinutes(0, 0, 0)
  else s.setUTCHours(0, 0, 0, 0)
  const back = new Date(s.getTime() + getTZOffsetMinutes(new Date(s.getTime() + off * 60_000)) * 60_000)
  return back
}

// Same LA-aligned window as the summary route, so per-country figures add up to its totals.
function getWindow(range: RangeKey) {
  const end = new Date(floorToTZ(new Date(), 'day').getTime() + 24 * 60 * 60 * 1000)
  const days = { '24h': 1, '7d': 7, '30d': 30, '1y': 365 }
  if (range === 'all') return { start: null as Date | null, end }
  return { start: new Date(end.getTime() - days[range] * 24 * 60 * 60 * 1000), end }
}

/** Public visitors and page views per country. Private-user pageviews are already excluded from the query. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const range = (url.searchParams.get('range') as RangeKey) || '7d'
  const { start, end } = getWindow(range)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const data = await fetchPublicAnalyticsPageviews(supabase, {
    start,
    end,
    select: 'visitor_id, country, occurred_at',
  })

  const byCountry = new Map<string, { views: number; visitors: Set<string> }>()
  for (const r of data) {
    const country = normalizeCountry(r.country)
    if (!country) continue
    let row = byCountry.get(country)
    if (!row) {
      row = { views: 0, visitors: new Set() }
      byCountry.set(country, row)
    }
    row.views += 1
    if (r.visitor_id) row.visitors.add(r.visitor_id)
  }

  const countries = Array.from(byCountry.entries())
    .map(([country, row]) => ({ country, visitors: row.visitors.size, views: row.views }))
    .sort((a, b) => b.views - a.views || b.visitors - a.visitors)

  return NextResponse.json({ range, countries })
}
