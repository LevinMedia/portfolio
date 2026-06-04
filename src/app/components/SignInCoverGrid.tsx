'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import type { PortfolioCoverImage } from '@/lib/portfolio-cover-images-server'
import {
  coverSwapDirectionFromClick,
  coverSwapNeighborIndex,
  type CoverSwapDirection,
} from '@/lib/sign-in-cover-swap'
import { thumbnailCropImageStyle } from '@/lib/thumbnail-crop-style'

const COVER_GRID_COLUMNS = 3
const COVER_GRID_GAP_PX = 0
const COVER_SWAP_DURATION_MS = 280
const COVER_LIFT_DURATION_MS = 1400
const COVER_LIFT_MIN_INTERVAL_MS = 3800
const COVER_LIFT_MAX_INTERVAL_MS = 6800

type ShimmerPulse = {
  tileId: string
  key: number
}

type SignInCoverGridProps = {
  images: PortfolioCoverImage[]
}

type CoverTile = {
  id: string
  image: PortfolioCoverImage
}

type CoverMetrics = {
  scale: number
  slotCount: number
}

type FlipSnapshot = {
  id: string
  rect: DOMRect
}

type PendingFlip = {
  a: FlipSnapshot
  b: FlipSnapshot
}

function createCoverTileId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `cover-tile-${Math.random().toString(36).slice(2)}`
}

function createCoverTile(image: PortfolioCoverImage): CoverTile {
  return { id: createCoverTileId(), image }
}

function buildDefaultTiles(images: PortfolioCoverImage[], slotCount: number): CoverTile[] {
  return Array.from({ length: slotCount }, (_, index) =>
    createCoverTile(images[index % images.length]!),
  )
}

function resizeTiles(
  prev: CoverTile[],
  slotCount: number,
  images: PortfolioCoverImage[],
): CoverTile[] {
  if (slotCount <= 0) return []
  if (prev.length === slotCount) return prev
  if (prev.length === 0) return buildDefaultTiles(images, slotCount)
  if (slotCount < prev.length) return prev.slice(0, slotCount)

  const extra = Array.from({ length: slotCount - prev.length }, (_, index) =>
    createCoverTile(images[(prev.length + index) % images.length]!),
  )
  return [...prev, ...extra]
}

function computeCoverMetrics(stageWidth: number, stageHeight: number): CoverMetrics {
  if (stageWidth <= 0 || stageHeight <= 0) {
    return { scale: 1, slotCount: 0 }
  }

  const cellSize =
    (stageWidth - (COVER_GRID_COLUMNS - 1) * COVER_GRID_GAP_PX) / COVER_GRID_COLUMNS
  const rowStride = cellSize + COVER_GRID_GAP_PX
  const rows = Math.max(1, Math.ceil((stageHeight + COVER_GRID_GAP_PX) / rowStride))
  const slotCount = rows * COVER_GRID_COLUMNS
  const gridHeight = rows * cellSize + (rows - 1) * COVER_GRID_GAP_PX
  const scale = gridHeight > 0 ? Math.max(1, stageHeight / gridHeight) : 1

  return { scale, slotCount }
}

function animateTileFlip(
  tileRefs: Map<string, HTMLButtonElement>,
  flip: PendingFlip,
  onComplete: () => void,
) {
  const aEl = tileRefs.get(flip.a.id)
  const bEl = tileRefs.get(flip.b.id)
  if (!aEl || !bEl) {
    onComplete()
    return
  }

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    onComplete()
    return
  }

  const aLast = aEl.getBoundingClientRect()
  const bLast = bEl.getBoundingClientRect()
  const pairs = [
    { el: aEl, dx: flip.a.rect.left - aLast.left, dy: flip.a.rect.top - aLast.top },
    { el: bEl, dx: flip.b.rect.left - bLast.left, dy: flip.b.rect.top - bLast.top },
  ]

  const needsMotion = pairs.some(
    ({ dx, dy }) => Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5,
  )

  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    window.clearTimeout(fallbackTimer)
    for (const { el } of pairs) {
      el.style.transition = ''
      el.style.transform = ''
      el.style.zIndex = ''
    }
    onComplete()
  }

  if (!needsMotion) {
    finish()
    return
  }

  for (const { el, dx, dy } of pairs) {
    el.style.transition = 'none'
    el.style.transform = `translate(${dx}px, ${dy}px)`
    el.style.zIndex = '2'
  }

  const fallbackTimer = window.setTimeout(finish, COVER_SWAP_DURATION_MS + 80)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      for (const { el } of pairs) {
        el.style.transition = `transform ${COVER_SWAP_DURATION_MS}ms ease`
        el.style.transform = ''
        el.addEventListener('transitionend', (event) => {
          if (event.propertyName === 'transform') finish()
        }, { once: true })
      }
    })
  })
}

export default function SignInCoverGrid({ images }: SignInCoverGridProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const imagesRef = useRef(images)
  const tileRefs = useRef(new Map<string, HTMLButtonElement>())
  const pendingFlipRef = useRef<PendingFlip | null>(null)
  const isAnimatingRef = useRef(false)
  const shimmerBlockedRef = useRef(false)
  const hoveredTileIdRef = useRef<string | null>(null)
  const [liftedTileId, setLiftedTileId] = useState<string | null>(null)
  const [shimmerPulse, setShimmerPulse] = useState<ShimmerPulse | null>(null)
  const [metrics, setMetrics] = useState<CoverMetrics>({ scale: 1, slotCount: 0 })
  const [tiles, setTiles] = useState<CoverTile[]>(() =>
    buildDefaultTiles(images, COVER_GRID_COLUMNS * 3),
  )
  const tilesRef = useRef(tiles)
  tilesRef.current = tiles

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage || images.length === 0) return

    const update = () => {
      const imagesChanged = imagesRef.current !== images
      imagesRef.current = images

      const nextMetrics = computeCoverMetrics(stage.clientWidth, stage.clientHeight)
      setMetrics(nextMetrics)

      setTiles((prev) => {
        if (imagesChanged || prev.length === 0) {
          return buildDefaultTiles(images, nextMetrics.slotCount)
        }
        return resizeTiles(prev, nextMetrics.slotCount, images)
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [images])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const allowShimmer = () => {
      if (!isAnimatingRef.current) {
        shimmerBlockedRef.current = false
      }
    }

    stage.addEventListener('pointermove', allowShimmer)
    return () => stage.removeEventListener('pointermove', allowShimmer)
  }, [])

  useLayoutEffect(() => {
    const flip = pendingFlipRef.current
    if (!flip) return

    pendingFlipRef.current = null
    animateTileFlip(tileRefs.current, flip, () => {
      isAnimatingRef.current = false
    })
  }, [tiles])

  const blockShimmer = useCallback(() => {
    shimmerBlockedRef.current = true
    setShimmerPulse(null)
  }, [])

  const triggerShimmer = useCallback((tileId: string) => {
    if (isAnimatingRef.current || shimmerBlockedRef.current) return
    setShimmerPulse({ tileId, key: Date.now() })
  }, [])

  useEffect(() => {
    if (tiles.length === 0) return

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) return

    let liftTimeoutId = 0
    let clearLiftTimeoutId = 0

    const scheduleLift = () => {
      const delay =
        COVER_LIFT_MIN_INTERVAL_MS +
        Math.random() * (COVER_LIFT_MAX_INTERVAL_MS - COVER_LIFT_MIN_INTERVAL_MS)

      liftTimeoutId = window.setTimeout(() => {
        if (isAnimatingRef.current || hoveredTileIdRef.current) {
          scheduleLift()
          return
        }

        const randomIndex = Math.floor(Math.random() * tilesRef.current.length)
        const nextLiftedId = tilesRef.current[randomIndex]?.id
        if (!nextLiftedId) {
          scheduleLift()
          return
        }

        setLiftedTileId(nextLiftedId)
        clearLiftTimeoutId = window.setTimeout(() => {
          setLiftedTileId(null)
          scheduleLift()
        }, COVER_LIFT_DURATION_MS)
      }, delay)
    }

    scheduleLift()

    return () => {
      window.clearTimeout(liftTimeoutId)
      window.clearTimeout(clearLiftTimeoutId)
    }
  }, [tiles.length])

  const swapTile = useCallback((index: number, direction: CoverSwapDirection) => {
    if (isAnimatingRef.current) return

    blockShimmer()
    hoveredTileIdRef.current = null

    setTiles((prev) => {
      const neighbor = coverSwapNeighborIndex(index, direction, COVER_GRID_COLUMNS, prev.length)
      if (neighbor === null) return prev

      const tileA = prev[index]!
      const tileB = prev[neighbor]!
      const aEl = tileRefs.current.get(tileA.id)
      const bEl = tileRefs.current.get(tileB.id)

      if (aEl && bEl) {
        pendingFlipRef.current = {
          a: { id: tileA.id, rect: aEl.getBoundingClientRect() },
          b: { id: tileB.id, rect: bEl.getBoundingClientRect() },
        }
        isAnimatingRef.current = true
      }

      const next = [...prev]
      ;[next[index], next[neighbor]] = [next[neighbor]!, next[index]!]
      return next
    })
  }, [blockShimmer])

  const handleCellClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
      if (isAnimatingRef.current) return

      event.currentTarget.blur()

      const rect = event.currentTarget.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      const direction = coverSwapDirectionFromClick(x, y)
      if (!direction) return

      swapTile(index, direction)
    },
    [swapTile],
  )

  if (images.length === 0) {
    return (
      <div className="chrome-sign-in-cover-stage" aria-hidden>
        <div className="chrome-sign-in-cover-inner chrome-sign-in-cover-inner--empty" />
      </div>
    )
  }

  return (
    <div ref={stageRef} className="chrome-sign-in-cover-stage">
      <div
        className="chrome-sign-in-cover-inner"
        style={{ transform: `scale(${metrics.scale})` }}
      >
        <div className="chrome-sign-in-cover-grid" role="group" aria-label="Portfolio cover mosaic">
          {tiles.map((tile, index) => (
            <button
              key={tile.id}
              ref={(node) => {
                if (node) tileRefs.current.set(tile.id, node)
                else tileRefs.current.delete(tile.id)
              }}
              type="button"
              className={clsx(
                'chrome-sign-in-cover-grid__cell',
                liftedTileId === tile.id && 'chrome-sign-in-cover-grid__cell--lift',
              )}
              aria-label={`${tile.image.title}. Click a corner region to swap with a neighboring tile.`}
              onMouseEnter={() => {
                hoveredTileIdRef.current = tile.id
                triggerShimmer(tile.id)
              }}
              onMouseLeave={() => {
                if (hoveredTileIdRef.current === tile.id) {
                  hoveredTileIdRef.current = null
                }
                setShimmerPulse((current) => (current?.tileId === tile.id ? null : current))
              }}
              onFocus={(event) => {
                hoveredTileIdRef.current = tile.id
                if (event.currentTarget.matches(':focus-visible')) {
                  triggerShimmer(tile.id)
                }
              }}
              onBlur={() => {
                if (hoveredTileIdRef.current === tile.id) {
                  hoveredTileIdRef.current = null
                }
                setShimmerPulse((current) => (current?.tileId === tile.id ? null : current))
              }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => handleCellClick(event, index)}
            >
              <span className="chrome-sign-in-cover-grid__surface">
                <div
                  className="chrome-sign-in-cover-grid__image"
                  style={thumbnailCropImageStyle(tile.image.feature_image_url, tile.image.thumbnail_crop)}
                  aria-hidden
                />
                <span
                  key={
                    shimmerPulse?.tileId === tile.id
                      ? `shimmer-${shimmerPulse.key}`
                      : 'shimmer-idle'
                  }
                  className={clsx(
                    'chrome-sign-in-cover-grid__shimmer',
                    shimmerPulse?.tileId === tile.id &&
                      'chrome-sign-in-cover-grid__shimmer--active',
                  )}
                  aria-hidden
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
