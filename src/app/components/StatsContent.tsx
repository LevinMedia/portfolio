'use client'

import { useEffect, useState } from 'react'
import VisitorMap from './VisitorMap'
import TimeSeriesChart from './TimeSeriesChart'
import DrawerSection from './DrawerSection'
import ChromeSegmentedControl from './ChromeSegmentedControl'
import { C64LoadingScreen, useC64LoaderVisible } from './C64SpriteLoader'
import { fetchStatsJson } from '@/lib/stats-fetch'
import {
  c64DrawerCardClass,
  c64DrawerCardCompactClass,
  c64DrawerSectionHeadingClass,
  c64DrawerStackClass,
} from '@/lib/c64-drawer-classes'

type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all'

const RANGE_OPTIONS: { id: RangeKey; label: string }[] = [
  { id: '24h', label: 'Last 24h' },
  { id: '7d', label: 'Last 7d' },
  { id: '30d', label: 'Last 30d' },
  { id: '1y', label: 'Last 365d' },
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const showLoader = useC64LoaderVisible(loading)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)

    const q = `range=${range}`
    Promise.all([
      fetchStatsJson<typeof summary>(`/api/admin/stats/summary?${q}`, controller.signal),
      fetchStatsJson<{ pages?: { path: string; views: number; uniques: number }[] }>(
        `/api/admin/stats/top-pages?${q}`,
        controller.signal,
      ),
      fetchStatsJson<{
        points?: {
          country: string
          region?: string
          city?: string
          latitude?: number
          longitude?: number
          count: number
        }[]
      }>(`/api/admin/stats/geo?${q}`, controller.signal),
    ])
      .then(([summaryRes, pagesRes, geoRes]) => {
        if (controller.signal.aborted) return

        const errors = [summaryRes.error, pagesRes.error, geoRes.error].filter(
          (e): e is string => Boolean(e),
        )
        if (errors.length === 3) {
          setLoadError(errors[0] ?? 'Could not load statistics.')
          return
        }

        if (summaryRes.data) setSummary(summaryRes.data)
        if (pagesRes.data) setPages(pagesRes.data.pages || [])
        if (geoRes.data) {
          setGeo(
            (geoRes.data.points || []).map((p) => ({
              country: p.country,
              region: p.region ?? null,
              city: p.city ?? null,
              latitude: p.latitude ?? null,
              longitude: p.longitude ?? null,
              count: p.count,
            })),
          )
        }
        if (errors.length > 0) {
          setLoadError('Some statistics could not be loaded.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [range])

  return (
    <div className={`c64-stats-content c64-drawer-copy ${c64DrawerStackClass}`}>
      <DrawerSection title="Range" ariaLabel="Date range">
        <ChromeSegmentedControl
          ariaLabel="Statistics date range"
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
        />
      </DrawerSection>

      {showLoader ? (
        <C64LoadingScreen label="Loading statistics" />
      ) : null}

      {!showLoader && loadError ? (
        <div className={`${c64DrawerCardClass} p-6 text-center text-muted-foreground`}>
          <p>{loadError}</p>
        </div>
      ) : null}

      {!showLoader && !loadError && (
        <>
          <TimeSeriesChart range={range} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card title="Visitors" value={summary?.totals?.uniqueVisitors ?? '—'} delta={pct(summary?.deltas?.uniqueVisitorsPct)} />
            <Card title="Page Views" value={summary?.totals?.pageViews ?? '—'} delta={pct(summary?.deltas?.pageViewsPct)} />
            <Card title="Countries" value={summary?.totals?.countries ?? '—'} />
            <Card title="Top Page" value={summary?.totals?.topPage?.path ?? '—'} sub={formatCount(summary?.totals?.topPage?.views ?? 0, 'view')} />
          </div>

          <DrawerSection title="Visitor locations" headingLevel="h3">
            <VisitorMap points={geo} />
          </DrawerSection>

          <DrawerSection title="Top pages" headingLevel="h3">
            <div className="space-y-2 c64-prose">
              {pages.length === 0 && <div className="text-muted-foreground">No data</div>}
              {pages.slice(0, 10).map((p, i) => {
                const maxViews = Math.max(...pages.map(page => page.views))
                const calculatedPercent = maxViews > 0 ? (p.views / maxViews) * 100 : 0
                const scaledPercent = Math.max(calculatedPercent, 2)
                const availableWidth = 75
                const finalWidth = (scaledPercent / 100) * availableWidth

                return (
                  <div key={i} className="relative py-2">
                    <div
                      className="stats-top-page-bar absolute inset-y-0 left-0 opacity-30"
                      style={{ width: `${finalWidth}%` }}
                    />
                    <div className="relative flex min-w-0 items-center gap-2 pl-3">
                      <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {p.path}
                      </div>
                      <div className="stats-top-page-badge shrink-0 whitespace-nowrap text-sm text-muted-foreground px-2 py-1">
                        {formatCount(p.uniques, 'visitor')} • {formatCount(p.views, 'view')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </DrawerSection>
        </>
      )}
    </div>
  )
}

function Card({ title, value, sub, delta }: { title: string, value: string | number, sub?: string, delta?: string }) {
  return (
    <div className={`${c64DrawerCardCompactClass} flex flex-col min-h-[5.5rem]`}>
      <h3 className={c64DrawerSectionHeadingClass}>{title}</h3>
      <div className="chrome-stat-value text-lg text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1 normal-case tracking-normal">{sub}</div>}
      {delta && (
        <div
          className={`text-xs mt-1 normal-case tracking-normal ${
            delta.startsWith('+') ? 'c64-drawer-delta--up' : 'c64-drawer-delta--down'
          }`}
        >
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
