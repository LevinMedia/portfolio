'use client'

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'


/**
 * The Top pages / Countries pair. Their tables show every row, so a new range can change the cards'
 * height by hundreds of pixels; this eases them to the new height instead of letting them jump.
 * `epoch` changes once per completed load.
 */
export default function StatsDetailGrid({ epoch, children }: { epoch: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  // Card heights as last laid out. ResizeObserver reports after layout effects, so when the effect
  // below runs these are still the heights from before the update, or mid-flight ones if a resize
  // is being interrupted, which is exactly where the next one should start from.
  const heights = useRef<number[]>([])

  useEffect(() => {
    const grid = ref.current
    if (!grid) return undefined
    const cards = Array.from(grid.children) as HTMLElement[]
    const ro = new ResizeObserver(() => {
      heights.current = cards.map((card) => card.offsetHeight)
    })
    cards.forEach((card) => ro.observe(card))
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const grid = ref.current
    if (!grid) return undefined
    const cards = Array.from(grid.children) as HTMLElement[]
    const from = heights.current

    const release = () => {
      cards.forEach((card) => {
        card.style.height = ''
        card.style.overflow = ''
        card.style.transition = ''
      })
      delete grid.dataset.resizing
    }
    release()

    const to = cards.map((card) => card.offsetHeight)
    const changed = from.length === to.length && to.some((h, i) => Math.abs(h - from[i]) > 1)
    if (!changed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    // globals.css parks the easter-egg art while this is set, so it isn't redrawn on every frame
    grid.dataset.resizing = 'true'
    cards.forEach((card, i) => {
      card.style.height = `${from[i]}px`
      card.style.overflow = 'hidden'
    })
    void grid.offsetHeight
    // Longer for bigger moves, so a thousand-pixel change doesn't whip past
    const distance = Math.max(...to.map((h, i) => Math.abs(h - from[i])))
    const duration = Math.round(Math.min(800, 380 + distance * 0.3))
    cards.forEach((card, i) => {
      card.style.transition = `height ${duration}ms cubic-bezier(0.65, 0, 0.35, 1)`
      card.style.height = `${to[i]}px`
    })

    const timer = window.setTimeout(release, duration + 60)
    return () => window.clearTimeout(timer)
  }, [epoch])

  return (
    <div ref={ref} className="stats-detail-grid">
      {children}
    </div>
  )
}
