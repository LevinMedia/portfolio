'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

const FieldNotesContent: React.FC = () => {
  const router = useRouter()
  const [notes, setNotes] = useState<FieldNote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch('/api/field-notes')
        if (response.ok) {
          const data = await response.json()
          // Sort by published_at descending (reverse chronological)
          const sortedNotes = (data.notes || []).sort((a: FieldNote, b: FieldNote) => {
            const dateA = new Date(a.published_at || 0).getTime()
            const dateB = new Date(b.published_at || 0).getTime()
            return dateB - dateA
          })
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-muted-foreground">No published notes yet.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Grid of field notes - each item spans 2 grid columns, gaps between columns */}
      <div className="grid grid-cols-4 sm:grid-cols-6" style={{ gap: 'var(--grid-major)' }}>
        {notes.map((note) => (
          <div
            key={note.id}
            className="relative border border-blue-200/15 rounded-none col-span-2"
            style={{ padding: 'var(--grid-major)' }}
          >
            <div
              className="relative aspect-square overflow-hidden cursor-pointer group"
              onClick={() => router.push(`/field-notes/${note.slug}`)}
            >
              <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `url(${note.feature_image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: `${note.thumbnail_crop.x}% ${note.thumbnail_crop.y}%`,
                  transform: `scale(${100 / note.thumbnail_crop.width})`,
                  transformOrigin: `${note.thumbnail_crop.x}% ${note.thumbnail_crop.y}%`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <h3 className="text-white text-sm font-medium font-[family-name:var(--font-geist-mono)] text-center px-2 bg-black/50 rounded-sm">
                  {note.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FieldNotesContent

