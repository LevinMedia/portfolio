import type { CSSProperties } from 'react'

export type ThumbnailCrop = {
  x: number
  y: number
  width: number
  height: number
  unit: string
}

export function thumbnailCropImageStyle(url: string, crop: ThumbnailCrop): CSSProperties {
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: 'cover',
    backgroundPosition: `${crop.x}% ${crop.y}%`,
    transform: `scale(${100 / crop.width})`,
    transformOrigin: `${crop.x}% ${crop.y}%`,
  }
}
