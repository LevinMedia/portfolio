'use client'

import { useEffect, useState } from 'react'
import VisitorMap from './VisitorMap'
import TimeSeriesChart from './TimeSeriesChart'

type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all'

const ranges: { key: RangeKey, label: string }[] = [
  { key: '24h', label: 'Last 24h' },
  { key: '7d', label: 'Last 7d' },
  { key: '30d', label: 'Last 30d' },
  { key: '1y', label: 'Last 365d' },
]

export default function StatsContent() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [summary, setSummary] = useState<{
    totals?: { pageViews?: number; uniqueVisitors?: number; countries?: number; topPage?: { path?: string; views?: number } };
    deltas?: { pageViewsPct?: number; uniqueVisitorsPct?: number };
  } | null>(null)
  const [pages, setPages] = useState<{ path: string; views: number; uniques: number }[]>([])
  const [geo, setGeo] = useState<{ country: string; region: string | null; city: string | null; latitude: number | null; longitude: number | null; count: number }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/stats/summary?range=${range}`).then(r => r.json()),
      fetch(`/api/admin/stats/top-pages?range=${range}`).then(r => r.json()),
      fetch(`/api/admin/stats/geo?range=${range}`).then(r => r.json()),
    ]).then(([s, p, g]) => {
      if (cancelled) return
      setSummary(s)
      setPages(p.pages || [])
      const normalized = (g.points || []).map((p: { country: string; region?: string; city?: string; latitude?: number; longitude?: number; count: number }) => ({
        country: p.country,
        region: p.region ?? null,
        city: p.city ?? null,
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
        count: p.count,
      }))
      setGeo(normalized)
    }).finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [range])

  return (
    <div>
      {/* Range Selector - Sticky */}
      <div className="sticky top-0 z-10 bg-[#c0c0c0] py-2 -mx-4 px-4 border-b-2 border-[#808080] mb-4">
        <div className="flex justify-start items-center gap-2">
          {ranges.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className="px-4 py-2 text-sm text-[#000] transition-all"
              style={{
                background: range === r.key ? '#A7A7A7' : '#A7A7A7',
                boxShadow: range === r.key
                  ? '-4px -4px 0 0 rgba(255, 255, 255, 0.50) inset, 4px 4px 0 0 rgba(0, 0, 0, 0.50) inset'
                  : '-4px -4px 0 0 rgba(0, 0, 0, 0.50) inset, 4px 4px 0 0 rgba(255, 255, 255, 0.50) inset'
              }}
              onMouseEnter={(e) => {
                if (range !== r.key) {
                  e.currentTarget.style.background = '#B1B1B1';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#A7A7A7';
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-[#111]">Loading...</div>
      )}

      {!loading && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 @[600px]:grid-cols-4 gap-3">
            <Card title="Visitors" value={summary?.totals?.uniqueVisitors ?? '—'} delta={pct(summary?.deltas?.uniqueVisitorsPct)} />
            <Card title="Page Views" value={summary?.totals?.pageViews ?? '—'} delta={pct(summary?.deltas?.pageViewsPct)} />
            <Card title="Countries" value={summary?.totals?.countries ?? '—'} />
            <Card title="Top Page" value={summary?.totals?.topPage?.path ?? '—'} sub={formatCount(summary?.totals?.topPage?.views ?? 0, 'view')} />
          </div>

          {/* Time Series */}
          <div className="bg-[#c0c0c0] border-2 border-[#808080] p-3">
            <h3 className="text-base font-bold text-[#111] mb-3">Traffic over time</h3>
            <TimeSeriesChart range={range} />
          </div>

          {/* Visitor Map */}
          <div className="bg-[#c0c0c0] border-2 border-[#808080] p-3">
            <h3 className="text-base font-bold text-[#111] mb-3">Visitor Locations</h3>
            <VisitorMap points={geo} />
          </div>

          {/* Top Pages */}
          <div className="bg-[#c0c0c0] border-2 border-[#808080] p-3">
            <h3 className="text-base font-bold text-[#111] mb-3">Top Pages</h3>
            <div className="space-y-2">
              {pages.length === 0 && <div className="text-[#666]">No data</div>}
              {pages.slice(0, 10).map((p, i) => {
                const maxViews = Math.max(...pages.map(page => page.views))
                const calculatedPercent = maxViews > 0 ? (p.views / maxViews) * 100 : 0
                const scaledPercent = Math.max(calculatedPercent, 2)
                const availableWidth = 75
                const finalWidth = (scaledPercent / 100) * availableWidth
                
                return (
                  <div key={i} className="relative py-2 bg-white border border-[#808080]">
                    {/* Background bar */}
                    <div 
                      className="absolute inset-y-0 left-0"
                      style={{ 
                        width: `${finalWidth}%`,
                        backgroundColor: 'rgba(0, 0, 255, 0.15)'
                      }}
                    />
                    {/* Content */}
                    <div className="relative flex items-center justify-between px-2">
                      <div className="truncate max-w-[70%] text-sm text-[#111] font-medium">{p.path}</div>
                      <div className="text-[#111] text-xs bg-[#c0c0c0] px-2 py-1 border border-[#808080]">
                        {formatCount(p.uniques, 'visitor')} • {formatCount(p.views, 'view')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ title, value, sub, delta }: { title: string, value: string | number, sub?: string, delta?: string }) {
  return (
    <div className="bg-white border-2 border-[#808080] p-3">
      <div className="text-xs text-[#666] mb-1 font-bold">{title}</div>
      <div className="text-xl font-bold text-[#111]">{value}</div>
      {sub && <div className="text-xs text-[#666] mt-1">{sub}</div>}
      {delta && <div className={`text-xs mt-1 ${delta.startsWith('+') ? 'text-green-700' : 'text-red-700'}`}>{delta} vs previous</div>}
    </div>
  )
}

function pct(n?: number) {
  if (typeof n !== 'number' || !isFinite(n)) return undefined
  const s = (n >= 0 ? '+' : '') + n.toFixed(1) + '%'
  return s
}

function formatCount(count: number, singular: string, plural?: string) {
  const label = count === 1 ? singular : (plural ?? `${singular}s`)
  return `${count} ${label}`
}

