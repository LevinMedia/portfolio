'use client'

import { useState, useEffect, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, Bars3Icon, LinkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { usePageTitle } from '@/app/hooks/usePageTitle'

interface FieldNote {
  id: string
  title: string
  slug: string
  content: string
  author: string
  feature_image_url: string
  thumbnail_crop: {
    x: number
    y: number
    width: number
    height: number
    unit: string
  }
  is_published: boolean
  is_private: boolean
  display_order: number
  created_at: string
  updated_at: string
  published_at: string | null
  og_vertical_align?: 'top' | 'center' | 'bottom'
}

export default function FieldNotesAdmin() {
  usePageTitle('Admin / Field Notes')
  const router = useRouter()
  const [notes, setNotes] = useState<FieldNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/admin/field-notes')
      if (response.ok) {
        const data = await response.json()
        // Sort by published_at descending (reverse chronological)
        const sortedNotes = (data.notes || []).sort((a: FieldNote, b: FieldNote) => {
          const dateA = new Date(a.published_at || a.created_at || 0).getTime()
          const dateB = new Date(b.published_at || b.created_at || 0).getTime()
          return dateB - dateA
        })
        setNotes(sortedNotes)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveDisplayOrder = async (orderedNotes: FieldNote[]) => {
    if (!orderedNotes.length) return

    setIsSavingOrder(true)
    try {
      const payload = orderedNotes.map((note, index) => ({
        id: note.id,
        display_order: orderedNotes.length - index
      }))

      const response = await fetch('/api/admin/field-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: payload })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const message = typeof errorData?.error === 'string' && errorData.error.trim().length > 0
          ? errorData.error
          : 'Failed to save new order. Please try again.'

        throw new Error(message)
      }
    } catch (error) {
      console.error('Error saving display order:', error)
      const message = error instanceof Error ? error.message : 'Failed to save new order. Please try again.'
      alert(message)
      fetchNotes()
    } finally {
      setIsSavingOrder(false)
    }
  }

  const handleCreate = () => {
    router.push('/admin/field-notes/new')
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/field-notes/${id}`)
  }

  const handleCopyLink = async (id: string, slug: string) => {
    const fullUrl = `${window.location.origin}/field-notes/${slug}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Failed to copy link to clipboard')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/admin/field-notes?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchNotes()
      } else {
        alert('Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  const handleDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', notes[index]?.id ?? '')
    setDraggedIndex(index)
    setDragOverIndex(index)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault()
    if (draggedIndex === null || draggedIndex === index || dragOverIndex === index) return

    setNotes(prevNotes => {
      const updated = [...prevNotes]
      const [movedItem] = updated.splice(draggedIndex, 1)
      updated.splice(index, 0, movedItem)

      return updated.map((note, idx) => ({
        ...note,
        display_order: updated.length - idx
      }))
    })

    setDraggedIndex(index)
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex === null) return

    setDraggedIndex(null)
    setDragOverIndex(null)

    setNotes(prevNotes => {
      const updated = prevNotes.map((note, idx) => ({
        ...note,
        display_order: prevNotes.length - idx
      }))

      void saveDisplayOrder(updated)
      return updated
    })
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">
          Field Notes Management
        </h1>
        <div className="flex items-center gap-4">
          {isSavingOrder && (
            <span className="text-sm text-muted-foreground">Saving order…</span>
          )}
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Note
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {notes.length > 0 && (
          <div className="px-4 py-3 border-b border-border text-sm text-muted-foreground">
            Drag items to reorder. Changes are saved automatically.
          </div>
        )}
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No notes yet. Create your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notes.map((note, index) => (
              <div
                key={note.id}
                className={`p-4 transition-colors ${dragOverIndex === index ? 'bg-muted/70' : 'hover:bg-muted/50'} ${draggedIndex === index ? 'opacity-75' : ''}`}
                onDragOver={(event) => handleDragOver(event, index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div
                      className="cursor-grab text-muted-foreground"
                      data-drag-handle
                      draggable
                      onDragStart={(event) => handleDragStart(event, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <Bars3Icon className="h-5 w-5" />
                    </div>
                    <div className="w-16 h-16 relative rounded overflow-hidden bg-muted">
                      {note.feature_image_url && (
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${note.feature_image_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: `${note.thumbnail_crop.x}% ${note.thumbnail_crop.y}%`,
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-foreground">{note.title}</h3>
                        {note.is_published ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <EyeIcon className="w-3 h-3 mr-1" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            <EyeSlashIcon className="w-3 h-3 mr-1" />
                            Draft
                          </span>
                        )}
                        {note.is_private && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            🔒 Private
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">/{note.slug} • {note.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyLink(note.id, note.slug)}
                      className={`p-2 rounded transition-colors ${
                        copiedId === note.id
                          ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title={copiedId === note.id ? 'Copied!' : 'Copy link to clipboard'}
                    >
                      {copiedId === note.id ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : (
                        <LinkIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(note.id)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

