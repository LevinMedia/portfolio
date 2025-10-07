'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

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
  const router = useRouter()
  const [works, setWorks] = useState<SelectedWork[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    router.push('/admin/selected-work/new')
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/selected-work/${id}`)
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