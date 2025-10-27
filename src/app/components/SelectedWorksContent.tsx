'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SelectedWork {
  id: string
  title: string
  slug: string
  feature_image_url: string
  thumbnail_crop: {
    x: number
    y: number
    width: number
    height: number
    unit: string
  }
  display_order: number
}

const SelectedWorksContent: React.FC = () => {
  const router = useRouter()
  const [works, setWorks] = useState<SelectedWork[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const response = await fetch('/api/selected-works')
        if (response.ok) {
          const data = await response.json()
          const orderedWorks = (data.works || []).sort((a: SelectedWork, b: SelectedWork) => b.display_order - a.display_order)
          setWorks(orderedWorks)
        }
      } catch (error) {
        console.error('Error fetching selected works:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorks()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (works.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-muted-foreground">No published works yet.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Grid of work samples - each item spans 2 grid columns, gaps between columns */}
      <div className="grid grid-cols-4 sm:grid-cols-6" style={{ gap: 'var(--grid-major)' }}>
        {works.map((work) => (
          <div
            key={work.id}
            className="relative border border-blue-200/15 rounded-none col-span-2"
            style={{ padding: 'var(--grid-major)' }}
          >
            <div
              className="relative aspect-square overflow-hidden cursor-pointer group"
              onClick={() => router.push(`/selected-works/${work.slug}`)}
            >
              <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `url(${work.feature_image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: `${work.thumbnail_crop.x}% ${work.thumbnail_crop.y}%`,
                  transform: `scale(${100 / work.thumbnail_crop.width})`,
                  transformOrigin: `${work.thumbnail_crop.x}% ${work.thumbnail_crop.y}%`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <h3 className="text-white text-sm font-medium font-[family-name:var(--font-geist-mono)] text-center px-2 bg-black/50 rounded-sm">
                  {work.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SelectedWorksContent
