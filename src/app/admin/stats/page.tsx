'use client'

import { useEffect, useState } from 'react'
import VisitorMap from '@/app/components/VisitorMap'
import TimeSeriesChart from '@/app/components/TimeSeriesChart'

type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all'

const ranges: { key: RangeKey, label: string }[] = [
  { key: '24h', label: 'Last 24h' },
  { key: '7d', label: 'Last 7d' },
  { key: '30d', label: 'Last 30d' },
  { key: '1y', label: 'Last 365d' },
]

export default function StatsAdmin() {
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
    <div className="space-y-6">
      <div className="flex justify-start items-center">
        <div className="flex gap-2">
          {ranges.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1 text-sm rounded-none border transition-colors ${range === r.key ? 'bg-primary text-white border-primary' : 'bg-background text-foreground border-border/20 hover:border-border/40'}`}
              style={range === r.key ? { 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                borderColor: 'var(--primary)',
                // Force override any Tailwind defaults
                backgroundImage: 'none'
              } : {}}
            >{r.label}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      )}

      {!loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Page Views" value={summary?.totals?.pageViews ?? '—'} delta={pct(summary?.deltas?.pageViewsPct)} />
        <Card title="Unique Visitors" value={summary?.totals?.uniqueVisitors ?? '—'} delta={pct(summary?.deltas?.uniqueVisitorsPct)} />
        <Card title="Countries" value={summary?.totals?.countries ?? '—'} />
        <Card title="Top Page" value={summary?.totals?.topPage?.path ?? '—'} sub={`${summary?.totals?.topPage?.views ?? 0} views`} />
      </div>

          {/* Time Series (moved under cards) */}
          <TimeSeriesChart range={range} />

      {/* World Map Placeholder (keep simple without heavy map until styled) */}
      <div className="bg-background border border-border/20 rounded-none" style={{ 
        backgroundImage: `
          linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
        backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
      }}>
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Visitor Locations Map</h3>
          <VisitorMap points={geo} showMockData={true} />
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-background border border-border/20 rounded-none" style={{ 
        backgroundImage: `
          linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
        backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
      }}>
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Top Pages</h3>
          <div>
            {pages.length === 0 && <div className="text-muted-foreground">No data</div>}
            {pages.map((p, i) => {
              const maxViews = Math.max(...pages.map(page => page.views))
              const calculatedPercent = maxViews > 0 ? (p.views / maxViews) * 100 : 0
              // Ensure minimum 2% width for visibility (much smaller, more proportional)
              const scaledPercent = Math.max(calculatedPercent, 2)
              // Scale to fit within available space (leaving room for stats)
              const availableWidth = 75 // Use 75% of container width, leaving 25% for stats
              const finalWidth = (scaledPercent / 100) * availableWidth
              
              return (
                <div key={i} className="relative py-2">
                  {/* Background bar */}
                  <div 
                    className="absolute inset-y-0 left-0 rounded-none opacity-20"
                    style={{ 
                      width: `${finalWidth}%`,
                      backgroundColor: 'var(--accent)'
                    }}
                  />
                  {/* Content */}
                  <div className="relative flex items-center justify-between">
                    <div className="truncate max-w-[70%] text-foreground font-medium pl-3">{p.path}</div>
                    <div className="text-muted-foreground text-sm bg-background/80 px-2 py-1 rounded-sm">
                      {p.views} views • {p.uniques} uniques
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

function pct(n?: number) {
  if (typeof n !== 'number' || !isFinite(n)) return undefined
  const s = (n >= 0 ? '+' : '') + n.toFixed(1) + '%'
  return s
}

function Card({ title, value, sub, delta }: { title: string, value: string | number, sub?: string, delta?: string }) {
  return (
    <div className="bg-background border border-border/20 rounded-none p-4" style={{ 
      backgroundImage: `
        linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
      `,
      backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
      backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
    }}>
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      {delta && <div className={`text-xs ${delta.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{delta} vs previous period</div>}
    </div>
  )
}

