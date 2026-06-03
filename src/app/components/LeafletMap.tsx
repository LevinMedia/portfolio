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

function createClusterIcon(count: number, chromeMode: ChromeMapMode | null) {
  const size = count < 10 ? 32 : count < 100 ? 40 : 48
  const root = getThemeRoot()
  const accentColor = chromeMode
    ? getCssVar(root, 'chrome-accent', '#0071e3')
    : getCssVar(root, 'c64-accent', getCssVar(root, 'accent', '#a8a8ff'))
  const chrome = chromeMode !== null

  return L.divIcon({
    html: `<div style="
      background: ${accentColor};
      color: white;
      border-radius: ${chrome ? '9999px' : '0'};
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: ${size < 40 ? '12px' : '14px'};
      border: ${chrome ? '2px solid rgba(255,255,255,0.92)' : '2px solid white'};
      box-shadow: ${chrome ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.25)'};
      font-family: ui-sans-serif, system-ui, sans-serif;
    ">${count}</div>`,
    className: chrome ? 'chrome-cluster-icon' : 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function createSingleMarkerIcon(count: number, chromeMode: ChromeMapMode | null) {
  const size = 32
  const root = getThemeRoot()
  const accentColor = chromeMode
    ? getCssVar(root, 'chrome-accent', '#0071e3')
    : getCssVar(root, 'c64-accent', getCssVar(root, 'accent', '#a8a8ff'))
  const chrome = chromeMode !== null

  return L.divIcon({
    html: `<div style="
      background: ${accentColor};
      color: white;
      border-radius: ${chrome ? '9999px' : '0'};
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
      border: ${chrome ? '2px solid rgba(255,255,255,0.92)' : '2px solid white'};
      box-shadow: ${chrome ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.25)'};
      font-family: ui-sans-serif, system-ui, sans-serif;
    ">${count}</div>`,
    className: chrome ? 'chrome-single-marker-icon' : 'custom-single-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

interface LeafletMapProps {
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
}: {
  points: LeafletMapProps['points']
  chromeMode: ChromeMapMode | null
  themeEpoch: number
}) {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())
  const [bounds, setBounds] = useState(map.getBounds())

  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 120,
      maxZoom: 10,
      minZoom: 0,
      minPoints: 2,
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
      {clusters.map((cluster, index) => {
        const [longitude, latitude] = cluster.geometry.coordinates
        const { cluster: isCluster, point_count: pointCount } = cluster.properties
        const markerKey = `${themeEpoch}-${index}`

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${markerKey}`}
              position={[latitude, longitude]}
              icon={createClusterIcon(pointCount, chromeMode)}
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
                  <div className="font-medium">{pointCount} locations</div>
                  <div className="text-xs text-muted-foreground">Click to zoom in</div>
                </div>
              </Popup>
            </Marker>
          )
        }

        return (
          <Marker
            key={`point-${markerKey}`}
            position={[latitude, longitude]}
            icon={createSingleMarkerIcon(cluster.properties.count, chromeMode)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">
                  {cluster.properties.city && cluster.properties.region
                    ? `${cluster.properties.city}, ${cluster.properties.region}`
                    : cluster.properties.city ||
                      cluster.properties.region ||
                      cluster.properties.country}
                </div>
                <div className="text-muted-foreground">{cluster.properties.country}</div>
                <div className="text-xs mt-1">
                  {cluster.properties.count}{' '}
                  {cluster.properties.count === 1 ? 'visitor' : 'visitors'}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
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

export default function LeafletMap({ points }: LeafletMapProps) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const themeEpoch = useMapThemeEpoch()
  const chromeMode = getChromeThemeMode()
  const useChromeShell = chromeMode !== null

  const validPoints = points.filter(
    (p) =>
      p.latitude !== null &&
      p.longitude !== null &&
      typeof p.latitude === 'number' &&
      typeof p.longitude === 'number',
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
            ? 'chrome-map-shell h-80 relative'
            : 'h-80 border border-border/20 rounded-none overflow-hidden relative'
        }
      >
        <MapContainer
          center={[20, 0]}
          zoom={2}
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
          />
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
