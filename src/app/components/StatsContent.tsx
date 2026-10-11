'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import VisitorMap from './VisitorMap'
import TimeSeriesChart from './TimeSeriesChart'
import StatsArtFlights from './StatsArtFlights'
import StatsArtPages from './StatsArtPages'
import RollingNumber from './RollingNumber'
import StatsDetailGrid from './StatsDetailGrid'
import DrawerSection from './DrawerSection'
import ChromeSegmentedControl from './ChromeSegmentedControl'
import { C64LoadingScreen, useC64LoaderVisible } from './C64SpriteLoader'
import { fetchStatsJson } from '@/lib/stats-fetch'
import 'flag-icons/css/flag-icons.min.css'
import {
  c64DrawerCardClass,
  c64DrawerCardCompactClass,
  c64DrawerStackClass,
} from '@/lib/c64-drawer-classes'

type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all'

const RANGE_OPTIONS: { id: RangeKey; label: string }[] = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '1y', label: '1y' },
]

const PRIOR_PERIOD_LABEL: Record<RangeKey, string> = {
  '24h': 'prior 24 hours',
  '7d': 'prior 7 days',
  '30d': 'prior 30 days',
  '1y': 'prior 12 months',
  all: 'prior period',
}

type CountryRow = { country: string; visitors: number; views: number }

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null

/** ISO 3166-1 alpha-2 → English name; anything else is shown as-is. */
function countryName(code: string) {
  if (!/^[A-Za-z]{2}$/.test(code)) return code
  try {
    return regionNames?.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

export default function StatsContent() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [summary, setSummary] = useState<{
    totals?: { pageViews?: number; uniqueVisitors?: number; countries?: number; topPage?: { path?: string; views?: number } };
    deltas?: { pageViewsPct?: number | null; uniqueVisitorsPct?: number | null; countriesPct?: number | null };
  } | null>(null)
  const [pages, setPages] = useState<{ path: string; views: number; uniques: number }[]>([])
  const [countries, setCountries] = useState<CountryRow[]>([])
  const [geo, setGeo] = useState<{ country: string; region: string | null; city: string | null; latitude: number | null; longitude: number | null; count: number }[]>([])
  // Start in the loading state so the first paint is the loader, not a frame of empty tiles
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Bumped per completed load: re-rolls the easter-egg art under the detail tables
  const [dataEpoch, setDataEpoch] = useState(0)
  // Full-screen loader only on first load; range changes keep the layout and dim it instead.
  const showLoader = useC64LoaderVisible(loading && !hasLoaded)

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
      fetchStatsJson<{ countries?: CountryRow[] }>(`/api/admin/stats/countries?${q}`, controller.signal),
    ])
      .then(([summaryRes, pagesRes, geoRes, countriesRes]) => {
        if (controller.signal.aborted) return
        // Cleared here, in the same batch as the data below, so nothing renders "loaded" with stale rows
        setLoading(false)

        const errors = [summaryRes.error, pagesRes.error, geoRes.error, countriesRes.error].filter(
          (e): e is string => Boolean(e),
        )
        if (errors.length === 4) {
          setLoadError(errors[0] ?? 'Could not load statistics.')
          return
        }

        if (summaryRes.data) setSummary(summaryRes.data)
        if (pagesRes.data) setPages(pagesRes.data.pages || [])
        if (countriesRes.data) setCountries(countriesRes.data.countries || [])
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
        setDataEpoch((n) => n + 1)
        if (errors.length > 0) {
          setLoadError('Some statistics could not be loaded.')
        } else {
          setHasLoaded(true)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [range])

  const topPages = pages
  const maxViews = Math.max(0, ...topPages.map((page) => page.views))
  const topCountries = countries
  const maxCountryViews = Math.max(0, ...topCountries.map((c) => c.views))
  const priorLabel = PRIOR_PERIOD_LABEL[range]

  return (
    <div className={`c64-stats-content c64-drawer-copy ${c64DrawerStackClass}`}>
      {/* Held back during the first load, so the loader has the page to itself and the blocks arrive together */}
      {!showLoader && (
        <div className="stats-toolbar">
          <ChromeSegmentedControl
            ariaLabel="Statistics date range"
            options={RANGE_OPTIONS}
            value={range}
            onChange={setRange}
          />
        </div>
      )}

      {showLoader ? (
        <C64LoadingScreen label="Loading statistics" />
      ) : null}

      {!showLoader && loadError ? (
        <div className={`${c64DrawerCardClass} p-6 text-center text-muted-foreground`}>
          <p>{loadError}</p>
        </div>
      ) : null}

      {!showLoader && !loadError && (
        <div
          className={`stats-body ${c64DrawerStackClass}`}
          data-refreshing={loading ? 'true' : undefined}
          aria-busy={loading}
        >
          <div className="stats-kpis">
            <Kpi
              label="Visitors"
              value={summary?.totals?.uniqueVisitors}
              delta={summary?.deltas?.uniqueVisitorsPct}
              priorLabel={priorLabel}
            />
            <Kpi
              label="Page views"
              value={summary?.totals?.pageViews}
              delta={summary?.deltas?.pageViewsPct}
              priorLabel={priorLabel}
            />
            <Kpi
              label="Countries"
              value={summary?.totals?.countries}
              delta={summary?.deltas?.countriesPct}
              priorLabel={priorLabel}
            />
          </div>

          <TimeSeriesChart range={range} />

          <DrawerSection title="Visitor locations" headingLevel="h3" className="stats-map-card">
            <VisitorMap points={geo} refreshing={loading} />
          </DrawerSection>

          <StatsDetailGrid epoch={dataEpoch}>
            <DrawerSection title="Top pages" headingLevel="h3">
              {topPages.length === 0 ? (
                <p className="stats-empty">No page views in this range.</p>
              ) : (
                <table className="stats-pages">
                  <thead>
                    <tr>
                      <th scope="col">Page</th>
                      <th scope="col" className="stats-pages__num">Visitors</th>
                      <th scope="col" className="stats-pages__num">Views</th>
                    </tr>
                  </thead>
                  {/* Keyed per load so the rows re-enter (staggered in globals.css) rather than swap in place */}
                  <tbody key={dataEpoch}>
                    {topPages.map((p, i) => (
                      <tr key={p.path} style={{ '--row': i } as CSSProperties}>
                        <th scope="row" className="stats-pages__page">
                          <span className="stats-pages__bar" style={{ width: barWidth(p.views, maxViews) }} aria-hidden />
                          <span className="stats-pages__path" title={p.path}>{p.path}</span>
                        </th>
                        <td className="stats-pages__num">{formatNumber(p.uniques)}</td>
                        <td className="stats-pages__num">{formatNumber(p.views)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <StatsArtPages resetKey={dataEpoch} />
            </DrawerSection>

            <DrawerSection title="Countries" headingLevel="h3">
              {topCountries.length === 0 ? (
                <p className="stats-empty">No visitor countries in this range.</p>
              ) : (
                <table className="stats-pages">
                  <thead>
                    <tr>
                      <th scope="col">Country</th>
                      <th scope="col" className="stats-pages__num">Visitors</th>
                      <th scope="col" className="stats-pages__num">Views</th>
                    </tr>
                  </thead>
                  <tbody key={dataEpoch}>
                    {topCountries.map((c, i) => {
                      const name = countryName(c.country)
                      return (
                        <tr key={c.country} style={{ '--row': i } as CSSProperties}>
                          <th scope="row" className="stats-pages__page">
                            <span
                              className="stats-pages__bar"
                              style={{ width: barWidth(c.views, maxCountryViews) }}
                              aria-hidden
                            />
                            <span className="stats-pages__path stats-pages__path--flag" title={name}>
                              <CountryFlag code={c.country} />
                              <span className="stats-pages__label">{name}</span>
                            </span>
                          </th>
                          <td className="stats-pages__num">{formatNumber(c.visitors)}</td>
                          <td className="stats-pages__num">{formatNumber(c.views)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
              <StatsArtFlights resetKey={dataEpoch} />
            </DrawerSection>
          </StatsDetailGrid>
        </div>
      )}
    </div>
  )
}

function Kpi({
  label,
  value,
  delta,
  priorLabel,
}: {
  label: string
  value?: number
  /** Percent change on the prior period; null when that period has no data to compare against. */
  delta?: number | null
  priorLabel?: string
}) {
  const deltaLabel = formatDelta(delta)
  return (
    <div className={`${c64DrawerCardCompactClass} stats-kpi`}>
      <h3 className="stats-kpi__label">{label}</h3>
      <div className="stats-kpi__value chrome-stat-value">
        {typeof value === 'number' && isFinite(value) ? <RollingNumber text={formatNumber(value)} /> : '—'}
      </div>
      {deltaLabel && typeof delta === 'number' && (
        <div className="stats-kpi__meta stats-kpi__meta--delta">
          <span className={delta >= 0 ? 'stats-delta c64-drawer-delta--up' : 'stats-delta c64-drawer-delta--down'}>
            <span aria-hidden>{delta >= 0 ? '↑' : '↓'}</span>
            <span className="sr-only">{delta >= 0 ? 'Up' : 'Down'}</span> <RollingNumber text={deltaLabel} slots={6} />
          </span>
          <span className="stats-kpi__compare">vs {priorLabel}</span>
        </div>
      )}
      {delta === null && <div className="stats-kpi__meta">No data in the {priorLabel}</div>}
    </div>
  )
}

function CountryFlag({ code }: { code: string }) {
  const known = /^[A-Za-z]{2}$/.test(code)
  return (
    <span
      className={known ? `stats-flag fi fi-${code.toLowerCase()}` : 'stats-flag stats-flag--unknown'}
      aria-hidden
    />
  )
}

/** Bar share of the column maximum, with a floor so the smallest rows still register. */
function barWidth(value: number, max: number) {
  return `${max > 0 ? Math.max((value / max) * 100, 1.5) : 0}%`
}

function formatNumber(n?: number) {
  return typeof n === 'number' && isFinite(n) ? n.toLocaleString('en-US') : '—'
}

/** Magnitude only — direction is carried by the arrow and colour. */
function formatDelta(n?: number | null) {
  if (typeof n !== 'number' || !isFinite(n)) return undefined
  const abs = Math.abs(n)
  return `${abs >= 10 ? Math.round(abs).toLocaleString('en-US') : abs.toFixed(1)}%`
}
