import L, { type DoneCallback } from 'leaflet'
import { parseCssColorToRgb } from '@/lib/leaflet-c64-tiles'

type TileLayerClass = new (urlTemplate: string, options?: L.TileLayerOptions) => L.TileLayer

const CARTO_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

function recolorTerrainByLuma(
  data: Uint8ClampedArray,
  ocean: { r: number; g: number; b: number },
  land: { r: number; g: number; b: number },
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

/** Dark glyphs / lines → ink (light basemap labels). */
function recolorDarkLabelPixels(
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

function createThemedRasterLayer(
  urlTemplate: string,
  className: string,
  recolor: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): L.TileLayer {
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
          recolor(ctx, size.x, size.y)
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
  }) as unknown as TileLayerClass

  return new Themed(urlTemplate, {
    attribution: CARTO_ATTR,
    subdomains: 'abcd',
    maxZoom: 20,
    className,
  })
}

export type ChromeMapMode = 'light' | 'dark'

export function createChromeBasemapLayer(
  mode: ChromeMapMode,
  oceanCss: string,
  landCss: string,
): L.TileLayer {
  const ocean = parseCssColorToRgb(oceanCss)
  const land = parseCssColorToRgb(landCss)

  if (mode === 'light') {
    return createThemedRasterLayer(
      'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      'leaflet-chrome-base-tiles',
      (ctx, w, h) => {
        const imageData = ctx.getImageData(0, 0, w, h)
        recolorTerrainByLuma(imageData.data, ocean, land, 228)
        ctx.putImageData(imageData, 0, 0)
      },
    )
  }

  // Carto dark_nolabels keeps land/water at similar low luma — a single cutoff paints
  // everything ocean. Use light_nolabels (bright land vs grey water) and map to dark chrome colors.
  return createThemedRasterLayer(
    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    'leaflet-chrome-base-tiles',
    (ctx, w, h) => {
      const imageData = ctx.getImageData(0, 0, w, h)
      recolorTerrainByLuma(imageData.data, ocean, land, 228)
      ctx.putImageData(imageData, 0, 0)
    },
  )
}

export function createChromeLabelLayer(mode: ChromeMapMode, inkCss: string): L.TileLayer {
  const ink = parseCssColorToRgb(inkCss)

  if (mode === 'light') {
    const layer = createThemedRasterLayer(
      'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
      'leaflet-chrome-label-tiles',
      (ctx, w, h) => {
        const imageData = ctx.getImageData(0, 0, w, h)
        recolorDarkLabelPixels(imageData.data, ink, 18, 130)
        ctx.putImageData(imageData, 0, 0)
      },
    )
    layer.options.attribution = ''
    layer.options.opacity = 0.92
    return layer
  }

  const layer = createThemedRasterLayer(
    'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
    'leaflet-chrome-label-tiles',
    (ctx, w, h) => {
      const imageData = ctx.getImageData(0, 0, w, h)
      recolorDarkLabelPixels(imageData.data, ink, 18, 130)
      ctx.putImageData(imageData, 0, 0)
    },
  )
  layer.options.attribution = ''
  layer.options.opacity = 0.9
  return layer
}
