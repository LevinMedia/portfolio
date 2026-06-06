import { describe, expect, it } from 'vitest'
import { computeGalleryLayout, computeGalleryRows } from './gallery-layout'

describe('computeGalleryRows', () => {
  it('handles small counts as a single row', () => {
    expect(computeGalleryRows(1)).toEqual([1])
    expect(computeGalleryRows(2)).toEqual([2])
    expect(computeGalleryRows(3)).toEqual([3])
    expect(computeGalleryRows(4)).toEqual([4])
  })

  it('lays out 5 as 3 + 2', () => {
    expect(computeGalleryRows(5)).toEqual([3, 2])
  })

  it('lays out 6 as 3 + 3', () => {
    expect(computeGalleryRows(6)).toEqual([3, 3])
  })

  it('lays out 7 as 4 + 3', () => {
    expect(computeGalleryRows(7)).toEqual([4, 3])
  })

  it('prefers symmetric 3-column rows for 9', () => {
    expect(computeGalleryRows(9)).toEqual([3, 3, 3])
  })

  it('centers a short last row via partition (10 → 4 + 4 + 2)', () => {
    expect(computeGalleryRows(10)).toEqual([4, 4, 2])
  })

  it('uses denser rows for 12', () => {
    expect(computeGalleryRows(12)).toEqual([4, 4, 4])
  })
})

describe('computeGalleryLayout', () => {
  it('uses max row width for uniform tile sizing', () => {
    expect(computeGalleryLayout(5)).toEqual({ rows: [3, 2], maxCols: 3 })
    expect(computeGalleryLayout(7)).toEqual({ rows: [4, 3], maxCols: 4 })
  })
})
