'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Supercluster from 'supercluster'

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark')
      setIsDark(isDarkMode)
    }

    // Check initial state
    checkDarkMode()

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  return isDark
}

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

// Get CSS variable value
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getCSSVariable = (varName: string): string => {
  if (typeof window === 'undefined') return '#0891b2' // fallback
  return getComputedStyle(document.documentElement).getPropertyValue(`--${varName}`).trim() || '#0891b2'
}

// Create cluster icon - Win95 style square with blue background
const createClusterIcon = (count: number) => {
  const size = count < 10 ? 32 : count < 100 ? 40 : 48
  const blueColor = getComputedStyle(document.documentElement).getPropertyValue('--next95-primary').trim() || '#0000ff' // Same as chart views
  
  return L.divIcon({
    html: `<div style="
      background: ${blueColor};
      color: white;
      border-radius: 0;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: ${size < 40 ? '11px' : '13px'};
      border: 2px solid #000000;
      box-shadow: 2px 2px 0 rgba(0,0,0,0.3);
      font-family: 'MS Sans Serif', system-ui, sans-serif;
    ">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

// Create single marker icon - Win95 style square
const createSingleMarkerIcon = (count: number) => {
  const size = 32
  const blueColor = getComputedStyle(document.documentElement).getPropertyValue('--next95-primary').trim() || '#0000ff' // Same as chart views
  
  return L.divIcon({
    html: `<div style="
      background: ${blueColor};
      color: white;
      border-radius: 0;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 11px;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0 rgba(0,0,0,0.3);
      font-family: 'MS Sans Serif', system-ui, sans-serif;
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
    
    // Debug logging
    console.log('Supercluster Setup:', {
      inputPoints: points.length,
      geoJsonPoints: geoJsonPoints.length,
      samplePoints: geoJsonPoints.slice(0, 3)
    })
    
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

    const clustersResult = supercluster.getClusters(bbox, Math.floor(zoom))
    
    // Debug logging
    console.log('🗺️ Supercluster Debug:', {
      zoom: Math.floor(zoom),
      bbox,
      totalPoints: points.length,
      clustersFound: clustersResult.length,
      clusters: clustersResult.map(c => ({
        isCluster: c.properties.cluster,
        pointCount: c.properties.point_count,
        coordinates: c.geometry.coordinates,
        id: c.id
      })),
      clusterBreakdown: {
        actualClusters: clustersResult.filter(c => c.properties.cluster).length,
        individualPoints: clustersResult.filter(c => !c.properties.cluster).length
      }
    })

    return clustersResult
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

export default function LeafletMap({ points }: LeafletMapProps) {
  const isDarkMode = useDarkMode()

  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const validPoints = points.filter(p => 
    p.latitude !== null && p.longitude !== null && 
    typeof p.latitude === 'number' && typeof p.longitude === 'number'
  )

  // Switch tile layer based on dark mode
  const tileLayerConfig = isDarkMode
    ? {
        // Dark mode - Stadia AlidadeSmoothDark
        url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        subdomains: ''
      }
    : {
        // Light mode - CartoDB Voyager (white oceans with darker landmass)
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd'
      }

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
          <TileLayer
            url={tileLayerConfig.url}
            attribution={tileLayerConfig.attribution}
            subdomains={tileLayerConfig.subdomains}
            maxZoom={18}
          />
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
