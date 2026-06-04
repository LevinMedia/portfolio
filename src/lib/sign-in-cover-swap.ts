export type CoverSwapDirection = 'up' | 'down' | 'left' | 'right'

/** Which neighbor to swap with based on an X through the tile (normalized 0–1 click). */
export function coverSwapDirectionFromClick(x: number, y: number): CoverSwapDirection | null {
  const relX = x - 0.5
  const relY = y - 0.5

  if (relY < 0 && relY < relX && relY < -relX) return 'up'
  if (relY > 0 && relY > relX && relY > -relX) return 'down'
  if (relX < 0 && relY > relX && relY < -relX) return 'left'
  if (relX > 0 && relY < relX && relY > -relX) return 'right'

  return null
}

export function coverSwapNeighborIndex(
  index: number,
  direction: CoverSwapDirection,
  columns: number,
  tileCount: number,
): number | null {
  let neighbor: number

  switch (direction) {
    case 'up':
      neighbor = index - columns
      break
    case 'down':
      neighbor = index + columns
      break
    case 'left':
      if (index % columns === 0) return null
      neighbor = index - 1
      break
    case 'right':
      if (index % columns === columns - 1) return null
      neighbor = index + 1
      break
  }

  if (neighbor < 0 || neighbor >= tileCount) return null
  return neighbor
}
