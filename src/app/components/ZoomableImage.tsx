'use client'

import { useState } from 'react'
import ImageGalleryLightbox from './ImageGalleryLightbox'

interface ZoomableImageProps {
  src: string
  alt?: string
  className?: string
}

/** Inline content image that opens in the gallery lightbox when clicked. */
export default function ZoomableImage({ src, alt = '', className = '' }: ZoomableImageProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="c64-zoomable-image block w-full cursor-pointer appearance-none border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={() => setOpen(true)}
        aria-label={alt ? `View full size: ${alt}` : 'View image full size'}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={`cursor-pointer ${className}`.trim()} loading="lazy" />
      </button>
      <ImageGalleryLightbox images={[{ url: src }]} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
