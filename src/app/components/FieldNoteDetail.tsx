'use client'

import { useState, useEffect, useRef } from 'react'
import DetailContentBody from './DetailContentBody'
import { C64LoadingScreen, useC64LoaderVisible } from './C64SpriteLoader'
import { useDrawerHeroTitleVisibility } from '@/app/hooks/useDrawerHeroTitleVisibility'

export interface FieldNotePreview {
  title: string
  content: string
  feature_image_url: string
  author: string
}

interface FieldNoteDetailProps {
  slug?: string
  /** Render this draft instead of loading the public slug. */
  preview?: FieldNotePreview
  onTitleLoad?: (title: string) => void
  onTitleVisibilityChange?: (isVisible: boolean) => void
}

interface FieldNote {
  id: string
  title: string
  slug: string
  content: string
  feature_image_url: string
  published_at: string
  author: string
  og_vertical_align?: 'top' | 'center' | 'bottom'
}

export default function FieldNoteDetail({ slug, preview, onTitleLoad, onTitleVisibilityChange }: FieldNoteDetailProps) {
  const [note, setNote] = useState<FieldNote | null>(null)
  const [isLoading, setIsLoading] = useState(!preview)
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (preview) {
      setNote({
        id: 'preview',
        title: preview.title,
        slug: '',
        content: preview.content,
        feature_image_url: preview.feature_image_url,
        published_at: '',
        author: preview.author,
      })
      setError('')
      setIsLoading(false)
      if (onTitleLoad && preview.title) onTitleLoad(preview.title)
      return
    }

    if (!slug) {
      setError('Note not found')
      setIsLoading(false)
      return
    }

    const fetchNote = async () => {
      try {
        const response = await fetch(`/api/field-notes/${slug}`)
        if (response.ok) {
          const data = await response.json()
          setNote(data.note)
          // Notify parent of the title
          if (onTitleLoad && data.note?.title) {
            onTitleLoad(data.note.title)
          }
        } else {
          setError('Note not found')
        }
      } catch {
        setError('Failed to load note')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNote()
  }, [slug, preview, onTitleLoad])

  const showLoader = useC64LoaderVisible(isLoading)

  // Enable only after hero h1 is mounted (not during loader overlay)
  useDrawerHeroTitleVisibility(titleRef, onTitleVisibilityChange, !!note && !showLoader)

  if (showLoader) {
    return <C64LoadingScreen label="Loading note" />
  }

  if (error || !note) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || 'Note not found'}</p>
      </div>
    )
  }

  const heroImage = note.feature_image_url?.trim()

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
            {note.title}
          </h1>
          <p className="chrome-detail-hero__meta">{note.author}</p>
        </div>
      </div>

      <DetailContentBody content={note.content} imageClassName="rounded-lg" />
    </div>
  )
}

