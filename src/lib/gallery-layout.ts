/** Row sizes (2–4 items per row) for a gallery grid. */
export function computeGalleryRows(count: number): number[] {
  if (count <= 0) return []
  if (count <= 4) return [count]

  for (const maxCol of [4, 3, 2]) {
    const rows = partitionRows(count, maxCol)
    if (rows) return rows
  }

  return [count]
}

function partitionRows(n: number, maxCol: number): number[] | null {
  const rows: number[] = []
  let remaining = n

  while (remaining > 0) {
    if (remaining <= maxCol) {
      if (remaining === 1 && rows.length > 0) return null
      rows.push(remaining)
      remaining = 0
      continue
    }

    const after = remaining - maxCol
    if (after === 1) {
      rows.push(maxCol - 1)
      remaining -= maxCol - 1
    } else {
      rows.push(maxCol)
      remaining -= maxCol
    }
  }

  if (rows.some((r) => r < 1 || r > 4)) return null
  // Prefer a 3-column layout when 4-column would leave a row of 2 on a count divisible by 3.
  if (maxCol === 4 && rows.includes(2) && n % 3 === 0) return null

  return rows
}

export function computeGalleryLayout(count: number): { rows: number[]; maxCols: number } {
  const rows = computeGalleryRows(count)
  return { rows, maxCols: Math.max(...rows, 1) }
}

export function chunkByRows<T>(items: T[], rows: number[]): T[][] {
  const chunks: T[][] = []
  let index = 0
  for (const size of rows) {
    chunks.push(items.slice(index, index + size))
    index += size
  }
  return chunks
}
