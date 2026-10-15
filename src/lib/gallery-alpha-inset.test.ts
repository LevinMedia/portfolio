import { describe, expect, it } from 'vitest'
import { coverInsetScale, galleryUrlMayHaveAlpha } from './gallery-alpha-inset'

function pixels(
  width: number,
  height: number,
  alphaAt: (x: number, y: number) => number,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[(y * width + x) * 4 + 3] = alphaAt(x, y)
    }
  }
  return data
}

describe('coverInsetScale', () => {
  it('leaves a solid image alone', () => {
    expect(coverInsetScale(pixels(40, 40, () => 255), 40, 40)).toBe(1)
  })

  it('zooms a wide image until transparent bands sit outside the tile', () => {
    const data = pixels(100, 50, (_x, y) => (y < 5 || y >= 45 ? 0 : 255))
    expect(coverInsetScale(data, 100, 50, 1)).toBeCloseTo(1.25, 2)
  })

  it('zooms past rounded transparent corners on the visible crop', () => {
    const data = pixels(60, 60, (x, y) => {
      const inCorner =
        (x < 6 && y < 6) ||
        (x >= 54 && y < 6) ||
        (x < 6 && y >= 54) ||
        (x >= 54 && y >= 54)
      return inCorner ? 0 : 255
    })
    const scale = coverInsetScale(data, 60, 60, 1)
    expect(scale).toBeGreaterThan(1.15)
    expect(scale).toBeLessThan(1.5)
  })

  it('leaves a wide image alone when its transparent corners are already cropped off', () => {
    const data = pixels(120, 40, (x, y) => {
      const inCorner =
        (x < 4 && y < 4) ||
        (x >= 116 && y < 4) ||
        (x < 4 && y >= 36) ||
        (x >= 116 && y >= 36)
      return inCorner ? 0 : 255
    })
    expect(coverInsetScale(data, 120, 40, 1)).toBe(1)
  })
})

describe('galleryUrlMayHaveAlpha', () => {
  it('checks the file extension and ignores query strings', () => {
    expect(galleryUrlMayHaveAlpha('https://cdn.example/a.PNG?v=1')).toBe(true)
    expect(galleryUrlMayHaveAlpha('https://cdn.example/a.webp')).toBe(true)
    expect(galleryUrlMayHaveAlpha('https://cdn.example/a.jpg')).toBe(false)
    expect(galleryUrlMayHaveAlpha('https://cdn.example/a.jpeg')).toBe(false)
  })
})
