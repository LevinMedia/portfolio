'use client'

import { useState, useEffect, useRef } from 'react'
import DetailContentBody from './DetailContentBody'
import { C64LoadingScreen, useC64LoaderVisible } from './C64SpriteLoader'
import { useDrawerHeroTitleVisibility } from '@/app/hooks/useDrawerHeroTitleVisibility'

export interface SelectedWorkPreview {
  title: string
  content: string
  feature_image_url: string
}

interface SelectedWorkDetailProps {
  slug?: string
  /** Render this draft instead of loading the public slug. */
  preview?: SelectedWorkPreview
  onTitleLoad?: (title: string) => void
  onTitleVisibilityChange?: (isVisible: boolean) => void
}

interface SelectedWork {
  id: string
  title: string
  slug: string
  content: string
  feature_image_url: string
  published_at: string
}

export default function SelectedWorkDetail({ slug, preview, onTitleLoad, onTitleVisibilityChange }: SelectedWorkDetailProps) {
  const [work, setWork] = useState<SelectedWork | null>(null)
  const [isLoading, setIsLoading] = useState(!preview)
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (preview) {
      setWork({
        id: 'preview',
        title: preview.title,
        slug: '',
        content: preview.content,
        feature_image_url: preview.feature_image_url,
        published_at: '',
      })
      setError('')
      setIsLoading(false)
      if (onTitleLoad && preview.title) onTitleLoad(preview.title)
      return
    }

    if (!slug) {
      setError('Work not found')
      setIsLoading(false)
      return
    }

    const fetchWork = async () => {
      try {
        const response = await fetch(`/api/selected-works/${slug}`, { credentials: 'same-origin' })
        if (response.ok) {
          const data = await response.json()
          setWork(data.work)
          // Notify parent of the title
          if (onTitleLoad && data.work?.title) {
            onTitleLoad(data.work.title)
          }
        } else {
          setError('Work not found')
        }
      } catch {
        setError('Failed to load work')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWork()
  }, [slug, preview, onTitleLoad])

  const showLoader = useC64LoaderVisible(isLoading)

  // Enable only after hero h1 is mounted (not during loader overlay)
  useDrawerHeroTitleVisibility(titleRef, onTitleVisibilityChange, !!work && !showLoader)

  if (showLoader) {
    return <C64LoadingScreen label="Loading work" />
  }

  if (error || !work) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || 'Work not found'}</p>
      </div>
    )
  }

  const heroImage = work.feature_image_url?.trim()

  return (
    <div className="c64-drawer-copy">
      <div className="chrome-detail-hero -mx-4">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="chrome-detail-hero__image"
            loading="eager"
          />
        ) : null}
        <div className="chrome-detail-hero__scrim" aria-hidden />
        <div className="chrome-detail-hero__caption">
          <h1 ref={titleRef} className="chrome-detail-hero__title">
            {work.title}
          </h1>
        </div>
      </div>

      <DetailContentBody content={work.content} />
    </div>
  )
}
