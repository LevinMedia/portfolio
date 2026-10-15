'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { fitMediaBox } from '@/lib/lightbox-fit'
import VideoPlayer from './VideoPlayer'
import YouTubeEmbed from './YouTubeEmbed'

export type LightboxSlide = {
  url?: string
  caption?: string
  kind?: 'image' | 'video' | 'youtube'
  videoId?: string
}

interface ImageGalleryLightboxProps {
  images: LightboxSlide[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

const SWIPE_THRESHOLD = 50
const VIEWPORT_FRACTION = 0.96
const CONTENT_GAP_PX = 32
const CONTENT_PADDING_Y_PX = 16
const CAPTION_MAX_VH = 0.28
const lightboxControlClass =
  'z-10 rounded-full border border-white/80 bg-white/20 text-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)] backdrop-blur-md hover:bg-white/35'

export default function ImageGalleryLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
}: ImageGalleryLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [imageBounds, setImageBounds] = useState({ maxHeight: 600, maxWidth: 800 })
  const touchStartX = useRef<number | null>(null)
  const captionRef = useRef<HTMLDivElement>(null)

  const current = images[index]

  useEffect(() => {
    if (open) setIndex(initialIndex)
  }, [open, initialIndex])

  const updateImageBounds = useCallback(() => {
    const captionHeight = captionRef.current?.offsetHeight ?? 0
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const maxViewportHeight = viewportHeight * VIEWPORT_FRACTION
    const maxViewportWidth = viewportWidth * VIEWPORT_FRACTION
    const availableHeight = Math.max(
      120,
      maxViewportHeight - captionHeight - CONTENT_GAP_PX - CONTENT_PADDING_Y_PX,
    )

    setImageBounds({
      maxHeight: availableHeight,
      maxWidth: maxViewportWidth,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open || images.length === 0) return
    updateImageBounds()
  }, [open, index, current?.caption, images.length, updateImageBounds])

  useEffect(() => {
    if (!open) return

    const captionEl = captionRef.current
    const ro = new ResizeObserver(updateImageBounds)
    if (captionEl) ro.observe(captionEl)
    window.addEventListener('resize', updateImageBounds)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateImageBounds)
    }
  }, [open, index, current?.caption, updateImageBounds])

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : images.length - 1))
  }, [images.length])

  const goNext = useCallback(() => {
    setIndex((i) => (i < images.length - 1 ? i + 1 : 0))
  }, [images.length])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close only the lightbox, not the drawer behind it (Drawer listens on document capture).
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', onKeyDown, true)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = ''
    }
  }, [open, onClose, goPrev, goNext])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const endX = e.changedTouches[0]?.clientX
    if (endX === undefined) return
    const delta = endX - touchStartX.current
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta > 0) goPrev()
      else goNext()
    }
    touchStartX.current = null
  }

  if (!open || images.length === 0 || !current) return null

  const showMeta = Boolean(current.caption || images.length > 1)

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
        aria-label="Close gallery"
        onClick={onClose}
      />

      <button
        type="button"
        className={`absolute top-4 right-4 p-2 ${lightboxControlClass}`}
        aria-label="Close"
        onClick={onClose}
      >
        <XMarkIcon className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 ${lightboxControlClass}`}
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>
          <button
            type="button"
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 ${lightboxControlClass}`}
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>
        </>
      )}

      <div
        className="relative z-[1] flex max-h-[100dvh] max-w-[92vw] flex-col items-center gap-8 overflow-hidden px-12 py-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <LightboxSlideView
          key={`${index}-${current.kind ?? 'image'}-${current.url ?? current.videoId ?? ''}`}
          slide={current}
          maxWidth={imageBounds.maxWidth}
          maxHeight={imageBounds.maxHeight}
          onLoad={updateImageBounds}
        />
        {showMeta ? (
          <div
            ref={captionRef}
            className="w-full max-w-2xl shrink-0 overflow-y-auto text-center"
            style={{ maxHeight: `${CAPTION_MAX_VH * 100}vh` }}
          >
            {current.caption ? (
              <p className="text-xl leading-snug text-white">{current.caption}</p>
            ) : null}
            {images.length > 1 && (
              <p className={`text-sm text-white/80 ${current.caption ? 'mt-1' : ''}`}>
                {index + 1} / {images.length}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

function LightboxSlideView({
  slide,
  maxWidth,
  maxHeight,
  onLoad,
}: {
  slide: LightboxSlide
  maxWidth: number
  maxHeight: number
  onLoad: () => void
}) {
  const kind = slide.kind ?? 'image'
  const [aspect, setAspect] = useState(16 / 9)

  if (kind === 'youtube' && slide.videoId) {
    const box = fitMediaBox(maxWidth, maxHeight, 16 / 9)
    return (
      <div className="min-h-0 max-w-[92vw] shrink" style={{ width: box.width }}>
        <YouTubeEmbed videoId={slide.videoId} title={slide.caption || 'YouTube video'} />
      </div>
    )
  }

  if (kind === 'video' && slide.url) {
    const box = fitMediaBox(maxWidth, maxHeight, aspect)
    return (
      <div className="min-h-0 max-w-[92vw] shrink" style={{ width: box.width, height: box.height }}>
        <VideoPlayer
          src={slide.url}
          width={box.width}
          height={box.height}
          onAspectRatio={(next) => {
            setAspect((prev) => (Math.abs(prev - next) < 0.01 ? prev : next))
          }}
        />
      </div>
    )
  }

  if (!slide.url) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={slide.url}
      alt={slide.caption || ''}
      className="h-auto w-auto rounded-2xl"
      style={{ maxHeight, maxWidth }}
      onLoad={onLoad}
    />
  )
}
