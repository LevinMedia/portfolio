'use client'

import React, { useEffect, useState } from 'react'
import VisitorMap from './VisitorMap'
import TimeSeriesChart from './TimeSeriesChart'
import Next95Button from './Next95Button'

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
    <div className="w-full max-w-[1280px] mx-auto">
      {/* Range Selector - Sticky */}
      <div 
        className="sticky top-0 z-10 py-2 -mx-4 px-4 border-b-2 mb-4"
        style={{
          backgroundColor: 'var(--win95-button-face, #c0c0c0)',
          borderColor: 'var(--win95-border-mid, #808080)'
        }}
      >
        <div className="grid grid-cols-2 @[600px]:grid-cols-4 gap-2 w-full">
          {ranges.map(r => (
            <Next95Button
              key={r.key}
              onClick={() => setRange(r.key)}
              isActive={range === r.key}
              className="w-full px-4 py-2 text-sm"
            >
              {r.label}
            </Next95Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8" style={{ color: 'var(--win95-text, #111)' }}>Loading...</div>
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
        <div 
          className="border-2 p-3"
          style={{
            backgroundColor: 'var(--win95-content-bg, #ffffff)',
            borderColor: 'var(--win95-border-mid, #808080)'
          }}
        >
            <h3 className="text-base font-bold mb-3" style={{ color: 'var(--win95-text, #111)' }}>Traffic over time</h3>
            <TimeSeriesChart range={range} />
          </div>

          {/* Visitor Map */}
          <div 
            className="border-2 p-3"
            style={{
            backgroundColor: 'var(--win95-content-bg, #ffffff)',
              borderColor: 'var(--win95-border-mid, #808080)'
            }}
          >
            <h3 className="text-base font-bold mb-3" style={{ color: 'var(--win95-text, #111)' }}>Visitor Locations</h3>
            <VisitorMap points={geo} />
          </div>

          {/* Top Pages */}
          <div 
            className="border-2 p-3"
            style={{
            backgroundColor: 'var(--win95-content-bg, #ffffff)',
              borderColor: 'var(--win95-border-mid, #808080)'
            }}
          >
            <h3 className="text-base font-bold mb-3" style={{ color: 'var(--win95-text, #111)' }}>Top Pages</h3>
            <div className="space-y-2">
              {pages.length === 0 && <div style={{ color: 'var(--win95-content-text, #666)' }}>No data</div>}
              {pages.slice(0, 10).map((p, i) => {
                const maxViews = Math.max(...pages.map(page => page.views))
                const calculatedPercent = maxViews > 0 ? (p.views / maxViews) * 100 : 0
                const scaledPercent = Math.max(calculatedPercent, 2)
                const availableWidth = 75
                const finalWidth = (scaledPercent / 100) * availableWidth
                
                return (
                  <div 
                    key={i} 
                    className="relative py-2 border"
                    style={{
                      backgroundColor: 'var(--win95-content-bg, #ffffff)',
                      borderColor: 'var(--win95-border-mid, #808080)',
                      color: 'var(--win95-content-text, #000000)'
                    }}
                  >
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
                      <div className="truncate max-w-[70%] text-sm font-medium" style={{ color: 'var(--win95-content-text, #111)' }}>{p.path}</div>
                      <div 
                        className="text-xs px-2 py-1 border"
                        style={{
                          color: 'var(--win95-text, #111)',
                          backgroundColor: 'var(--win95-button-face, #c0c0c0)',
                          borderColor: 'var(--win95-border-mid, #808080)'
                        }}
                      >
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
    <div 
      className="border-2 p-3"
      style={{
        backgroundColor: 'var(--win95-content-bg, #ffffff)',
        borderColor: 'var(--win95-border-mid, #808080)'
      }}
    >
      <div className="text-xs mb-1 font-bold" style={{ color: 'var(--win95-content-text, #666)' }}>{title}</div>
      <div className="text-xl font-bold" style={{ color: 'var(--win95-content-text, #111)' }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--win95-content-text, #666)' }}>{sub}</div>}
      {delta && <div className={`text-xs mt-1`} style={{ color: delta.startsWith('+') ? '#006400' : '#8b0000' }}>{delta} vs previous</div>}
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

