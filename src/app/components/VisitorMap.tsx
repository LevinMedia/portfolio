'use client'
// stats-followup: no-op comment to trigger CI/push

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

type GeoPoint = {
  country: string
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  count: number
}

interface VisitorMapProps {
  points: GeoPoint[]
  showMockData?: boolean
}

// Mock data for development preview - LOTS of clusterable points!
const mockGeoData: GeoPoint[] = [
  // San Francisco Bay Area - TONS of points (should cluster heavily)
  { country: 'United States', region: 'California', city: 'San Francisco', latitude: 37.7749, longitude: -122.4194, count: 25 },
  { country: 'United States', region: 'California', city: 'Oakland', latitude: 37.8044, longitude: -122.2712, count: 18 },
  { country: 'United States', region: 'California', city: 'San Jose', latitude: 37.3382, longitude: -121.8863, count: 22 },
  { country: 'United States', region: 'California', city: 'Palo Alto', latitude: 37.4419, longitude: -122.1430, count: 15 },
  { country: 'United States', region: 'California', city: 'Berkeley', latitude: 37.8715, longitude: -122.2730, count: 12 },
  { country: 'United States', region: 'California', city: 'Fremont', latitude: 37.5485, longitude: -121.9886, count: 8 },
  { country: 'United States', region: 'California', city: 'Mountain View', latitude: 37.3861, longitude: -122.0839, count: 14 },
  { country: 'United States', region: 'California', city: 'Sunnyvale', latitude: 37.3688, longitude: -122.0363, count: 11 },
  { country: 'United States', region: 'California', city: 'Cupertino', latitude: 37.3230, longitude: -122.0322, count: 9 },
  { country: 'United States', region: 'California', city: 'Santa Clara', latitude: 37.3541, longitude: -121.9552, count: 7 },
  { country: 'United States', region: 'California', city: 'Redwood City', latitude: 37.4852, longitude: -122.2364, count: 6 },
  { country: 'United States', region: 'California', city: 'Menlo Park', latitude: 37.4530, longitude: -122.1817, count: 5 },
  
  // New York Metro Area - TONS of points (should cluster heavily)
  { country: 'United States', region: 'New York', city: 'Manhattan', latitude: 40.7831, longitude: -73.9712, count: 35 },
  { country: 'United States', region: 'New York', city: 'Brooklyn', latitude: 40.6782, longitude: -73.9442, count: 28 },
  { country: 'United States', region: 'New York', city: 'Queens', latitude: 40.7282, longitude: -73.7949, count: 22 },
  { country: 'United States', region: 'New York', city: 'Bronx', latitude: 40.8448, longitude: -73.8648, count: 18 },
  { country: 'United States', region: 'New Jersey', city: 'Newark', latitude: 40.7357, longitude: -74.1724, count: 16 },
  { country: 'United States', region: 'New Jersey', city: 'Jersey City', latitude: 40.7178, longitude: -74.0431, count: 14 },
  { country: 'United States', region: 'New York', city: 'Staten Island', latitude: 40.5795, longitude: -74.1502, count: 10 },
  { country: 'United States', region: 'New Jersey', city: 'Hoboken', latitude: 40.7439, longitude: -74.0324, count: 8 },
  { country: 'United States', region: 'New York', city: 'Long Island City', latitude: 40.7505, longitude: -73.9356, count: 12 },
  
  // London Area - TONS of points (should cluster heavily)
  { country: 'United Kingdom', region: 'England', city: 'Central London', latitude: 51.5074, longitude: -0.1278, count: 42 },
  { country: 'United Kingdom', region: 'England', city: 'Westminster', latitude: 51.4994, longitude: -0.1319, count: 18 },
  { country: 'United Kingdom', region: 'England', city: 'Camden', latitude: 51.5290, longitude: -0.1255, count: 15 },
  { country: 'United Kingdom', region: 'England', city: 'Kensington', latitude: 51.4991, longitude: -0.1938, count: 12 },
  { country: 'United Kingdom', region: 'England', city: 'Shoreditch', latitude: 51.5252, longitude: -0.0709, count: 14 },
  { country: 'United Kingdom', region: 'England', city: 'Canary Wharf', latitude: 51.5054, longitude: -0.0235, count: 16 },
  { country: 'United Kingdom', region: 'England', city: 'Greenwich', latitude: 51.4934, longitude: 0.0098, count: 8 },
  { country: 'United Kingdom', region: 'England', city: 'Hampstead', latitude: 51.5568, longitude: -0.1778, count: 6 },
  
  // Tokyo Area - TONS of points (should cluster heavily)
  { country: 'Japan', region: 'Tokyo', city: 'Shibuya', latitude: 35.6598, longitude: 139.7006, count: 32 },
  { country: 'Japan', region: 'Tokyo', city: 'Shinjuku', latitude: 35.6938, longitude: 139.7034, count: 28 },
  { country: 'Japan', region: 'Tokyo', city: 'Harajuku', latitude: 35.6702, longitude: 139.7016, count: 15 },
  { country: 'Japan', region: 'Tokyo', city: 'Ginza', latitude: 35.6762, longitude: 139.7653, count: 22 },
  { country: 'Japan', region: 'Tokyo', city: 'Akihabara', latitude: 35.7022, longitude: 139.7744, count: 18 },
  { country: 'Japan', region: 'Tokyo', city: 'Roppongi', latitude: 35.6627, longitude: 139.7314, count: 14 },
  { country: 'Japan', region: 'Tokyo', city: 'Asakusa', latitude: 35.7148, longitude: 139.7967, count: 10 },
  
  // Berlin Area - Multiple points (should cluster)
  { country: 'Germany', region: 'Berlin', city: 'Mitte', latitude: 52.5200, longitude: 13.4050, count: 24 },
  { country: 'Germany', region: 'Berlin', city: 'Kreuzberg', latitude: 52.4987, longitude: 13.4180, count: 16 },
  { country: 'Germany', region: 'Berlin', city: 'Prenzlauer Berg', latitude: 52.5390, longitude: 13.4134, count: 12 },
  { country: 'Germany', region: 'Berlin', city: 'Charlottenburg', latitude: 52.5170, longitude: 13.2846, count: 8 },
  
  // Paris Area - Multiple points (should cluster)
  { country: 'France', region: 'Île-de-France', city: 'Paris 1st', latitude: 48.8566, longitude: 2.3522, count: 28 },
  { country: 'France', region: 'Île-de-France', city: 'Montmartre', latitude: 48.8867, longitude: 2.3431, count: 16 },
  { country: 'France', region: 'Île-de-France', city: 'Le Marais', latitude: 48.8566, longitude: 2.3629, count: 14 },
  { country: 'France', region: 'Île-de-France', city: 'Latin Quarter', latitude: 48.8499, longitude: 2.3447, count: 12 },
  
  // Other major cities - individual points
  { country: 'Australia', region: 'New South Wales', city: 'Sydney', latitude: -33.8688, longitude: 151.2093, count: 18 },
  { country: 'Canada', region: 'Ontario', city: 'Toronto', latitude: 43.6532, longitude: -79.3832, count: 22 },
  { country: 'Brazil', region: 'São Paulo', city: 'São Paulo', latitude: -23.5505, longitude: -46.6333, count: 16 },
  { country: 'India', region: 'Maharashtra', city: 'Mumbai', latitude: 19.0760, longitude: 72.8777, count: 20 },
  { country: 'China', region: 'Shanghai', city: 'Shanghai', latitude: 31.2304, longitude: 121.4737, count: 24 },
  { country: 'South Korea', region: 'Seoul', city: 'Seoul', latitude: 37.5665, longitude: 126.9780, count: 19 },
  { country: 'Singapore', region: 'Singapore', city: 'Singapore', latitude: 1.3521, longitude: 103.8198, count: 15 }
]

export default function VisitorMap({ points, showMockData = false }: VisitorMapProps) {
  const [displayPoints, setDisplayPoints] = useState<GeoPoint[]>([])

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && showMockData && points.length === 0) {
      setDisplayPoints(mockGeoData)
    } else {
      // Normalize optional fields to match LeafletMap required types
      const normalized = points.map(p => ({
        country: p.country,
        region: p.region ?? null,
        city: p.city ?? null,
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
        count: p.count
      }))
      setDisplayPoints(normalized)
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
