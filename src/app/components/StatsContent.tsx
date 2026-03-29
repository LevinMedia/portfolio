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

const boxClass =
  'border-4 border-[var(--c64-accent)] bg-[var(--c64-screen-bg)] c64-petscii-frame c64-screen-grid'

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
    <div className="c64-stats-content space-y-6 sm:space-y-8">
      <section className={`${boxClass} p-4 sm:p-5`} aria-label="Date range">
        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--c64-accent)] mb-3 border-b-4 border-[var(--c64-accent)] pb-2">
          Range
        </h2>
        <div className="flex flex-wrap gap-2">
          {ranges.map(r => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`px-3 py-2 text-sm rounded-none border-2 transition-colors min-h-10 ${
                range === r.key
                  ? 'bg-[var(--c64-accent)] text-[var(--c64-border-bg)] border-[var(--c64-accent)]'
                  : 'bg-[var(--c64-border-bg)]/30 text-foreground border-[var(--c64-accent)]/50 hover:border-[var(--c64-accent)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <div className={`${boxClass} p-8 text-center text-foreground/70`}>Loading…</div>
      )}

      {!loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card title="Visitors" value={summary?.totals?.uniqueVisitors ?? '—'} delta={pct(summary?.deltas?.uniqueVisitorsPct)} />
            <Card title="Page Views" value={summary?.totals?.pageViews ?? '—'} delta={pct(summary?.deltas?.pageViewsPct)} />
            <Card title="Countries" value={summary?.totals?.countries ?? '—'} />
            <Card title="Top Page" value={summary?.totals?.topPage?.path ?? '—'} sub={formatCount(summary?.totals?.topPage?.views ?? 0, 'view')} />
          </div>

          {/* Time Series (moved under cards) */}
          <TimeSeriesChart range={range} />

          {/* Visitor Map */}
          <section className={`${boxClass} p-5 sm:p-7`}>
            <h3 className="text-lg sm:text-xl font-bold uppercase tracking-[0.1em] text-[var(--c64-accent)] mb-5 border-b-4 border-[var(--c64-accent)] pb-3">
              Visitor locations
            </h3>
            <VisitorMap points={geo} />
          </section>

          {/* Top Pages */}
          <section className={`${boxClass} p-5 sm:p-7`}>
            <h3 className="text-lg sm:text-xl font-bold uppercase tracking-[0.1em] text-[var(--c64-accent)] mb-5 border-b-4 border-[var(--c64-accent)] pb-3">
              Top pages
            </h3>
            <div className="space-y-2 c64-prose">
              {pages.length === 0 && <div className="text-foreground/65">No data</div>}
              {pages.slice(0, 10).map((p, i) => {
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
                    <div className="relative flex min-w-0 items-center gap-2 pl-3">
                      <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {p.path}
                      </div>
                      <div className="shrink-0 whitespace-nowrap text-sm text-foreground/75 bg-[var(--c64-border-bg)]/50 border border-[var(--c64-accent)]/25 px-2 py-1 rounded-none">
                        {formatCount(p.uniques, 'visitor')} • {formatCount(p.views, 'view')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Card({ title, value, sub, delta }: { title: string, value: string | number, sub?: string, delta?: string }) {
  return (
    <div
      className={`${boxClass} p-4 sm:p-5 flex flex-col min-h-[5.5rem]`}
    >
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--c64-accent)]/90 mb-2 border-b-2 border-[var(--c64-accent)]/40 pb-1">
        {title}
      </div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      {sub && <div className="text-xs text-foreground/65 mt-1">{sub}</div>}
      {delta && (
        <div className={`text-xs mt-1 ${delta.startsWith('+') ? 'text-green-500' : 'text-red-400'}`}>
          {delta} vs previous period
        </div>
      )}
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
