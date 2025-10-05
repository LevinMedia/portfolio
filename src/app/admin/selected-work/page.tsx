'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import MilkdownEditor from '@/app/components/MilkdownEditor'
import ThumbnailCropper from '@/app/components/ThumbnailCropper'
import ImageUploader from '@/app/components/ImageUploader'
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
  display_order: number
  created_at: string
  updated_at: string
  published_at: string | null
}

export default function SelectedWorkAdmin() {
  const [works, setWorks] = useState<SelectedWork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [editingWork, setEditingWork] = useState<SelectedWork | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    feature_image_url: '',
    thumbnail_crop: { x: 0, y: 0, width: 100, height: 100, unit: '%' },
    is_published: false,
    display_order: 0
  })

  useEffect(() => {
    fetchWorks()
  }, [])

  const fetchWorks = async () => {
    try {
      const response = await fetch('/api/admin/selected-works')
      if (response.ok) {
        const data = await response.json()
        setWorks(data.works || [])
      }
    } catch (error) {
      console.error('Error fetching works:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingWork(null)
    setFormData({
      title: '',
      slug: '',
      content: '',
      feature_image_url: '',
      thumbnail_crop: { x: 0, y: 0, width: 100, height: 100, unit: '%' },
      is_published: false,
      display_order: 0
    })
    setIsModalOpen(true)
  }

  const handleEdit = (work: SelectedWork) => {
    setEditingWork(work)
    setFormData({
      title: work.title,
      slug: work.slug,
      content: work.content,
      feature_image_url: work.feature_image_url,
      thumbnail_crop: work.thumbnail_crop,
      is_published: work.is_published,
      display_order: work.display_order
    })
    setIsModalOpen(true)
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
          id: editingWork?.id,
          ...formData
        })
      })

      if (response.ok) {
        setIsModalOpen(false)
        fetchWorks()
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

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, feature_image_url: url }))
  }

  const handleCropChange = (crop: { x: number; y: number; width: number; height: number; unit: string }) => {
    setFormData(prev => ({ ...prev, thumbnail_crop: crop }))
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">
          Selected Work Management
        </h1>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Work
        </button>
      </div>

      {/* Works List */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {works.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No works yet. Create your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {works.map((work) => (
              <div key={work.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
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
                      </div>
                      <p className="text-sm text-muted-foreground">/{work.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(work)}
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

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background border border-border rounded-lg max-w-4xl w-full my-8">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">
                {editingWork ? 'Edit Work' : 'Create New Work'}
              </h2>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title *
                </label>
                <Input
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
                  placeholder="Work title"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  URL Slug *
                </label>
                <Input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be accessible at: /selected-works/{formData.slug}
                </p>
              </div>

              {/* Feature Image */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Feature Image (16:9) *
                </label>
                <ImageUploader
                  onImageUpload={handleImageUpload}
                  currentImage={formData.feature_image_url}
                  folder="selected-works"
                  aspectRatio={16 / 9}
                />
              </div>

              {/* Thumbnail Crop */}
              {formData.feature_image_url && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Thumbnail Crop (1:1)
                  </label>
                  <ThumbnailCropper
                    imageUrl={formData.feature_image_url}
                    initialCrop={formData.thumbnail_crop}
                    onCropChange={handleCropChange}
                  />
                </div>
              )}

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Content *
                </label>
                <MilkdownEditor
                  value={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                  className="min-h-[300px]"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Display Order
                </label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher numbers appear first
                </p>
              </div>

              {/* Published */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="is_published" className="ml-2 block text-sm text-foreground">
                  Publish this work
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Work'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}