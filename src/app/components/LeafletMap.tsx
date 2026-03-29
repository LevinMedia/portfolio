'use client'

import { MapContainer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState, useMemo, useCallback } from 'react'
import Supercluster from 'supercluster'
import { createC64BasemapLayer, createC64LabelLayer } from '@/lib/leaflet-c64-tiles'

// Fix for default Leaflet icon issue with Webpack
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

/** C64 theme vars live on #c64-site-root (accent, screen, border). */
const getC64CssVar = (varName: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback
  const el = document.getElementById('c64-site-root')
  const scope = el ?? document.documentElement
  return getComputedStyle(scope).getPropertyValue(`--${varName}`).trim() || fallback
}

// Create cluster icon using site accent color
const createClusterIcon = (count: number) => {
  const size = count < 10 ? 32 : count < 100 ? 40 : 48
  const accentColor = getC64CssVar('c64-accent', getC64CssVar('accent', '#a8a8ff'))
  
  return L.divIcon({
    html: `<div style="
      background: ${accentColor};
      color: white;
      border-radius: 0;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: ${size < 40 ? '12px' : '14px'};
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      font-family: ui-sans-serif, system-ui, sans-serif;
    ">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

// Create single marker icon that looks like a cluster
const createSingleMarkerIcon = (count: number) => {
  const size = 32
  const accentColor = getC64CssVar('c64-accent', getC64CssVar('accent', '#a8a8ff'))
  
  return L.divIcon({
    html: `<div style="
      background: ${accentColor};
      color: white;
      border-radius: 0;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      font-family: ui-sans-serif, system-ui, sans-serif;
    ">${count}</div>`,
    className: 'custom-single-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

interface LeafletMapProps {
  points: {
    country: string;
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    count: number;
  }[];
}

interface GeoJSONPoint {
  type: 'Feature';
  properties: {
    cluster: boolean;
    pointCount?: number;
    country: string;
    region: string | null;
    city: string | null;
    count: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

// Component to handle clustering
function ClusterLayer({ points }: { points: LeafletMapProps['points'] }) {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())
  const [bounds, setBounds] = useState(map.getBounds())

  // Create supercluster instance
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 120, // Increased radius for better clustering at world scale
      maxZoom: 10, // Lower max zoom to encourage more clustering
      minZoom: 0,
      minPoints: 2,
    })

    // Convert points to GeoJSON format
    const geoJsonPoints: GeoJSONPoint[] = points
      .filter(p => p.latitude !== null && p.longitude !== null)
      .map(point => ({
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

  // Get clusters for current view
  const clusters = useMemo(() => {
    if (!supercluster) return []
    
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ] as [number, number, number, number]

    return supercluster.getClusters(bbox, Math.floor(zoom))
  }, [supercluster, bounds, zoom, points.length])

  // Update zoom and bounds when map changes
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

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${index}`}
              position={[latitude, longitude]}
              icon={createClusterIcon(pointCount)}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(Number(cluster.id)),
                    15
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
                  <div className="text-xs text-muted-foreground">
                    Click to zoom in
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        }

        return (
          <Marker
            key={`point-${index}`}
            position={[latitude, longitude]}
            icon={createSingleMarkerIcon(cluster.properties.count)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">
                  {cluster.properties.city && cluster.properties.region 
                    ? `${cluster.properties.city}, ${cluster.properties.region}` 
                    : cluster.properties.city || cluster.properties.region || cluster.properties.country}
                </div>
                <div className="text-muted-foreground">{cluster.properties.country}</div>
                <div className="text-xs mt-1">
                  {cluster.properties.count} {cluster.properties.count === 1 ? 'visitor' : 'visitors'}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

function C64ThemedTileLayers() {
  const map = useMap()
  const [themeEpoch, setThemeEpoch] = useState(0)

  useEffect(() => {
    const onC64 = () => setThemeEpoch((n) => n + 1)
    window.addEventListener('c64-settings-changed', onC64)
    return () => window.removeEventListener('c64-settings-changed', onC64)
  }, [])

  useEffect(() => {
    const root = document.getElementById('c64-site-root')
    if (!root) return

    const cs = getComputedStyle(root)
    const ocean = cs.getPropertyValue('--c64-border-bg').trim()
    const land = cs.getPropertyValue('--c64-screen-bg').trim()
    const textInk = cs.getPropertyValue('--c64-border-bg').trim()

    const base = createC64BasemapLayer(ocean || '#1d1d6e', land || '#352879')
    const labels = createC64LabelLayer(textInk || '#1d1d6e')

    base.addTo(map)
    labels.addTo(map)

    return () => {
      map.removeLayer(base)
      map.removeLayer(labels)
    }
  }, [map, themeEpoch])

  return null
}

export default function LeafletMap({ points }: LeafletMapProps) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const validPoints = points.filter(p => 
    p.latitude !== null && p.longitude !== null && 
    typeof p.latitude === 'number' && typeof p.longitude === 'number'
  )

  if (validPoints.length === 0) {
    return (
      <div className="h-80 bg-muted/20 border border-border/20 rounded-none flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">No visitor locations to display</div>
          <div className="text-xs text-muted-foreground">
            Geo data will be available in production
          </div>
        </div>
      </div>
    )
  }

  try {
    return (
      <div className="h-80 border border-border/20 rounded-none overflow-hidden relative">
        <MapContainer
          center={[20, 0]} // Center on world
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          className="leaflet-container"
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <C64ThemedTileLayers />
          <ClusterLayer points={validPoints} />
        </MapContainer>
      </div>
    )
  } catch (error) {
    console.error('Map rendering error:', error)
    return (
      <div className="h-80 bg-muted/20 border border-border/20 rounded-none flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Map failed to load</div>
          <div className="text-xs text-muted-foreground">
            Check console for details
          </div>
        </div>
      </div>
    )
  }
}
