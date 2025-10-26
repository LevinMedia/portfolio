'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the entire map component to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-80 bg-muted/20 border border-border/20 rounded-none flex items-center justify-center">
      <div className="text-muted-foreground">Loading map...</div>
    </div>
  )
})

interface GeoPoint {
  country: string
  region?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  count: number
}

interface VisitorMapProps {
  points: GeoPoint[]
  showMockData?: boolean
}

// Mock data for development preview - includes some clusterable points
const mockGeoData: GeoPoint[] = [
  // California Bay Area - clusterable points
  { country: 'United States', region: 'California', city: 'San Francisco', latitude: 37.7749, longitude: -122.4194, count: 15 },
  { country: 'United States', region: 'California', city: 'Oakland', latitude: 37.8044, longitude: -122.2712, count: 8 },
  { country: 'United States', region: 'California', city: 'San Jose', latitude: 37.3382, longitude: -121.8863, count: 12 },
  { country: 'United States', region: 'California', city: 'Palo Alto', latitude: 37.4419, longitude: -122.1430, count: 5 },
  
  // New York Area - clusterable points  
  { country: 'United States', region: 'New York', city: 'New York', latitude: 40.7128, longitude: -74.0060, count: 20 },
  { country: 'United States', region: 'New Jersey', city: 'Newark', latitude: 40.7357, longitude: -74.1724, count: 6 },
  
  // Europe - spread out
  { country: 'United Kingdom', region: 'England', city: 'London', latitude: 51.5074, longitude: -0.1278, count: 8 },
  { country: 'Germany', region: 'Berlin', city: 'Berlin', latitude: 52.5200, longitude: 13.4050, count: 5 },
  { country: 'France', region: 'Île-de-France', city: 'Paris', latitude: 48.8566, longitude: 2.3522, count: 7 },
  
  // Other continents
  { country: 'Japan', region: 'Tokyo', city: 'Tokyo', latitude: 35.6762, longitude: 139.6503, count: 12 },
  { country: 'Australia', region: 'New South Wales', city: 'Sydney', latitude: -33.8688, longitude: 151.2093, count: 6 },
  { country: 'Canada', region: 'Ontario', city: 'Toronto', latitude: 43.6532, longitude: -79.3832, count: 9 }
]

export default function VisitorMap({ points, showMockData = false }: VisitorMapProps) {
  const [displayPoints, setDisplayPoints] = useState<GeoPoint[]>([])

  useEffect(() => {
    if (showMockData && points.length === 0) {
      setDisplayPoints(mockGeoData)
    } else {
      setDisplayPoints(points)
    }
  }, [points, showMockData])

  // Debug logging
  console.log('VisitorMap render:', { 
    pointsLength: points.length, 
    showMockData, 
    displayPointsLength: displayPoints.length
  })

  return <LeafletMap points={displayPoints} />
}
