'use client'

import { useEffect, useState } from 'react'
import type { GalleryImage } from '@/lib/gallery-markdown'
import { chunkByRows, computeGalleryLayout } from '@/lib/gallery-layout'
import { probeGalleryInsetScale } from '@/lib/gallery-alpha-inset'
import ImageGalleryLightbox from './ImageGalleryLightbox'

interface ImageGalleryProps {
  images: GalleryImage[]
  caption?: string
  /** When set, a tile opens the shared post lightbox instead of a gallery-only one. */
  onOpenImage?: (index: number) => void
}

export default function ImageGallery({ images, caption, onOpenImage }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (images.length === 0) return null

  const { rows, maxCols } = computeGalleryLayout(images.length)
  const rowChunks = chunkByRows(images, rows)
  let imageIndex = 0

  const openAt = (index: number) => {
    if (onOpenImage) {
      onOpenImage(index)
      return
    }
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  return (
    <figure
      className="c64-image-gallery"
      style={
        {
          '--gallery-cols': maxCols,
        } as React.CSSProperties
      }
    >
      <div className="c64-image-gallery-rows">
        {rowChunks.map((rowImages, rowIndex) => (
          <div key={rowIndex} className="c64-image-gallery-row">
            {rowImages.map((image) => {
              const index = imageIndex++
              return (
                <GalleryTile
                  key={`${image.url}-${index}`}
                  image={image}
                  index={index}
                  total={images.length}
                  onOpen={openAt}
                />
              )
            })}
          </div>
        ))}
      </div>
      {caption ? <figcaption className="md-caption mt-3">{caption}</figcaption> : null}
      {onOpenImage ? null : (
        <ImageGalleryLightbox
          images={images}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </figure>
  )
}

function GalleryTile({
  image,
  index,
  total,
  onOpen,
}: {
  image: GalleryImage
  index: number
  total: number
  onOpen: (index: number) => void
}) {
  const [inset, setInset] = useState(1)

  useEffect(() => {
    let cancelled = false
    probeGalleryInsetScale(image.url).then((scale) => {
      if (!cancelled) setInset(scale)
    })
    return () => {
      cancelled = true
    }
  }, [image.url])

  return (
    <button
      type="button"
      className="c64-image-gallery-tile group relative aspect-square overflow-hidden rounded-lg p-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      onClick={() => onOpen(index)}
      aria-label={`View image ${index + 1} of ${total}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-200"
        style={{ '--alpha-inset': inset } as React.CSSProperties}
        loading="lazy"
      />
    </button>
  )
}
