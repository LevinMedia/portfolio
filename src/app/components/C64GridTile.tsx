'use client'

import { useCallback, useRef, type CSSProperties, type MouseEvent } from 'react'

const TILT_MAX_DEG = 14

type C64GridTileProps = {
  onClick: () => void
  imageStyle: CSSProperties
  title: string
}

export default function C64GridTile({ onClick, imageStyle, title }: C64GridTileProps) {
  const frameRef = useRef<HTMLDivElement>(null)

  const resetTilt = useCallback((active: boolean) => {
    const el = frameRef.current
    if (!el) return
    const tile = el.closest('.c64-grid-tile')
    if (!tile) return
    el.style.setProperty('--c64-px', '0')
    el.style.setProperty('--c64-py', '0')
    el.style.setProperty('--c64-tilt-x', '0deg')
    el.style.setProperty('--c64-tilt-y', '0deg')
    if (active) {
      tile.setAttribute('data-tilt', 'active')
    } else {
      tile.removeAttribute('data-tilt')
    }
  }, [])

  const handleMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const el = frameRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      el.style.setProperty('--c64-px', String(px))
      el.style.setProperty('--c64-py', String(py))
      el.style.setProperty('--c64-tilt-x', `${-py * TILT_MAX_DEG}deg`)
      el.style.setProperty('--c64-tilt-y', `${px * TILT_MAX_DEG}deg`)
      const tile = el.closest('.c64-grid-tile')
      tile?.setAttribute('data-tilt', 'active')
    },
    [],
  )

  const handleLeave = useCallback(() => {
    resetTilt(false)
  }, [resetTilt])

  return (
    <div className="c64-grid-tile col-span-2">
      <div
        ref={frameRef}
        className="c64-grid-tile__frame"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="c64-grid-tile__stage">
          <div className="c64-grid-tile__bg" aria-hidden>
            <div className="c64-grid-tile__bg-inner" style={imageStyle} />
          </div>
          <div className="c64-grid-tile__label">
            <h3 className="c64-grid-card-title text-center px-2 py-1.5 font-[family-name:var(--font-geist-mono)] text-base sm:text-lg font-bold leading-tight text-[#ffffff] bg-black/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.95)] rounded-sm">
              {title}
            </h3>
          </div>
        </div>
      </div>
    </div>
  )
}
