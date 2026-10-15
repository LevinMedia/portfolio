'use client'

import { useState } from 'react'
import ImageGalleryLightbox from './ImageGalleryLightbox'

interface ZoomableImageProps {
  src: string
  alt?: string
  className?: string
  /** Opens the shared post lightbox. Falls back to a single-image lightbox. */
  onOpen?: () => void
}

/** Inline content image that opens in the gallery lightbox when clicked. */
export default function ZoomableImage({ src, alt = '', className = '', onOpen }: ZoomableImageProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="block w-full cursor-zoom-in appearance-none border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={() => (onOpen ? onOpen() : setOpen(true))}
        aria-label={alt ? `View full size: ${alt}` : 'View image full size'}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={className} loading="lazy" />
      </button>
      {onOpen ? null : (
        <ImageGalleryLightbox images={[{ url: src, caption: alt || undefined }]} open={open} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
