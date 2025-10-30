'use client'

import { useState, useEffect, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, Bars3Icon, LinkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { usePageTitle } from '@/app/hooks/usePageTitle'

interface SelectedWork {
  id: string
  title: string
  slug: string
  content: string
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
}

export default function SelectedWorkAdmin() {
  usePageTitle('Admin / Selected Works')
  const router = useRouter()
  const [works, setWorks] = useState<SelectedWork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchWorks()
  }, [])

  const fetchWorks = async () => {
    try {
      const response = await fetch('/api/admin/selected-works')
      if (response.ok) {
        const data = await response.json()
        const orderedWorks = (data.works || []).sort((a: SelectedWork, b: SelectedWork) => b.display_order - a.display_order)
        setWorks(orderedWorks)
      }
    } catch (error) {
      console.error('Error fetching works:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveDisplayOrder = async (orderedWorks: SelectedWork[]) => {
    if (!orderedWorks.length) return

    setIsSavingOrder(true)
    try {
      const payload = orderedWorks.map((work, index) => ({
        id: work.id,
        display_order: orderedWorks.length - index
      }))

      const response = await fetch('/api/admin/selected-works', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ works: payload })
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
      fetchWorks()
    } finally {
      setIsSavingOrder(false)
    }
  }

  const handleCreate = () => {
    router.push('/admin/selected-work/new')
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/selected-work/${id}`)
  }

  const handleCopyLink = async (id: string, slug: string) => {
    const url = `/selected-works/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Failed to copy link to clipboard')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work?')) return

    try {
      const response = await fetch(`/api/admin/selected-works?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchWorks()
      } else {
        alert('Failed to delete work')
      }
    } catch (error) {
      console.error('Error deleting work:', error)
      alert('Failed to delete work')
    }
  }

  const handleDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', works[index]?.id ?? '')
    setDraggedIndex(index)
    setDragOverIndex(index)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault()
    if (draggedIndex === null || draggedIndex === index || dragOverIndex === index) return

    setWorks(prevWorks => {
      const updated = [...prevWorks]
      const [movedItem] = updated.splice(draggedIndex, 1)
      updated.splice(index, 0, movedItem)

      return updated.map((work, idx) => ({
        ...work,
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

    setWorks(prevWorks => {
      const updated = prevWorks.map((work, idx) => ({
        ...work,
        display_order: prevWorks.length - idx
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
          Selected Work Management
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
            Add New Work
          </button>
        </div>
      </div>

      {/* Works List */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {works.length > 0 && (
          <div className="px-4 py-3 border-b border-border text-sm text-muted-foreground">
            Drag items to reorder. Changes are saved automatically.
          </div>
        )}
        {works.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No works yet. Create your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {works.map((work, index) => (
              <div
                key={work.id}
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
                      {work.feature_image_url && (
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${work.feature_image_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: `${work.thumbnail_crop.x}% ${work.thumbnail_crop.y}%`,
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-foreground">{work.title}</h3>
                        {work.is_published ? (
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
                        {work.is_private && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            🔒 Private
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">/{work.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyLink(work.id, work.slug)}
                      className={`p-2 rounded transition-colors ${
                        copiedId === work.id
                          ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title={copiedId === work.id ? 'Copied!' : 'Copy link to clipboard'}
                    >
                      {copiedId === work.id ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : (
                        <LinkIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(work.id)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(work.id)}
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