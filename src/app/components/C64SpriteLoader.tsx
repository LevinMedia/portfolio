'use client'

import { useEffect, useRef, useState } from 'react'

const LOADER_STEP_PX = 6
const LOADER_SCALE = 0.5
const LOADER_UP_STEPS = 3
const LOADER_DOWN_STEPS = 3

/** Each tick: swap sprite frame and move 6px up or down (no eased drift between ticks). */
function buildLoaderSteps(): { frame: 0 | 1; y: number }[] {
  const steps: { frame: 0 | 1; y: number }[] = [{ frame: 0, y: 0 }]
  let y = 0
  let frame: 0 | 1 = 0

  for (let i = 0; i < LOADER_UP_STEPS; i += 1) {
    frame = frame === 0 ? 1 : 0
    y -= LOADER_STEP_PX
    steps.push({ frame, y })
  }
  for (let i = 0; i < LOADER_DOWN_STEPS; i += 1) {
    frame = frame === 0 ? 1 : 0
    y += LOADER_STEP_PX
    steps.push({ frame, y })
  }

  return steps
}

const LOADER_STEPS = buildLoaderSteps()

export const C64_SPRITE_LOADER_STEP_MS = 150
export const C64_SPRITE_LOADER_CYCLE_MS =
  LOADER_STEPS.length * C64_SPRITE_LOADER_STEP_MS

const FRAME_PATHS = [
  'M60 96H36V84H60V96ZM96 96H72V84H96V96ZM108 84H96V72H36V84H24V60H12V84H0V48H12V36H24V24H36V12H48V24H84V12H96V24H108V36H120V48H132V84H120V60H108V84ZM36 48H48V36H36V48ZM84 48H96V36H84V48ZM36 12H24V0H36V12ZM108 12H96V0H108V12Z',
  'M119 96H107V84H96V72H36V84H25V96H13V84H24V60H12V48H0V12H12V36H24V24H36V12H48V24H84V12H96V24H108V36H120V11H132V47H120V60H108V84H119V96ZM36 48H48V36H36V48ZM84 48H96V36H84V48ZM36 12H24V0H36V12ZM108 12H96V0H108V12Z',
] as const

function LoaderFrame({ frame }: { frame: 0 | 1 }) {
  return (
    <svg
      width="132"
      height="96"
      viewBox="0 0 132 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block h-auto w-[132px] max-w-[min(132px,40vw)] text-[var(--c64-crt-ink)]"
      aria-hidden
    >
      <path d={FRAME_PATHS[frame]} fill="currentColor" />
    </svg>
  )
}

type C64SpriteLoaderProps = {
  className?: string
}

export function C64SpriteLoader({ className = '' }: C64SpriteLoaderProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reducedMotion) {
      return undefined
    }
    const id = window.setInterval(() => {
      setStepIndex((i) => (i + 1) % LOADER_STEPS.length)
    }, C64_SPRITE_LOADER_STEP_MS)
    return () => window.clearInterval(id)
  }, [reducedMotion])

  const step = LOADER_STEPS[reducedMotion ? 0 : stepIndex]

  return (
    <div
      className={`c64-sprite-loader flex items-center justify-center ${className}`.trim()}
      style={{
        transform: `translateY(${step.y}px) scale(${LOADER_SCALE})`,
        transformOrigin: 'center center',
      }}
    >
      <LoaderFrame frame={step.frame} />
    </div>
  )
}

/**
 * Keeps the loader visible for at least one full sprite cycle after `loading` becomes true,
 * and through the end of the current cycle when `loading` becomes false early.
 */
export function useC64LoaderVisible(loading: boolean): boolean {
  const [visible, setVisible] = useState(loading)
  const shownAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (loading) {
      if (shownAtRef.current === null) {
        shownAtRef.current = Date.now()
      }
      setVisible(true)
      return undefined
    }

    if (!visible || shownAtRef.current === null) {
      return undefined
    }

    const elapsed = Date.now() - shownAtRef.current
    const delay = Math.max(0, C64_SPRITE_LOADER_CYCLE_MS - elapsed)
    const id = window.setTimeout(() => {
      setVisible(false)
      shownAtRef.current = null
    }, delay)
    return () => window.clearTimeout(id)
  }, [loading, visible])

  return visible
}

type C64LoadingScreenProps = {
  loading: boolean
  label?: string
  className?: string
}

/** Vertically centered loader for drawer / page content fetches. */
export function C64LoadingScreen({
  label = 'Loading',
  className = '',
}: Omit<C64LoadingScreenProps, 'loading'>) {
  return (
    <div
      className={`c64-loading-screen flex w-full flex-1 items-center justify-center text-[var(--c64-crt-ink)] min-h-[calc(100dvh-11rem)] ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <C64SpriteLoader />
      <span className="sr-only">{label}</span>
    </div>
  )
}
