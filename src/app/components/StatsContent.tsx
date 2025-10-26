'use client'

import { useEffect, useState } from 'react'
import VisitorMap from './VisitorMap'

type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all'

const ranges: { key: RangeKey, label: string }[] = [
  { key: '24h', label: 'Last 24h' },
  { key: '7d', label: 'Last 7d' },
  { key: '30d', label: 'Last 30d' },
  { key: '1y', label: 'Last 365d' },
  { key: 'all', label: 'All time' },
]

export default function StatsContent() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [summary, setSummary] = useState<{
    totals?: { pageViews?: number; uniqueVisitors?: number; countries?: number; topPage?: { path?: string; views?: number } };
    deltas?: { pageViewsPct?: number; uniqueVisitorsPct?: number };
  } | null>(null)
  const [pages, setPages] = useState<{ path: string; views: number; uniques: number }[]>([])
  const [geo, setGeo] = useState<{ country: string; region?: string; city?: string; latitude?: number; longitude?: number; count: number }[]>([])
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
      setGeo(g.points || [])
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card title="Page Views" value={summary?.totals?.pageViews ?? '—'} delta={pct(summary?.deltas?.pageViewsPct)} />
            <Card title="Unique Visitors" value={summary?.totals?.uniqueVisitors ?? '—'} delta={pct(summary?.deltas?.uniqueVisitorsPct)} />
            <Card title="Countries" value={summary?.totals?.countries ?? '—'} />
            <Card title="Top Page" value={summary?.totals?.topPage?.path ?? '—'} sub={`${summary?.totals?.topPage?.views ?? 0} views`} />
          </div>

          {/* Visitor Map */}
          <div className="bg-background border border-border/20 rounded-none p-4" style={{ 
            backgroundImage: `
              linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
            backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
          }}>
            <h3 className="text-lg font-medium text-foreground mb-4">Visitor Locations</h3>
            <VisitorMap points={geo} showMockData={true} />
          </div>

          {/* Top Pages */}
          <div className="bg-background border border-border/20 rounded-none p-4" style={{ 
            backgroundImage: `
              linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
            backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
          }}>
            <h3 className="text-lg font-medium text-foreground mb-4">Top Pages</h3>
            <div className="space-y-2">
              {pages.length === 0 && <div className="text-muted-foreground">No data</div>}
              {pages.slice(0, 10).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/10 last:border-b-0">
                  <div className="truncate max-w-[70%] text-sm text-foreground">{p.path}</div>
                  <div className="text-muted-foreground text-sm">{p.views} views • {p.uniques} unique</div>
                </div>
              ))}
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
      <div className="text-xs text-muted-foreground mb-1">{title}</div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      {delta && <div className={`text-xs ${delta.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{delta}</div>}
    </div>
  )
}
