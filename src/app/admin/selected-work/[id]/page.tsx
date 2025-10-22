'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { ChevronLeftIcon, PhotoIcon, PencilIcon } from '@heroicons/react/24/outline'
import MilkdownEditor from '@/app/components/MilkdownEditor'
import Input from '@/app/components/ui/Input'

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
}

export default function EditSelectedWork({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const isNew = id === 'new'
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    feature_image_url: '',
    thumbnail_crop: { x: 50, y: 50, width: 100, height: 100, unit: '%' }, // Center crop
    is_published: false,
    is_private: false,
    display_order: 0
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [titleContainer, setTitleContainer] = useState<HTMLElement | null>(null)
  const [actionsContainer, setActionsContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setTitleContainer(document.getElementById('admin-page-title'))
    setActionsContainer(document.getElementById('admin-top-bar-actions'))
  }, [])

  useEffect(() => {
    if (!isNew) {
      fetchWork()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, id])

  const fetchWork = async () => {
    try {
      const response = await fetch('/api/admin/selected-works')
      if (response.ok) {
        const data = await response.json()
        const work = data.works.find((w: SelectedWork) => w.id === id)
        if (work) {
          setFormData({
            title: work.title,
            slug: work.slug,
            content: work.content,
            feature_image_url: work.feature_image_url,
            thumbnail_crop: work.thumbnail_crop,
            is_published: work.is_published,
            is_private: work.is_private,
            display_order: work.display_order
          })
        }
      }
    } catch (error) {
      console.error('Error fetching work:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.content || !formData.feature_image_url) {
      alert('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/selected-works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: isNew ? null : id,
          ...formData
        })
      })

      if (response.ok) {
        router.push('/admin/selected-work')
      } else {
        alert('Failed to save work')
      }
    } catch (error) {
      console.error('Error saving work:', error)
      alert('Failed to save work')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'selected-works')

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setFormData(prev => ({ ...prev, feature_image_url: result.url }))
      } else {
        alert('Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      {/* Inject breadcrumb into top bar */}
      {titleContainer && createPortal(
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push('/admin/selected-work')}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            <span className="text-muted-foreground">Selected works</span>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>{formData.title || (isNew ? 'New Work' : 'Edit Work')}</span>
          </h2>
        </div>,
        titleContainer
      )}

      {/* Inject action buttons into top bar */}
      {actionsContainer && createPortal(
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/admin/selected-work')}
            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Work'}
          </button>
        </div>,
        actionsContainer
      )}

      {/* WYSIWYG Editor */}
      <div className="space-y-8">
        {/* Feature Image with Title Overlay (Like Frontend) - Full Width Edge to Edge */}
        <div className="relative w-screen overflow-hidden group cursor-pointer bg-muted -mx-4 sm:-mx-6 md:-mx-8" style={{ marginLeft: 'calc(-1 * (100vw - 100%) / 2)', marginRight: 'calc(-1 * (100vw - 100%) / 2)', width: '100vw', height: '50vh', maxHeight: '50vh' }}>
          {formData.feature_image_url ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${formData.feature_image_url})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <PhotoIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Click to upload feature image</p>
              </div>
            </div>
          )}
          
          {/* Click to upload overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 cursor-pointer z-10"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center text-white">
              <PhotoIcon className="mx-auto h-12 w-12 mb-2" />
              <p className="font-medium">{formData.feature_image_url ? 'Change Image' : 'Upload Image'}</p>
              {isUploading && (
                <div className="mt-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                </div>
              )}
            </div>
          </div>

          {/* Title Overlay (Editable) - Higher z-index to be above upload overlay */}
          <div 
            className="absolute bottom-0 left-0 right-0 z-20"
            style={{ padding: '2rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value
                  setFormData(prev => ({
                    ...prev,
                    title,
                    slug: prev.slug || generateSlug(title)
                  }))
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter work title..."
                className="flex-1 text-4xl font-bold text-white font-[family-name:var(--font-geist-mono)] bg-transparent border-none outline-none focus:ring-2 focus:ring-white/50 rounded px-2 py-1"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
              />
              <PencilIcon className="h-6 w-6 text-white/70 flex-shrink-0" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Settings Bar */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-xs text-muted-foreground">URL Slug</label>
                <Input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Display Order</label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="mt-1 text-sm w-20"
                />
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="is_published" className="ml-2 block text-sm text-foreground font-medium">
                  Published
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_private"
                  checked={formData.is_private}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-border rounded"
                />
                <label htmlFor="is_private" className="ml-2 block text-sm text-foreground font-medium">
                  🔒 Private
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-background border border-border rounded-lg p-6">
            <MilkdownEditor
              value={formData.content}
              onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              className="min-h-[500px]"
            />
          </div>
        </div>
      </div>
    </>
  )
}
