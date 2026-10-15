import { describe, expect, it } from 'vitest'
import { fitMediaBox } from './lightbox-fit'

describe('fitMediaBox', () => {
  it('shrinks a wide frame so the height stays inside the caption gap', () => {
    const box = fitMediaBox(1600, 500, 16 / 9)
    expect(box.height).toBeCloseTo(500)
    expect(box.width).toBeCloseTo(500 * (16 / 9))
  })

  it('uses the full width when the frame is already short enough', () => {
    const box = fitMediaBox(400, 800, 16 / 9)
    expect(box.width).toBeCloseTo(400)
    expect(box.height).toBeCloseTo(225)
  })
})
