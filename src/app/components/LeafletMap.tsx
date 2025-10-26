'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState, useMemo } from 'react'
import Supercluster from 'supercluster'

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

// Create cluster icon
const createClusterIcon = (count: number) => {
  const size = count < 10 ? 30 : count < 100 ? 40 : 50
  const color = count < 10 ? '#3b82f6' : count < 100 ? '#f59e0b' : '#ef4444'
  
  return L.divIcon({
    html: `<div style="
      background: ${color};
      color: white;
      border-radius: 50%;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: ${size < 40 ? '12px' : '14px'};
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${count}</div>`,
    className: 'custom-cluster-icon',
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
      radius: 60,
      maxZoom: 15,
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
    console.log('Supercluster Debug:', {
      zoom: Math.floor(zoom),
      bbox,
      totalPoints: points.length,
      clustersFound: clustersResult.length,
      clusters: clustersResult.map(c => ({
        isCluster: c.properties.cluster,
        pointCount: c.properties.point_count,
        coordinates: c.geometry.coordinates
      }))
    })

    return clustersResult
  }, [supercluster, bounds, zoom, points.length])

  // Update zoom and bounds when map changes
  useEffect(() => {
    const handleMoveEnd = () => {
      setZoom(map.getZoom())
      setBounds(map.getBounds())
    }

    map.on('moveend', handleMoveEnd)
    map.on('zoomend', handleMoveEnd)

    return () => {
      map.off('moveend', handleMoveEnd)
      map.off('zoomend', handleMoveEnd)
    }
  }, [map])

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
                    supercluster.getClusterExpansionZoom(cluster.id!),
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
                  {cluster.properties.count} visit{cluster.properties.count !== 1 ? 's' : ''}
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
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
