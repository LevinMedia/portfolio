'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { C64LoadingScreen, useC64LoaderVisible } from './C64SpriteLoader'
import { createDrawerListCache } from '@/lib/drawer-list-cache'
import C64GridTile from './C64GridTile'

interface FieldNote {
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
  published_at: string
  author: string
}

const fieldNotesCache = createDrawerListCache<FieldNote[]>()

function sortFieldNotes(notes: FieldNote[]): FieldNote[] {
  return [...notes].sort((a, b) => {
    const dateA = new Date(a.published_at || 0).getTime()
    const dateB = new Date(b.published_at || 0).getTime()
    return dateB - dateA
  })
}

const FieldNotesContent: React.FC = () => {
  const router = useRouter()
  const cached = fieldNotesCache.get()
  const [notes, setNotes] = useState<FieldNote[]>(cached ?? [])
  const [isLoading, setIsLoading] = useState(!fieldNotesCache.has())

  useEffect(() => {
    if (fieldNotesCache.has()) {
      setNotes(fieldNotesCache.get() ?? [])
      setIsLoading(false)
      return
    }

    const fetchNotes = async () => {
      try {
        const response = await fetch('/api/field-notes')
        if (response.ok) {
          const data = await response.json()
          const sortedNotes = sortFieldNotes(data.notes || [])
          fieldNotesCache.set(sortedNotes)
          setNotes(sortedNotes)
        }
      } catch (error) {
        console.error('Error fetching field notes:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotes()
  }, [])

  const showLoader = useC64LoaderVisible(isLoading)
  if (showLoader) {
    return <C64LoadingScreen label="Loading field notes" />
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-muted-foreground">No published notes yet.</p>
      </div>
    )
  }

  return (
    <div className="c64-media">
      <div
        className="c64-media-grid grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-8"
        style={{ padding: 'var(--grid-major)' }}
      >
        {notes.map((note) => (
          <C64GridTile
            key={note.id}
            title={note.title}
            onClick={() => router.push(`/field-notes/${note.slug}`)}
            imageStyle={{
              backgroundImage: `url(${note.feature_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: `${note.thumbnail_crop.x}% ${note.thumbnail_crop.y}%`,
              transform: `scale(${100 / note.thumbnail_crop.width})`,
              transformOrigin: `${note.thumbnail_crop.x}% ${note.thumbnail_crop.y}%`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default FieldNotesContent

