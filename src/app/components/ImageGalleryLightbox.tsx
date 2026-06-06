'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { GalleryImage } from '@/lib/gallery-markdown'

interface ImageGalleryLightboxProps {
  images: GalleryImage[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

const SWIPE_THRESHOLD = 50
const VIEWPORT_FRACTION = 0.96
const CONTENT_GAP_PX = 8
const CONTENT_PADDING_Y_PX = 16
const CAPTION_MAX_VH = 0.28

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
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown)
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
        className="absolute inset-0 bg-black/80"
        aria-label="Close gallery"
        onClick={onClose}
      />

      <button
        type="button"
        className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
        aria-label="Close"
        onClick={onClose}
      >
        <XMarkIcon className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
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
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
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
        className="relative z-[1] flex max-w-[92vw] flex-col items-center gap-2 px-12 py-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.caption || ''}
          className="h-auto w-auto rounded-2xl"
          style={{
            maxHeight: imageBounds.maxHeight,
            maxWidth: imageBounds.maxWidth,
          }}
          onLoad={updateImageBounds}
        />
        {showMeta ? (
          <div
            ref={captionRef}
            className="w-full max-w-2xl shrink-0 overflow-y-auto text-center"
            style={{ maxHeight: `${CAPTION_MAX_VH * 100}vh` }}
          >
            {current.caption ? (
              <p className="text-sm text-white">{current.caption}</p>
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
