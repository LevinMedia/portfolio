'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

/** Free height under a table below which the art stays away entirely. */
const MIN_FREE_SPACE = 104
/** Breathing room between the table's last row and the art's box. */
const GAP = 20
/** Inner padding of the box, on top of its 1px outline. */
const PADDING = 16
const MIN_WIDTH = 220

const FRAME_STYLE: CSSProperties = { top: GAP, padding: PADDING }

export type StatsArtState = 'playing' | 'paused' | 'static'

/** mulberry32: tiny seeded PRNG, so a composition is random per view but repeatable across re-renders. */
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/**
 * Shared plumbing for the stats easter-egg art. The stage is a zero-basis flex child, so it only ever
 * receives whatever height the grid has left over in the shorter card and never adds any of its own.
 *
 * `resetKey` re-rolls the composition (new data); resizes keep the same seed.
 */
export function useStatsArtStage(resetKey: unknown) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, free: 0 })
  const [seed, setSeed] = useState(0)
  const [visible, setVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setSeed(1 + Math.floor(Math.random() * 0xfffffffe))
  }, [resetKey])

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const ro = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      const free = Math.round(entry.contentRect.height)
      setSize((prev) => (prev.width === width && prev.free === free ? prev : { width, free }))
    })
    ro.observe(el)

    // Off-screen covers both a scrolled-away card and a closed (translated-out) drawer
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    io.observe(el)

    return () => {
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const fits = size.free >= MIN_FREE_SPACE && size.width >= MIN_WIDTH
  const state: StatsArtState = reducedMotion ? 'static' : visible ? 'playing' : 'paused'

  const inset = (PADDING + 1) * 2

  return {
    ref,
    seed,
    state,
    frameStyle: FRAME_STYLE,
    /** Offset from the box's edge to the drawing's origin, for backdrops that fill the whole box. */
    padding: PADDING,
    /** Drawable area inside the box; a height of 0 means "draw nothing". */
    width: Math.max(0, size.width - inset),
    height: fits ? size.free - GAP - inset : 0,
  }
}
