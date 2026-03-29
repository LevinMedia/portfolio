import L, { type DoneCallback } from 'leaflet'

/** Parse hex or rgb() from computed styles (C64 theme sets hex on #c64-site-root). */
export function parseCssColorToRgb(input: string): { r: number; g: number; b: number } {
  const s = input.trim()
  if (!s) return { r: 29, g: 29, b: 110 }
  if (s.startsWith('#')) {
    let h = s.slice(1)
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    const n = parseInt(h, 16)
    if (Number.isNaN(n)) return { r: 29, g: 29, b: 110 }
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
  if (m) return { r: +m[1], g: +m[2], b: +m[3] }
  return { r: 29, g: 29, b: 110 }
}

/** Light basemap: water is mid-grey, land/off-white is much brighter — split on luma. */
function recolorTerrainPixelsLightBasemap(
  data: Uint8ClampedArray,
  ocean: { r: number; g: number; b: number },
  land: { r: number; g: number; b: number },
  /** Pixels with luma ≥ this use land color (Carto light_nolabels land ~236–255, water ~180–220). */
  landMinLuma: number,
) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    const t = y >= landMinLuma ? land : ocean
    data[i] = t.r
    data[i + 1] = t.g
    data[i + 2] = t.b
  }
}

/** Dark label / line pixels on Carto light_only_labels → theme ink (keeps anti-alias fringes). */
function recolorLabelPixels(
  data: Uint8ClampedArray,
  ink: { r: number; g: number; b: number },
  minAlpha: number,
  lumaCutoff: number,
) {
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < minAlpha) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    if (y < lumaCutoff) {
      data[i] = ink.r
      data[i + 1] = ink.g
      data[i + 2] = ink.b
    }
  }
}

const CARTO_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

/**
 * Carto light_nolabels: land is much brighter than water — reliable split (dark_nolabels land/water
 * both sit under a single luma threshold, so everything became ocean).
 */
export function createC64BasemapLayer(oceanCss: string, landCss: string): L.TileLayer {
  const ocean = parseCssColorToRgb(oceanCss)
  const land = parseCssColorToRgb(landCss)
  const landMinLuma = 228

  const Themed = L.TileLayer.extend({
    createTile(this: L.TileLayer, coords: L.Coords, done: DoneCallback) {
      const finish = done as DoneCallback
      const tile = L.DomUtil.create('canvas', 'leaflet-tile') as HTMLCanvasElement
      const size = this.getTileSize()
      tile.width = size.x
      tile.height = size.y
      const ctx = tile.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        finish(new Error('2d context'), tile)
        return tile
      }
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, size.x, size.y)
          const imageData = ctx.getImageData(0, 0, size.x, size.y)
          recolorTerrainPixelsLightBasemap(imageData.data, ocean, land, landMinLuma)
          ctx.putImageData(imageData, 0, 0)
        } catch {
          ctx.clearRect(0, 0, size.x, size.y)
          ctx.drawImage(img, 0, 0, size.x, size.y)
        }
        finish(undefined, tile)
      }
      img.onerror = () => finish(new Error('tile load'), tile)
      img.src = this.getTileUrl(coords)
      return tile
    },
  })

  return new Themed('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: CARTO_ATTR,
    subdomains: 'abcd',
    maxZoom: 20,
    className: 'leaflet-c64-base-tiles',
  })
}

/** Carto light_only_labels: recolor dark glyphs to theme “dark” ink (border). */
export function createC64LabelLayer(inkCss: string): L.TileLayer {
  const ink = parseCssColorToRgb(inkCss)

  const Themed = L.TileLayer.extend({
    createTile(this: L.TileLayer, coords: L.Coords, done: DoneCallback) {
      const finish = done as DoneCallback
      const tile = L.DomUtil.create('canvas', 'leaflet-tile') as HTMLCanvasElement
      const size = this.getTileSize()
      tile.width = size.x
      tile.height = size.y
      const ctx = tile.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        finish(new Error('2d context'), tile)
        return tile
      }
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, size.x, size.y)
          const imageData = ctx.getImageData(0, 0, size.x, size.y)
          recolorLabelPixels(imageData.data, ink, 18, 130)
          ctx.putImageData(imageData, 0, 0)
        } catch {
          ctx.clearRect(0, 0, size.x, size.y)
          ctx.drawImage(img, 0, 0, size.x, size.y)
        }
        finish(undefined, tile)
      }
      img.onerror = () => finish(new Error('tile load'), tile)
      img.src = this.getTileUrl(coords)
      return tile
    },
  })

  return new Themed('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
    attribution: '',
    subdomains: 'abcd',
    maxZoom: 20,
    className: 'leaflet-c64-label-tiles',
    opacity: 0.98,
  })
}
