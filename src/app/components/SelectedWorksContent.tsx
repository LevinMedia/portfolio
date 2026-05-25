'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { SelectedWorkServer } from '@/lib/selected-works-server'
import { C64LoadingScreen, useC64LoaderVisible } from './C64SpriteLoader'
import { createDrawerListCache } from '@/lib/drawer-list-cache'
import C64GridTile from './C64GridTile'

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

interface SelectedWorksContentProps {
  /** When provided (e.g. from server), no client fetch — list was resolved server-side */
  initialWorks?: SelectedWorkServer[] | null
}

const selectedWorksCache = createDrawerListCache<SelectedWork[]>()

function sortSelectedWorks(works: SelectedWork[]): SelectedWork[] {
  return [...works].sort((a, b) => b.display_order - a.display_order)
}

const SelectedWorksContent: React.FC<SelectedWorksContentProps> = ({ initialWorks = null }) => {
  const router = useRouter()
  const fromServer = initialWorks !== null
  const fromCache = selectedWorksCache.has()
  const [works, setWorks] = useState<SelectedWork[]>(
    () => initialWorks ?? selectedWorksCache.get() ?? [],
  )
  const [isLoading, setIsLoading] = useState(!fromServer && !fromCache)

  useEffect(() => {
    if (initialWorks !== null) {
      const ordered = sortSelectedWorks(initialWorks as SelectedWork[])
      selectedWorksCache.set(ordered)
      setWorks(ordered)
      setIsLoading(false)
      return
    }

    if (selectedWorksCache.has()) {
      setWorks(selectedWorksCache.get() ?? [])
      setIsLoading(false)
      return
    }

    const fetchWorks = async () => {
      try {
        const response = await fetch('/api/selected-works', { credentials: 'same-origin' })
        if (response.ok) {
          const data = await response.json()
          const orderedWorks = sortSelectedWorks(data.works || [])
          selectedWorksCache.set(orderedWorks)
          setWorks(orderedWorks)
        }
      } catch (error) {
        console.error('Error fetching selected works:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchWorks()
  }, [initialWorks])

  const showLoader = useC64LoaderVisible(isLoading)
  if (showLoader) {
    return <C64LoadingScreen label="Loading featured work" />
  }

  if (works.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-muted-foreground">No published works yet.</p>
      </div>
    )
  }

  return (
    <div className="c64-media">
      <div
        className="c64-media-grid grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-8"
        style={{ padding: 'var(--grid-major)' }}
      >
        {works.map((work) => (
          <C64GridTile
            key={work.id}
            title={work.title}
            onClick={() => router.push(`/selected-works/${work.slug}`)}
            imageStyle={{
              backgroundImage: `url(${work.feature_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: `${work.thumbnail_crop.x}% ${work.thumbnail_crop.y}%`,
              transform: `scale(${100 / work.thumbnail_crop.width})`,
              transformOrigin: `${work.thumbnail_crop.x}% ${work.thumbnail_crop.y}%`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default SelectedWorksContent
