'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Listbox } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { c64DrawerCardClass, c64DrawerSectionHeaderClass, c64DrawerSectionHeadingClass } from '@/lib/c64-drawer-classes'
import { fetchStatsJson } from '@/lib/stats-fetch'

type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all'
type AggKey = 'hour' | 'day' | 'week' | 'month' | 'quarter'

function formatAggLabel(agg: AggKey): string {
  return agg.charAt(0).toUpperCase() + agg.slice(1)
}

function getSiteCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const root = document.getElementById('c64-site-root') ?? document.documentElement
  return getComputedStyle(root).getPropertyValue(name).trim() || fallback
}

interface Point {
  t: string
  views: number
  visitors: number
}

export default function TimeSeriesChart({ range }: { range: RangeKey }) {
  const [agg, setAgg] = useState<AggKey>('day')
  const [allowedAggs, setAllowedAggs] = useState<AggKey[]>(['day'])
  const [points, setPoints] = useState<Point[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)
  const clipPathId = useRef<string>(`ts-clip-${Math.random().toString(36).slice(2)}`)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [chartHeight, setChartHeight] = useState<number>(240)
  const [themeEpoch, setThemeEpoch] = useState(0)

  useEffect(() => {
    const onTheme = () => setThemeEpoch((n) => n + 1)
    window.addEventListener('c64-settings-changed', onTheme)
    return () => window.removeEventListener('c64-settings-changed', onTheme)
  }, [])

  // Fetch data whenever range or aggregation changes
  useEffect(() => {
    const controller = new AbortController()
    fetchStatsJson<{
      allowedAggs?: AggKey[]
      agg?: AggKey
      points?: Point[]
    }>(`/api/admin/stats/timeseries?range=${range}&agg=${agg}`, controller.signal).then(
      ({ data, error }) => {
        if (controller.signal.aborted || !data) return
        if (error) return
        if (data.allowedAggs) setAllowedAggs(data.allowedAggs)
        if (data.agg) setAgg(data.agg)
        setPoints(data.points || [])
      },
    )
    return () => controller.abort()
  }, [range, agg])

  useMemo(() => allowedAggs.length === 1, [allowedAggs])

  // Track container size for responsive redraws
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width)
        setContainerWidth(w)
        // Derive a responsive height (taller on wider screens)
        const h = Math.max(180, Math.min(320, Math.round(w * 0.45)))
        setChartHeight(h)
      }
    })
    ro.observe(el)
    // initialize
    setContainerWidth(el.clientWidth || 800)
    const initH = Math.max(180, Math.min(320, Math.round((el.clientWidth || 800) * 0.45)))
    setChartHeight(initH)
    return () => ro.disconnect()
  }, [])

  // Draw chart
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    el.innerHTML = ''

    const width = containerWidth || el.clientWidth || 800
    const height = chartHeight
    const margin = { top: 12, right: 12, bottom: width < 420 ? 36 : 28, left: 40 }

    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    if (!points.length) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .text('No data')
      return
    }

    const parseTime = (s: string) => new Date(s)
    const data = points.map(p => ({
      date: parseTime(p.t),
      views: p.views,
      visitors: p.visitors,
    }))

    // Build x-domain. For 24h/hour, use viewer local time and make the last tick the current hour.
    let xDomain: [Date, Date]
    if (agg === 'hour') {
      // Los Angeles timezone alignment for 24h
      const now = new Date()
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: '2-digit' })
      const hour = Number(fmt.format(now))
      const la = new Date(now)
      la.setMinutes(0, 0, 0)
      la.setHours(hour)
      const endHour = la
      const startHour = new Date(endHour)
      startHour.setHours(endHour.getHours() - 23)
      xDomain = [startHour, endHour]
    } else if (agg === 'day') {
      // Ensure the last tick is the current LA day
      const now = new Date()
      const laFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' })
      const parts = laFmt.formatToParts(now)
      const y = Number(parts.find(p => p.type === 'year')?.value)
      const m = Number(parts.find(p => p.type === 'month')?.value)
      const dnum = Number(parts.find(p => p.type === 'day')?.value)
      // Construct a date at LA local midnight by using the components, then let JS treat as local
      const laStartToday = new Date(y, m - 1, dnum, 0, 0, 0, 0)
      const endDay = new Date(laStartToday.getTime())
      const start = d3.min(data, d => d.date) || new Date(laStartToday.getTime() - 30 * 24 * 3600 * 1000)
      xDomain = [start, endDay]
    } else {
      xDomain = d3.extent(data, d => d.date) as [Date, Date]
    }

    const x = d3
      .scaleTime()
      .domain(xDomain)
      .range([margin.left, width - margin.right])

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.views, d.visitors)) || 1])
      .nice()
      .range([height - margin.bottom, margin.top])

    // Precompute fixed 4 y ticks (0 + 3 steps)
    const yMax = y.domain()[1]
    const yTicks = d3.ticks(0, yMax, 3)

    // Axis ticks: choose intelligently per range/agg
    const domain: [Date, Date] = xDomain

    const computeTicks = (start: Date, end: Date) => {
      let ticks: Date[] = []
      let kind: 'hour' | 'day' | 'week' | 'month' | 'quarter' = agg
      if (agg === 'hour') {
        // Ensure local 24 hourly ticks ending at current hour
        const now = new Date()
        const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: '2-digit' })
        const hour = Number(fmt.format(now))
        const endHour = new Date(now)
        endHour.setMinutes(0, 0, 0)
        endHour.setHours(hour)
        const startHour = new Date(endHour)
        startHour.setHours(endHour.getHours() - 23)
        ticks = d3.timeHour.range(startHour, d3.timeHour.offset(endHour, 1), 1)
      } else if (agg === 'day') {
        const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000)))
        if (totalDays <= 35) { ticks = d3.timeDay.range(d3.timeDay.floor(start), d3.timeDay.ceil(end), 1); kind = 'day' }
        else { ticks = d3.timeMonth.range(d3.timeMonth.floor(start), d3.timeMonth.ceil(end), 1); kind = 'month' }
      } else if (agg === 'week') {
        const totalWeeks = Math.max(1, Math.round((end.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000)))
        if (totalWeeks > 20) { // too dense → use months
          ticks = d3.timeMonth.range(d3.timeMonth.floor(start), d3.timeMonth.ceil(end), 1);
          kind = 'month'
        } else {
          // show weekly but cap count by stepping
          const step = Math.max(1, Math.ceil(totalWeeks / 12))
          ticks = d3.timeWeek.range(d3.timeWeek.floor(start), d3.timeWeek.ceil(end), step)
          kind = 'week'
        }
      } else if (agg === 'month') {
        ticks = d3.timeMonth.range(d3.timeMonth.floor(start), d3.timeMonth.ceil(end), 1)
        kind = 'month'
      } else {
        // quarter
        ticks = d3.timeMonth.range(d3.timeMonth.floor(start), d3.timeMonth.ceil(end), 3)
        kind = 'quarter'
      }
      return { ticks, kind }
    }

    const tickResult = computeTicks(domain[0], domain[1])
    let tickValues = tickResult.ticks
    const tickKind = tickResult.kind
    // Filter ticks for small widths to avoid overcrowding
    const maxTicks = Math.max(4, Math.floor((width - margin.left - margin.right) / 80))
    if (tickValues.length > maxTicks) {
      const step = Math.ceil(tickValues.length / maxTicks)
      tickValues = tickValues.filter((_, i) => i % step === 0)
    }

    const formatQuarter = (d: Date) => `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`

    const xAxis = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(
          d3
            .axisBottom<Date>(x)
            .tickValues(tickValues)
            .tickSizeOuter(0)
            .tickFormat((d: Date) => {
              if (agg === 'hour') return d3.timeFormat('%-I%p')(d)
              if (agg === 'day') {
                if (tickKind === 'month') return d3.timeFormat('%b %Y')(d)
                return d3.timeFormat('%-m/%-d')(d)
              }
              if (agg === 'week') {
                if (tickKind === 'month') return d3.timeFormat('%b %Y')(d)
                return `W${d3.timeFormat('%V')(d)}`
              }
              if (agg === 'month') return d3.timeFormat('%b %Y')(d)
              return formatQuarter(d)
            })
        )

    // Add year on a second line at year boundaries for supported aggregates
    const usingMonthTicks = tickValues.length >= 2 && (tickValues[1].getTime() - tickValues[0].getTime()) >= 28 * 24 * 3600 * 1000
    const isYearBoundary = (d: Date) => {
      if (agg === 'day' && usingMonthTicks) return d.getMonth() === 0 && d.getDate() === 1
      if (agg === 'month') return d.getMonth() === 0
      if (agg === 'quarter') return d.getMonth() === 0 // Q1
      if (agg === 'week') return d.getMonth() === 0 && d.getDate() <= 7
      return false
    }

    svg
      .select<SVGGElement>('.x-axis')
      .selectAll<SVGGElement, Date>('g.tick')
      .each(function (d: Date) {
        if (!isYearBoundary(d)) return
        const tick = d3.select(this)
        const text = tick.select<SVGTextElement>('text')
        const current = text.text()
        text.text(null)
        text.append('tspan').attr('x', 0).text(current)
        text.append('tspan').attr('x', 0).attr('dy', '1.1em').text(String(d.getFullYear()))
      })

    const yAxis = (g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
      g
        .attr('transform', `translate(${margin.left},0)`) 
        .call(d3.axisLeft(y).tickValues(yTicks).tickSizeOuter(0))
    }

    const xAxisSelection = svg.append('g').attr('class', 'x-axis') as unknown as d3.Selection<SVGGElement, unknown, null, undefined>
    xAxisSelection.call(xAxis)
    // Small screens: shrink/tilt x labels for readability
    if (width < 420) {
      svg.select('.x-axis').selectAll('text')
        .style('font-size', '10px')
      if (width < 360) {
        svg.select('.x-axis').selectAll('text')
          .attr('transform', 'rotate(-20)')
          .style('text-anchor', 'end')
      }
    }
    const yAxisSelection = svg.append('g').attr('class', 'y-axis') as unknown as d3.Selection<SVGGElement, unknown, null, undefined>
    yAxisSelection.call(yAxis)

    // Horizontal gridlines aligned to y ticks; baseline solid, others dotted
    const borderColor =
      getSiteCssVar('--chrome-border', '') ||
      getComputedStyle(document.documentElement).getPropertyValue('--border').trim() ||
      '#334155'
    const grid = svg.append('g').attr('class', 'y-grid')
    grid
      .selectAll('line')
      .data(yTicks)
      .join('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', borderColor)
      .attr('stroke-width', d => (d === 0 ? 1.5 : 1))
      .attr('stroke-dasharray', d => (d === 0 ? null : '2,4'))
      .attr('opacity', d => (d === 0 ? 1 : 0.8))

    // Clip region so lines never draw outside the plotting area
    const defs = svg.append('defs')
    defs
      .append('clipPath')
      .attr('id', clipPathId.current)
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)

    const viewsColor = getSiteCssVar('--chrome-chart-views', getSiteCssVar('--chrome-accent', '#0071e3'))
    const visitorsColor = getSiteCssVar('--chrome-chart-visitors', '#34c759')
    const tipFill = getSiteCssVar('--chrome-card-bg', '') ||
      getComputedStyle(document.documentElement).getPropertyValue('--background').trim() ||
      '#ffffff'
    const tipStroke = getSiteCssVar('--chrome-border', '') ||
      getComputedStyle(document.documentElement).getPropertyValue('--border').trim() ||
      '#e5e5ea'
    const tipTextFill = getSiteCssVar('--chrome-text', '') ||
      getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim() ||
      '#1d1d1f'

    const line = d3
      .line<{ date: Date; value: number }>()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX)

    const seriesViews = data.map(d => ({ date: d.date, value: d.views }))
    const seriesVisitors = data.map(d => ({ date: d.date, value: d.visitors }))

    const plot = svg.append('g').attr('clip-path', `url(#${clipPathId.current})`)

    plot
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', viewsColor)
      .attr('stroke-width', 2)
      .attr('d', line(seriesViews)!)

    plot
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', visitorsColor)
      .attr('stroke-width', 2)
      .attr('d', line(seriesVisitors)!)

    // SVG legend removed; legend is rendered inline with the title

    // ---------- Tooltip (vertical rule + floating module) ----------
    const fmtHour = (d: Date) => d3.timeFormat('%b %-d, %-I%p')(d)
    const fmtDay = (d: Date) => d3.timeFormat('%b %-d, %Y')(d)
    const fmtWeek = (d: Date) => `W${d3.timeFormat('%V')(d)} ${d.getFullYear()}`
    const fmtMonth = (d: Date) => d3.timeFormat('%b %Y')(d)
    const fmtQuarter = (d: Date) => `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`

    const formatLabel = (d: Date) => {
      if (agg === 'hour') return fmtHour(d)
      if (agg === 'day') return fmtDay(d)
      if (agg === 'week') return fmtWeek(d)
      if (agg === 'month') return fmtMonth(d)
      return fmtQuarter(d)
    }

    const bisect = d3.bisector<{ date: Date } , Date>(d => d.date).left

    const tip = svg.append('g').style('display', 'none')
    const tipLine = tip.append('line')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .style('stroke', 'var(--foreground)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')

    const tipBox = tip.append('g')
    const tipRect = tipBox.append('rect')
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('fill', tipFill)
      .attr('stroke', tipStroke)
    const tipText = tipBox.append('text')
      .attr('fill', tipTextFill)
      .attr('font-size', 12)
      .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')

    const updateTip = (xm: number, ym?: number) => {
      // clamp to plot area
      const xClamped = Math.max(margin.left, Math.min(width - margin.right, xm))
      const xDate = x.invert(xClamped)
      let i = bisect(data, xDate)
      if (i > 0 && i < data.length) {
        const d0 = data[i - 1]
        const d1 = data[i]
        i = xDate.getTime() - d0.date.getTime() > d1.date.getTime() - xDate.getTime() ? i : i - 1
      } else if (i >= data.length) {
        i = data.length - 1
      }
      const p = data[i]
      const xPos = x(p.date)
      tipLine.attr('x1', xPos).attr('x2', xPos)

      // Build tooltip text
      const lines = [
        formatLabel(p.date),
        `Views: ${p.views}`,
        `Visitors: ${p.visitors}`,
      ]
      tipText.selectAll('tspan').remove()
      const innerPX = 10
      const innerPY = 8
      tipText.attr('x', innerPX).attr('y', innerPY + 12)
      lines.forEach((l, idx) => {
        tipText
          .append('tspan')
          .attr('x', innerPX)
          .attr('dy', idx === 0 ? 0 : 16)
          .text(l)
      })
      const bbox = (tipText.node() as SVGTextElement).getBBox()
      tipRect
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', bbox.width + innerPX * 2)
        .attr('height', bbox.height + innerPY * 2)

      // Position box left or right of the rule depending on space
      const boxWidth = bbox.width + innerPX * 2
      const boxHeight = bbox.height + innerPY * 2
      const pad = 8
      let boxX = xPos + pad
      if (xPos + pad + boxWidth > width - margin.right) boxX = xPos - pad - boxWidth
      // If mouse y provided, follow it; otherwise default to mid value
      const targetY = ym !== undefined ? ym : y((p.views + p.visitors) / 2)
      const boxY = Math.max(margin.top, Math.min(height - margin.bottom - boxHeight, targetY - boxHeight / 2))
      tipBox.attr('transform', `translate(${boxX}, ${boxY})`)
    }

    svg.append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mouseenter', () => tip.style('display', null))
      .on('mousemove', function (event: MouseEvent) {
        // Compute mouse position relative to the SVG using d3.pointer
        const [mx, my] = d3.pointer(event, this)
        updateTip(mx, my)
      })
      .on('mouseleave', () => tip.style('display', 'none'))

  }, [points, agg, containerWidth, chartHeight, themeEpoch])

  return (
    <section className={c64DrawerCardClass}>
        <div className={c64DrawerSectionHeaderClass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <h2 className={c64DrawerSectionHeadingClass}>
              Traffic over time
            </h2>
            {/* Legend inline with title */}
            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="stats-chart-legend-dot--views inline-block h-2.5 w-2.5 rounded-full" />
                <span>Views</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="stats-chart-legend-dot--visitors inline-block h-2.5 w-2.5 rounded-full" />
                <span>Visitors</span>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <Listbox value={agg} onChange={setAgg} disabled={allowedAggs.length === 1}>
              <div className="relative">
                <Listbox.Button
                  className="chrome-select__trigger"
                  disabled={allowedAggs.length === 1}
                >
                  {formatAggLabel(agg)}
                  <ChevronDownIcon className="chrome-select__chevron" aria-hidden />
                </Listbox.Button>
                <Listbox.Options className="chrome-select__options">
                  {allowedAggs.map((option) => (
                    <Listbox.Option key={option} value={option} className="chrome-select__option">
                      {formatAggLabel(option)}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
          </div>
        </div>
        <div ref={containerRef} className="w-full" style={{ height: chartHeight }} />
    </section>
  )
}


