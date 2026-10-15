const OPAQUE_ALPHA = 240
const MAX_INSET_SCALE = 1.5

/**
 * Zoom for an object-fit:cover tile so transparent padding and rounded
 * corners fall outside the crop. Returns 1 when that crop is already solid.
 */
export function coverInsetScale(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tileAspect = 1,
): number {
  if (width < 2 || height < 2 || tileAspect <= 0) return 1

  const crop = visibleCoverWindow(width, height, tileAspect)
  const bounds = opaqueBounds(data, width, crop)
  if (!bounds) return 1

  const corner = Math.min(
    cornerFringe(data, width, bounds),
    Math.floor(Math.min(crop.visW, crop.visH) * 0.15),
  )

  const contentLeft = bounds.minX + corner
  const contentRight = bounds.maxX + 1 - corner
  const contentTop = bounds.minY + corner
  const contentBottom = bounds.maxY + 1 - corner
  if (contentRight - contentLeft < 2 || contentBottom - contentTop < 2) return 1

  const centerX = crop.visX + crop.visW / 2
  const centerY = crop.visY + crop.visH / 2
  const roomLeft = centerX - contentLeft
  const roomRight = contentRight - centerX
  const roomTop = centerY - contentTop
  const roomBottom = contentBottom - centerY
  if (roomLeft < 1 || roomRight < 1 || roomTop < 1 || roomBottom < 1) return 1

  const scale = Math.max(
    crop.visW / (2 * roomLeft),
    crop.visW / (2 * roomRight),
    crop.visH / (2 * roomTop),
    crop.visH / (2 * roomBottom),
  )

  if (scale <= 1.005) return 1
  return Math.min(scale, MAX_INSET_SCALE)
}

const PROBE_SIZE = 96

/** Loads a PNG/WebP offscreen and returns how far its gallery tile should zoom in. */
export function probeGalleryInsetScale(url: string): Promise<number> {
  if (!galleryUrlMayHaveAlpha(url) || typeof document === 'undefined') return Promise.resolve(1)

  return new Promise((resolve) => {
    const image = new Image()
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      image.crossOrigin = 'anonymous'
    }
    image.onload = () => {
      try {
        const fit = Math.min(PROBE_SIZE / image.naturalWidth, PROBE_SIZE / image.naturalHeight, 1)
        const width = Math.max(2, Math.round(image.naturalWidth * fit))
        const height = Math.max(2, Math.round(image.naturalHeight * fit))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context || !image.naturalWidth || !image.naturalHeight) {
          resolve(1)
          return
        }
        context.drawImage(image, 0, 0, width, height)
        const { data } = context.getImageData(0, 0, width, height)
        resolve(coverInsetScale(data, width, height, 1))
      } catch {
        resolve(1)
      }
    }
    image.onerror = () => resolve(1)
    image.src = url
  })
}

export function galleryUrlMayHaveAlpha(url: string): boolean {
  const path = url.split('?')[0].split('#')[0].toLowerCase()
  return /\.(png|webp|gif|avif)$/.test(path)
}

type CoverWindow = { visX: number; visY: number; visW: number; visH: number }
type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

function visibleCoverWindow(width: number, height: number, tileAspect: number): CoverWindow {
  const imageAspect = width / height
  if (imageAspect > tileAspect) {
    const visH = height
    let visW = Math.max(1, Math.round(height * tileAspect))
    const visX = Math.max(0, Math.floor((width - visW) / 2))
    visW = Math.min(visW, width - visX)
    return { visX, visY: 0, visW, visH }
  }

  const visW = width
  let visH = Math.max(1, Math.round(width / tileAspect))
  const visY = Math.max(0, Math.floor((height - visH) / 2))
  visH = Math.min(visH, height - visY)
  return { visX: 0, visY, visW, visH }
}

function opaqueBounds(data: Uint8ClampedArray, width: number, crop: CoverWindow): Bounds | null {
  let minX = crop.visX + crop.visW
  let minY = crop.visY + crop.visH
  let maxX = -1
  let maxY = -1

  for (let y = crop.visY; y < crop.visY + crop.visH; y++) {
    for (let x = crop.visX; x < crop.visX + crop.visW; x++) {
      if (data[(y * width + x) * 4 + 3] < OPAQUE_ALPHA) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  if (maxX < 0) return null
  return { minX, minY, maxX, maxY }
}

/** How far the rounded transparent corner eats into the opaque bounding box. */
function cornerFringe(data: Uint8ClampedArray, width: number, bounds: Bounds): number {
  return Math.max(
    transparentRun(data, width, bounds.minX, bounds.minY, 1, 0, bounds.maxX),
    transparentRun(data, width, bounds.maxX, bounds.minY, -1, 0, bounds.minX),
    transparentRun(data, width, bounds.minX, bounds.maxY, 1, 0, bounds.maxX),
    transparentRun(data, width, bounds.maxX, bounds.maxY, -1, 0, bounds.minX),
    transparentRun(data, width, bounds.minX, bounds.minY, 0, 1, bounds.maxY),
    transparentRun(data, width, bounds.minX, bounds.maxY, 0, -1, bounds.minY),
    transparentRun(data, width, bounds.maxX, bounds.minY, 0, 1, bounds.maxY),
    transparentRun(data, width, bounds.maxX, bounds.maxY, 0, -1, bounds.minY),
  )
}

function transparentRun(
  data: Uint8ClampedArray,
  width: number,
  startX: number,
  startY: number,
  stepX: number,
  stepY: number,
  limit: number,
): number {
  let run = 0
  let x = startX
  let y = startY
  while (stepX > 0 ? x <= limit : stepX < 0 ? x >= limit : stepY > 0 ? y <= limit : y >= limit) {
    if (data[(y * width + x) * 4 + 3] >= OPAQUE_ALPHA) return run
    run += 1
    x += stepX
    y += stepY
    if (run > 10_000) return run
  }
  return run
}
