'use client'

import { MapContainer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState, useMemo, useCallback } from 'react'
import Supercluster from 'supercluster'
import { createC64BasemapLayer, createC64LabelLayer } from '@/lib/leaflet-c64-tiles'
import {
  createChromeBasemapLayer,
  createChromeLabelLayer,
  type ChromeMapMode,
} from '@/lib/leaflet-chrome-tiles'

const fixLeafletIcons = () => {
  if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })
  }
}

function getThemeRoot(): HTMLElement | null {
  if (typeof window === 'undefined') return null
  return document.getElementById('c64-site-root')
}

export function getChromeThemeMode(): ChromeMapMode | null {
  const mode = getThemeRoot()?.dataset.chromeTheme
  if (mode === 'dark' || mode === 'light') return mode
  return null
}

const getCssVar = (scope: HTMLElement | null, name: string, fallback: string): string => {
  if (!scope) return fallback
  return getComputedStyle(scope).getPropertyValue(`--${name}`).trim() || fallback
}

function useMapThemeEpoch(): number {
  const [epoch, setEpoch] = useState(0)
  useEffect(() => {
    const bump = () => setEpoch((n) => n + 1)
    window.addEventListener('c64-settings-changed', bump)
    return () => window.removeEventListener('c64-settings-changed', bump)
  }, [])
  return epoch
}

/** Every badge on the map is a visitor count, whether it's one place or a cluster of them. */
function createCountIcon(visitors: number, chromeMode: ChromeMapMode | null, popDelayMs = 0) {
  const size = visitors < 10 ? 28 : visitors < 100 ? 34 : 42
  const root = getThemeRoot()
  const accentColor = chromeMode
    ? getCssVar(root, 'chrome-accent', '#0071e3')
    : getCssVar(root, 'c64-accent', getCssVar(root, 'accent', '#a8a8ff'))
  const chrome = chromeMode !== null

  return L.divIcon({
    html: `<div class="map-count-badge" style="
      animation-delay: ${Math.round(popDelayMs)}ms;
      background: ${accentColor};
      color: white;
      border-radius: ${chrome ? '9999px' : '0'};
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: ${visitors < 100 ? '12px' : '13px'};
      font-variant-numeric: tabular-nums;
      border: ${chrome ? '2px solid rgba(255,255,255,0.92)' : '2px solid white'};
      box-shadow: ${chrome ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.25)'};
      font-family: ui-sans-serif, system-ui, sans-serif;
    ">${visitors > 999 ? `${Math.round(visitors / 100) / 10}k` : visitors}</div>`,
    className: chrome ? 'chrome-cluster-icon' : 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/** Geo headers arrive percent-encoded (e.g. "Council%20Bluffs"). */
function decodePlace(value: string | null): string | null {
  if (!value) return value
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function formatVisitors(count: number): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? 'visitor' : 'visitors'}`
}

interface LeafletMapProps {
  /** New data is on its way: badges fade out, then pop back in when it lands. */
  refreshing?: boolean
  points: {
    country: string
    region: string | null
    city: string | null
    latitude: number | null
    longitude: number | null
    count: number
  }[]
}

interface GeoJSONPoint {
  type: 'Feature'
  properties: {
    cluster: boolean
    pointCount?: number
    country: string
    region: string | null
    city: string | null
    count: number
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

function ClusterLayer({
  points,
  chromeMode,
  themeEpoch,
  popEpoch,
  refreshing,
}: {
  points: LeafletMapProps['points']
  chromeMode: ChromeMapMode | null
  themeEpoch: number
  /** Bumped when a refresh lands: every badge is rebuilt, which replays its pop-in. */
  popEpoch: number
  refreshing: boolean
}) {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())
  const [bounds, setBounds] = useState(map.getBounds())

  const supercluster = useMemo(() => {
    const cluster = new Supercluster<GeoJSONPoint['properties'], { count: number }>({
      radius: 120,
      maxZoom: 10,
      minZoom: 0,
      minPoints: 2,
      // Carry visitor totals up through clusters so a badge never means "locations"
      map: (props) => ({ count: props.count }),
      reduce: (acc, props) => {
        acc.count += props.count
      },
    })

    const geoJsonPoints: GeoJSONPoint[] = points
      .filter((p) => p.latitude !== null && p.longitude !== null)
      .map((point) => ({
        type: 'Feature',
        properties: {
          cluster: false,
          country: point.country,
          region: point.region,
          city: point.city,
          count: point.count,
        },
        geometry: {
          type: 'Point',
          coordinates: [point.longitude!, point.latitude!],
        },
      }))

    cluster.load(geoJsonPoints)
    return cluster
  }, [points])

  const clusters = useMemo(() => {
    if (!supercluster) return []

    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ] as [number, number, number, number]

    return supercluster.getClusters(bbox, Math.floor(zoom))
  }, [supercluster, bounds, zoom])

  // One icon per badge for as long as the data, theme and pop epoch hold. react-leaflet swaps the DOM
  // node whenever the icon object changes, so reusing it is what stops a pan from replaying the pop-in.
  const icons = useMemo(
    () => ({ byId: new Map<string, L.DivIcon>(), created: performance.now() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supercluster, chromeMode, themeEpoch, popEpoch],
  )
  const iconFor = (id: string, visitors: number) => {
    const key = `${id}|${visitors}`
    let icon = icons.byId.get(key)
    if (!icon) {
      // A fresh set of data bubbles in over a loose random spread; later arrivals (zoom, pan) are near-instant
      const burst = performance.now() - icons.created < 800
      icon = createCountIcon(visitors, chromeMode, Math.random() * (burst ? 650 : 120))
      icons.byId.set(key, icon)
    }
    return icon
  }

  // The fade-out flag lives on the map's shell (styled in globals.css) and is set from here, not in JSX:
  // react-leaflet swaps badges in effects, so clearing it at render time would show the old ones for a frame.
  // This effect runs after the Marker effects of the same commit.
  useEffect(() => {
    const shell = map.getContainer().parentElement
    if (!shell) return
    if (refreshing) shell.dataset.refreshing = 'true'
    else delete shell.dataset.refreshing
  }, [map, refreshing])

  const handleMoveEnd = useCallback(() => {
    setZoom(map.getZoom())
    setBounds(map.getBounds())
  }, [map])

  useEffect(() => {
    map.on('moveend', handleMoveEnd)
    map.on('zoomend', handleMoveEnd)

    return () => {
      map.off('moveend', handleMoveEnd)
      map.off('zoomend', handleMoveEnd)
    }
  }, [map, handleMoveEnd])

  return (
    <>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates

        if ('point_count' in cluster.properties) {
          const { point_count: pointCount, count: visitors } = cluster.properties
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[latitude, longitude]}
              icon={iconFor(`cluster-${cluster.id}`, visitors)}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(Number(cluster.id)),
                    15,
                  )
                  map.setView([latitude, longitude], expansionZoom, {
                    animate: true,
                  })
                },
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-medium">{formatVisitors(visitors)}</div>
                  <div className="text-xs text-muted-foreground">
                    Across {pointCount} locations · click to zoom in
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        }

        const { country, count } = cluster.properties
        const city = decodePlace(cluster.properties.city)
        const region = decodePlace(cluster.properties.region)
        const place = [city, region].filter(Boolean).join(', ')

        return (
          <Marker
            key={`point-${longitude},${latitude}`}
            position={[latitude, longitude]}
            icon={iconFor(`point-${longitude},${latitude}`, count)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{place || country}</div>
                {place ? <div className="text-muted-foreground">{country}</div> : null}
                <div className="text-xs mt-1">{formatVisitors(count)}</div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

/** Frame the visitors we actually have instead of a fixed, cropped world view. */
function FitToPoints({ points }: { points: LeafletMapProps['points'] }) {
  const map = useMap()

  useEffect(() => {
    const latLngs = points
      .filter((p) => p.latitude !== null && p.longitude !== null)
      .map((p) => [p.latitude!, p.longitude!] as [number, number])
    if (latLngs.length === 0) return
    map.invalidateSize()
    map.fitBounds(L.latLngBounds(latLngs), { padding: [36, 36], maxZoom: 5, animate: false })
  }, [map, points])

  return null
}

function ThemedTileLayers({
  chromeMode,
  themeEpoch,
}: {
  chromeMode: ChromeMapMode | null
  themeEpoch: number
}) {
  const map = useMap()

  useEffect(() => {
    const root = getThemeRoot()
    if (!root) return

    const cs = getComputedStyle(root)

    let base: L.TileLayer
    let labels: L.TileLayer

    if (chromeMode) {
      const ocean = cs.getPropertyValue('--chrome-map-ocean').trim() || '#e5e5ea'
      const land = cs.getPropertyValue('--chrome-map-land').trim() || '#ffffff'
      const labelInk = cs.getPropertyValue('--chrome-map-label').trim() || '#86868b'
      base = createChromeBasemapLayer(chromeMode, ocean, land)
      labels = createChromeLabelLayer(chromeMode, labelInk)
    } else {
      const ocean = cs.getPropertyValue('--c64-border-bg').trim()
      const land = cs.getPropertyValue('--c64-screen-bg').trim()
      const textInk = cs.getPropertyValue('--c64-border-bg').trim()
      base = createC64BasemapLayer(ocean || '#1d1d6e', land || '#352879')
      labels = createC64LabelLayer(textInk || '#1d1d6e')
    }

    base.addTo(map)
    labels.addTo(map)

    return () => {
      map.removeLayer(base)
      map.removeLayer(labels)
    }
  }, [map, chromeMode, themeEpoch])

  return null
}

function MapEmptyState({ message, detail }: { message: string; detail?: string }) {
  const chrome = getChromeThemeMode() !== null
  if (chrome) {
    return (
      <div className="chrome-map-shell h-80 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-sm" style={{ color: 'var(--chrome-muted)' }}>
            {message}
          </p>
          {detail ? (
            <p className="text-xs mt-1" style={{ color: 'var(--chrome-muted)' }}>
              {detail}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="h-80 bg-muted/20 border border-border/20 rounded-none flex items-center justify-center">
      <div className="text-center">
        <div className="text-muted-foreground mb-2">{message}</div>
        {detail ? <div className="text-xs text-muted-foreground">{detail}</div> : null}
      </div>
    </div>
  )
}

export default function LeafletMap({ points, refreshing = false }: LeafletMapProps) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  // Derived during render (not in an effect) so the badges that were faded out are never shown
  // for a frame before their replacements start popping in
  const [wasRefreshing, setWasRefreshing] = useState(refreshing)
  const [popEpoch, setPopEpoch] = useState(0)
  if (wasRefreshing !== refreshing) {
    setWasRefreshing(refreshing)
    if (!refreshing) setPopEpoch((n) => n + 1)
  }

  const themeEpoch = useMapThemeEpoch()
  const chromeMode = getChromeThemeMode()
  const useChromeShell = chromeMode !== null

  const validPoints = useMemo(
    () =>
      points.filter(
        (p) =>
          p.latitude !== null &&
          p.longitude !== null &&
          typeof p.latitude === 'number' &&
          typeof p.longitude === 'number',
      ),
    [points],
  )

  if (validPoints.length === 0) {
    return (
      <MapEmptyState
        message="No visitor locations to display"
        detail="Geo data will be available in production"
      />
    )
  }

  try {
    return (
      <div
        className={
          useChromeShell
            ? 'chrome-map-shell h-80 relative isolate'
            : 'h-80 border border-border/20 rounded-none overflow-hidden relative'
        }
      >
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={1}
          style={{ height: '100%', width: '100%' }}
          className="leaflet-container"
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <ThemedTileLayers chromeMode={chromeMode} themeEpoch={themeEpoch} />
          <ClusterLayer
            points={validPoints}
            chromeMode={chromeMode}
            themeEpoch={themeEpoch}
            popEpoch={popEpoch}
            refreshing={refreshing}
          />
          {/* After ClusterLayer so its move listeners are attached before the first fit */}
          <FitToPoints points={points} />
        </MapContainer>
      </div>
    )
  } catch (error) {
    console.error('Map rendering error:', error)
    return (
      <MapEmptyState message="Map failed to load" detail="Check console for details" />
    )
  }
}
