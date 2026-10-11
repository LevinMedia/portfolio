'use client'

import { useMemo, type CSSProperties } from 'react'
import { clamp, seededRandom, useStatsArtStage } from '@/app/hooks/useStatsArtStage'

type Point = { x: number; y: number }
type Route = { d: string; length: number }
type Flight = Route & { duration: number; delay: number; rest: number }

const PAD = 6
/** Below this drawable height there is only room for a single hop. */
const VIGNETTE_HEIGHT = 136
const PLANE_SPEED = 26 // px per second
const FLIGHT_SHARE = 0.6 // portion of each loop spent in the air

function quadLength(a: Point, c: Point, b: Point) {
  let length = 0
  let prev = a
  for (let i = 1; i <= 16; i++) {
    const t = i / 16
    const p = {
      x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
      y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
    }
    length += Math.hypot(p.x - prev.x, p.y - prev.y)
    prev = p
  }
  return length
}

function route(a: Point, c: Point, b: Point): Route {
  const r = (n: number) => Math.round(n * 10) / 10
  return {
    d: `M${r(a.x)},${r(a.y)} Q${r(c.x)},${r(c.y)} ${r(b.x)},${r(b.y)}`,
    length: quadLength(a, c, b),
  }
}

/**
 * A small route network sized to the space: more height adds cities and legs, never bigger glyphs.
 * Everything is drawn from the seed in a fixed order, so the same view keeps its layout on resize.
 */
function buildScene(seed: number, width: number, height: number) {
  const rand = seededRandom(seed)
  const cities: Point[] = []
  const routes: Route[] = []
  const links = new Map<number, number>()
  const link = (i: number) => links.set(i, (links.get(i) ?? 0) + 1)

  if (height < VIGNETTE_HEIGHT) {
    // One hop across the card, arcing up to just under the top edge
    const y = height - PAD - rand() * 6
    const a = { x: width * (0.1 + rand() * 0.1), y }
    const b = { x: width * (0.8 + rand() * 0.1), y: y - rand() * 6 }
    const peak = { x: (a.x + b.x) / 2 + (rand() - 0.5) * width * 0.2, y: y - 2 * (y - PAD - 2) }
    cities.push(a, b)
    routes.push(rand() < 0.5 ? route(a, peak, b) : route(b, peak, a))
  } else {
    const count = clamp(Math.round(height / 85) + 2, 4, 14)
    const phase = rand()
    const band = (height - PAD * 2) / count
    for (let i = 0; i < count; i++) {
      cities.push({
        // Golden-ratio steps spread the cities across the width without clumping
        x: PAD + ((phase + i * 0.618034) % 1) * (width - PAD * 2),
        y: PAD + (i + 0.5 + (rand() - 0.5) * 0.5) * band,
      })
    }

    const seen = new Set<string>()
    const connect = (i: number, j: number) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (i === j || seen.has(key)) return
      seen.add(key)
      const [a, b] = rand() < 0.5 ? [cities[i], cities[j]] : [cities[j], cities[i]]
      const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1
      const bulge = dist * (0.14 + rand() * 0.14)
      // Perpendicular to the leg, on whichever side bows upward
      let nx = -(b.y - a.y) / dist
      let ny = (b.x - a.x) / dist
      if (ny > 0) {
        nx = -nx
        ny = -ny
      }
      routes.push(
        route(
          a,
          {
            x: clamp((a.x + b.x) / 2 + nx * bulge * 2, 0, width),
            y: clamp((a.y + b.y) / 2 + ny * bulge * 2, -PAD, height + PAD),
          },
          b,
        ),
      )
      link(i)
      link(j)
    }

    // Each city joins one of the few above it, then a handful of long hauls cut across
    for (let i = 1; i < count; i++) connect(i, i - 1 - Math.floor(rand() * Math.min(i, 3)))
    for (let n = Math.floor(count / 5); n > 0; n--) {
      const i = Math.floor(rand() * count)
      connect(i, (i + 3 + Math.floor(rand() * (count - 3))) % count)
    }
  }

  // The longest legs get a plane; the rest stay as quiet routes
  const airborne = clamp(Math.round(routes.length * 0.45), 1, 4)
  const flights: Flight[] = [...routes]
    .sort((a, b) => b.length - a.length)
    .slice(0, airborne)
    .map((r) => {
      const duration = clamp(r.length / PLANE_SPEED / FLIGHT_SHARE, 8, 26)
      return { ...r, duration, delay: -rand() * duration, rest: 0.25 + rand() * 0.5 }
    })

  let hub = -1
  links.forEach((n, i) => {
    if (n >= 3 && n > (links.get(hub) ?? 0)) hub = i
  })

  return { cities, routes, flights, hub }
}

const PARALLEL_GAP = 44
const MERIDIAN_GAP = 58

/**
 * Backdrop: a faint map graticule filling the whole box. Line spacing is fixed, so a bigger box
 * gets more lines of latitude and longitude rather than a stretched grid.
 */
function buildGraticule(width: number, height: number) {
  const r = (n: number) => Math.round(n * 10) / 10
  const cx = width / 2
  const cy = height / 2
  const lines: string[] = []

  // Parallels bow away from the equator, more so the further out they sit
  for (let dy = PARALLEL_GAP / 2; dy < cy + PARALLEL_GAP; dy += PARALLEL_GAP) {
    for (const side of [-1, 1]) {
      const y = cy + side * dy
      lines.push(`M0,${r(y)} Q${r(cx)},${r(y + side * Math.min(dy * 0.22, 26))} ${r(width)},${r(y)}`)
    }
  }
  // Meridians pinch toward the top and bottom, like a globe laid flat
  lines.push(`M${r(cx)},0 V${r(height)}`)
  for (let dx = MERIDIAN_GAP; dx < cx + MERIDIAN_GAP * 2; dx += MERIDIAN_GAP) {
    for (const side of [-1, 1]) {
      const edge = cx + side * dx * 0.62
      lines.push(`M${r(edge)},0 Q${r(cx + side * dx * 1.38)},${r(cy)} ${r(edge)},${r(height)}`)
    }
  }
  return lines.join('')
}

/** Easter egg for the Countries card: flight routes in the space left under a short table. */
export default function StatsArtFlights({ resetKey }: { resetKey: unknown }) {
  const { ref, seed, state, frameStyle, padding, width, height } = useStatsArtStage(resetKey)
  const scene = useMemo(
    () => (seed && height > 0 ? buildScene(seed, width, height) : null),
    [seed, width, height],
  )

  return (
    <div ref={ref} className="stats-art" data-state={state} aria-hidden>
      {scene && (
        <div className="stats-art__frame stats-art__frame--flights" style={frameStyle}>
          <svg className="stats-art__backdrop" focusable="false">
            <path d={buildGraticule(width + padding * 2, height + padding * 2)} />
          </svg>
          <svg className="stats-art__svg" width={width} height={height} focusable="false">
            {scene.routes.map((r, i) => (
              <path key={i} className="stats-art__route" d={r.d} />
            ))}
            {scene.flights.map((f, i) => (
              <path
                key={i}
                className="stats-art__trail"
                d={f.d}
                pathLength={1}
                style={flightStyle(f)}
              />
            ))}
            {scene.cities.map((c, i) => (
              <g key={i}>
                {i === scene.hub && <circle className="stats-art__line" cx={c.x} cy={c.y} r={5.5} />}
                <circle className="stats-art__dot" cx={c.x} cy={c.y} r={2} />
              </g>
            ))}
            {scene.flights.map((f, i) => (
              <g
                key={i}
                className="stats-art__plane"
                style={{ ...flightStyle(f), offsetPath: `path('${f.d}')` }}
              >
                <path className="stats-art__line stats-art__line--accent" d="M-6,0H6M1.5,0L-3,-5.5M1.5,0L-3,5.5M-4.5,0L-6.5,-2.5M-4.5,0L-6.5,2.5" />
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  )
}

function flightStyle(f: Flight) {
  return {
    '--dur': `${f.duration.toFixed(2)}s`,
    '--delay': `${f.delay.toFixed(2)}s`,
    '--rest': f.rest.toFixed(3),
  } as CSSProperties
}
