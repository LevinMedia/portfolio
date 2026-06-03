'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

export type ChromeSegmentedOption<T extends string> = {
  id: T
  label: string
}

interface ChromeSegmentedControlProps<T extends string> {
  options: readonly ChromeSegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
  /** Allow horizontal scroll when many segments (e.g. accent palette). */
  scrollable?: boolean
  /** Stretch to container width; segments share space equally. */
  fullWidth?: boolean
}

export default function ChromeSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
  scrollable = false,
  fullWidth = false,
}: ChromeSegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef(new Map<T, HTMLButtonElement>())

  const [focusedId, setFocusedId] = useState<T>(value)
  const [indicator, setIndicator] = useState({ x: 0, width: 0 })

  useEffect(() => {
    setFocusedId(value)
  }, [value])

  const syncIndicator = useCallback(() => {
    const track = trackRef.current
    const active = optionRefs.current.get(value)
    if (!track || !active) return

    const scrollEl = track.parentElement?.classList.contains('chrome-segmented__scrollport')
      ? track.parentElement
      : track
    const trackRect = track.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    setIndicator({
      x: activeRect.left - trackRect.left + (scrollEl?.scrollLeft ?? 0),
      width: activeRect.width,
    })
  }, [value])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    const run = () => requestAnimationFrame(syncIndicator)
    run()

    const ro = new ResizeObserver(run)
    ro.observe(track)
    options.forEach((opt) => {
      const el = optionRefs.current.get(opt.id)
      if (el) ro.observe(el)
    })

    const scrollParent = track.parentElement
    scrollParent?.addEventListener('scroll', run, { passive: true })
    window.addEventListener('resize', run)

    return () => {
      ro.disconnect()
      scrollParent?.removeEventListener('scroll', run)
      window.removeEventListener('resize', run)
    }
  }, [options, syncIndicator])

  const focusOption = useCallback((id: T) => {
    setFocusedId(id)
    requestAnimationFrame(() => {
      optionRefs.current.get(id)?.focus()
      optionRefs.current.get(id)?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      })
    })
  }, [])

  const moveFocus = useCallback(
    (delta: number) => {
      const idx = options.findIndex((o) => o.id === focusedId)
      const start = idx >= 0 ? idx : 0
      const next = (start + delta + options.length) % options.length
      focusOption(options[next].id)
    },
    [focusedId, focusOption, options],
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      moveFocus(1)
      return
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      moveFocus(-1)
      return
    }
    if (e.key === 'Home') {
      e.preventDefault()
      focusOption(options[0].id)
      return
    }
    if (e.key === 'End') {
      e.preventDefault()
      focusOption(options[options.length - 1].id)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChange(options[index].id)
    }
  }

  const track = (
    <div
      ref={trackRef}
      className="chrome-segmented__track"
      role="radiogroup"
      aria-label={ariaLabel}
    >
      <span
        className="chrome-segmented__indicator"
        style={{
          width: indicator.width,
          transform: `translateX(${indicator.x}px)`,
        }}
        aria-hidden
      />
      {options.map((opt, index) => {
        const selected = value === opt.id
        const tabFocused = focusedId === opt.id
        return (
          <button
            key={opt.id}
            ref={(el) => {
              if (el) optionRefs.current.set(opt.id, el)
              else optionRefs.current.delete(opt.id)
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={tabFocused ? 0 : -1}
            className={`chrome-segmented__option${selected ? ' chrome-segmented__option--selected' : ''}`}
            onClick={() => {
              onChange(opt.id)
              setFocusedId(opt.id)
            }}
            onFocus={() => setFocusedId(opt.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div
      className={`chrome-segmented${fullWidth ? ' chrome-segmented--full' : ''}${scrollable && !fullWidth ? ' chrome-segmented--scrollable' : ''} ${className}`.trim()}
    >
      {scrollable && !fullWidth ? <div className="chrome-segmented__scrollport">{track}</div> : track}
    </div>
  )
}
