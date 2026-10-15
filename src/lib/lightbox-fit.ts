/** Largest box that fits inside maxWidth × maxHeight at the given width/height ratio. */
export function fitMediaBox(
  maxWidth: number,
  maxHeight: number,
  aspect: number,
): { width: number; height: number } {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9
  const safeWidth = Math.max(0, maxWidth)
  const safeHeight = Math.max(0, maxHeight)
  const width = Math.min(safeWidth, safeHeight * safeAspect)
  return { width, height: width / safeAspect }
}
