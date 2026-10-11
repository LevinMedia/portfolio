'use client'

import { useMemo, type CSSProperties } from 'react'
import { clamp, seededRandom, useStatsArtStage } from '@/app/hooks/useStatsArtStage'

type Page = { d: string; delay: number; rest: number; tilt: number; sway: number; swayDelay: number; accent: boolean }

/** Below this drawable height the pages drift sideways instead of rising. */
const VIGNETTE_HEIGHT = 136
const MONITOR_HEIGHT = 44
const PAGE_SPEED = 15 // px per second
const PAGE_SPACING = 105

/**
 * A monitor at the bottom of the space with pages lifting out of it. More height means a longer climb
 * with more pages in the air at once; the monitor and the pages themselves never change size.
 */
function buildScene(seed: number, width: number, height: number) {
  const rand = seededRandom(seed)
  const spread = () => rand() * 2 - 1
  const r = (n: number) => Math.round(n * 10) / 10
  const top = height - MONITOR_HEIGHT
  const paths: string[] = []
  let x: number
  let travel: number

  if (height < VIGNETTE_HEIGHT) {
    // No room to climb: park the monitor at one side and let a page wander across
    const dir = rand() < 0.5 ? 1 : -1
    x = dir > 0 ? 36 + rand() * width * 0.08 : width - 36 - rand() * width * 0.08
    travel = Math.min(width * 0.55, 300)
    const y = top + 16
    const endY = clamp(height * 0.45, 13, height - 13)
    const wave = Math.min(14, (height - 26) / 2)
    paths.push(
      `M${r(x)},${r(y)} C${r(x + dir * travel * 0.3)},${r(clamp(y - wave * 2, 13, height - 13))} ` +
        `${r(x + dir * travel * 0.65)},${r(clamp(endY + wave, 13, height - 13))} ${r(x + dir * travel)},${r(endY)}`,
    )
  } else {
    x = width * (0.3 + rand() * 0.4)
    const y = top + 14
    const end = 14
    travel = y - end
    const reach = Math.min(width * 0.38, 40 + travel * 0.5)
    const count = clamp(Math.round(travel / PAGE_SPACING), 1, 9)
    for (let i = 0; i < count; i++) {
      const endX = clamp(x + spread() * reach, 16, width - 16)
      if (travel > 420) {
        // A long climb gets a second bend so it reads as a drift, not a ramp
        const midX = clamp(x + (endX - x) * 0.45 + spread() * 40, 16, width - 16)
        const midY = y - travel * 0.5
        paths.push(
          `M${r(x)},${r(y)} C${r(x + spread() * 24)},${r(y - travel * 0.18)} ${r(midX - spread() * 36)},${r(midY + travel * 0.14)} ${r(midX)},${r(midY)} ` +
            `S${r(endX + spread() * 44)},${r(end + travel * 0.16)} ${r(endX)},${end}`,
        )
      } else {
        paths.push(
          `M${r(x)},${r(y)} C${r(x + spread() * 30)},${r(y - travel * 0.3)} ${r(endX + spread() * 50)},${r(y - travel * 0.72)} ${r(endX)},${end}`,
        )
      }
    }
  }

  // One shared duration keeps the stream evenly spaced; each page starts part-way through it
  const duration = clamp(travel / PAGE_SPEED, 9, 70)
  const accent = paths.length > 1 ? Math.floor(rand() * paths.length) : -1
  const pages: Page[] = paths.map((d, i) => {
    const sway = 5 + rand() * 4
    return {
      d,
      delay: -((i + rand() * 0.5) / paths.length) * duration,
      rest: (i + 0.5) / paths.length,
      tilt: spread() * 7,
      sway,
      swayDelay: -rand() * sway,
      accent: i === accent,
    }
  })

  return { monitor: { x: r(x), y: r(top) }, pages, duration }
}

/** Easter egg for the Top pages card: pages drifting out of a monitor in the space under a short table. */
export default function StatsArtPages({ resetKey }: { resetKey: unknown }) {
  const { ref, seed, state, frameStyle, padding, width, height } = useStatsArtStage(resetKey)
  const scene = useMemo(
    () => (seed && height > 0 ? buildScene(seed, width, height) : null),
    [seed, width, height],
  )

  return (
    <div ref={ref} className="stats-art" data-state={state} aria-hidden>
      {scene && (
        <div
          className="stats-art__frame stats-art__frame--pages"
          style={
            {
              ...frameStyle,
              // The backdrop's dot grid radiates from the screen
              '--focus-x': `${Math.round(scene.monitor.x + padding)}px`,
              '--focus-y': `${Math.round(scene.monitor.y + padding + 18)}px`,
            } as CSSProperties
          }
        >
          <svg className="stats-art__svg" width={width} height={height} focusable="false">
            <g transform={`translate(${scene.monitor.x},${scene.monitor.y})`}>
              <rect className="stats-art__line stats-art__solid" x={-27} y={0} width={54} height={36} rx={4} />
              <path className="stats-art__line" d="M0,36V42M-10,42H10" />
              <path className="stats-art__line stats-art__line--faint" d="M-18,10H-5M-18,16H4" />
            </g>
            {scene.pages.map((p, i) => (
              <g
                key={i}
                className="stats-art__page"
                style={
                  {
                    offsetPath: `path('${p.d}')`,
                    '--dur': `${scene.duration.toFixed(2)}s`,
                    '--delay': `${p.delay.toFixed(2)}s`,
                    '--rest': p.rest.toFixed(3),
                    // Mirrors the fade at either end of the climb for the still (reduced-motion) frame
                    '--rest-opacity': Math.min(1, p.rest / 0.1, (1 - p.rest) / 0.3).toFixed(2),
                    '--tilt': `${p.tilt.toFixed(1)}deg`,
                    '--sway': `${p.sway.toFixed(2)}s`,
                    '--sway-delay': `${p.swayDelay.toFixed(2)}s`,
                  } as CSSProperties
                }
              >
                <path
                  className={`stats-art__sheet stats-art__line stats-art__solid${p.accent ? ' stats-art__line--accent' : ''}`}
                  d="M-8,-10H3L8,-5V10H-8ZM3,-10V-5H8M-4.5,-1H4.5M-4.5,2.5H4.5M-4.5,6H1.5"
                />
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  )
}
