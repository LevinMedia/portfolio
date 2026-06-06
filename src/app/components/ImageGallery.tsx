'use client'

import { useState } from 'react'
import type { GalleryImage } from '@/lib/gallery-markdown'
import { chunkByRows, computeGalleryLayout } from '@/lib/gallery-layout'
import ImageGalleryLightbox from './ImageGalleryLightbox'

interface ImageGalleryProps {
  images: GalleryImage[]
  caption?: string
}

export default function ImageGallery({ images, caption }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (images.length === 0) return null

  const { rows, maxCols } = computeGalleryLayout(images.length)
  const rowChunks = chunkByRows(images, rows)
  let imageIndex = 0

  const openAt = (index: number) => {
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
      {caption ? (
        <figcaption className="mb-3 text-center text-sm text-muted-foreground">{caption}</figcaption>
      ) : null}
      <div className="c64-image-gallery-rows">
        {rowChunks.map((rowImages, rowIndex) => (
          <div key={rowIndex} className="c64-image-gallery-row">
            {rowImages.map((image) => {
              const index = imageIndex++
              return (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  className="c64-image-gallery-tile group relative aspect-square overflow-hidden rounded-lg p-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => openAt(index)}
                  aria-label={`View image ${index + 1} of ${images.length}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <ImageGalleryLightbox
        images={images}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </figure>
  )
}
