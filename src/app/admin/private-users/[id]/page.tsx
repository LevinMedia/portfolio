'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { ChevronLeftIcon, PhotoIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import MilkdownEditor from '@/app/components/MilkdownEditor'
import Button from '@/app/components/Button'
import { PRIVATE_INDEX_DEFAULT_TITLE } from '@/lib/private-index'

/** Edit the optional bespoke Index page for one password-access entry. */
export default function EditPasswordAccessIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [label, setLabel] = useState('')
  const [formData, setFormData] = useState({
    enabled: false,
    title: '',
    content: '',
    logo_url: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [titleContainer, setTitleContainer] = useState<HTMLElement | null>(null)
  const [actionsContainer, setActionsContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setTitleContainer(document.getElementById('admin-page-title'))
    setActionsContainer(document.getElementById('admin-top-bar-actions'))
  }, [])

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const response = await fetch(`/api/admin/private-users?id=${encodeURIComponent(id)}`, {
          credentials: 'same-origin',
        })
        const data = await response.json().catch(() => ({}))
        if (response.ok) {
          setLabel(data.label ?? '')
          setFormData({
            enabled: data.index_enabled === true,
            title: data.index_title ?? '',
            content: data.index_content ?? '',
            logo_url: data.index_logo_url ?? '',
          })
        } else {
          setError(data.error || 'Failed to load entry')
        }
      } catch {
        setError('Failed to load entry')
      } finally {
        setIsLoading(false)
      }
    }
    fetchEntry()
  }, [id])

  const handleSave = async () => {
    if (formData.enabled && !formData.content.trim()) {
      alert('Add some content before turning the Index on')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/private-users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, index: formData }),
      })

      if (response.ok) {
        router.push('/admin/private-users')
      } else {
        const data = await response.json().catch(() => ({}))
        alert(data.error || 'Failed to save Index')
      }
    } catch (err) {
      console.error('Error saving index:', err)
      alert('Failed to save Index')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setIsUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('folder', 'access-index-logos')

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: uploadData,
      })

      if (response.ok) {
        const result = await response.json()
        setFormData(prev => ({ ...prev, logo_url: result.url }))
      } else {
        alert('Failed to upload logo')
      }
    } catch (err) {
      console.error('Error uploading logo:', err)
      alert('Failed to upload logo')
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button style="outline" color="primary" size="small" onClick={() => router.push('/admin/private-users')}>
          Back to Password Access
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Inject breadcrumb into top bar */}
      {titleContainer && createPortal(
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push('/admin/private-users')}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            <span className="text-muted-foreground">Password Access</span>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>{label ? `${label} Index` : 'Index'}</span>
          </h2>
        </div>,
        titleContainer
      )}

      {/* Inject action buttons into top bar */}
      {actionsContainer && createPortal(
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/admin/private-users')}
            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Index'}
          </button>
        </div>,
        actionsContainer
      )}

      <div className="space-y-8">
        {/* Title (the page template's hero, without a feature image) */}
        <div className="max-w-4xl mx-auto pt-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={PRIVATE_INDEX_DEFAULT_TITLE}
              aria-label="Index title"
              className="flex-1 min-w-0 text-4xl font-bold text-foreground font-[family-name:var(--font-geist-mono)] bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1"
            />
            <PencilIcon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
          </div>
        </div>

        {/* Settings Bar */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-6 flex-wrap p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 min-w-10 items-center justify-center rounded border border-border bg-background px-2">
                {formData.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.logo_url} alt="" className="h-5 w-auto max-w-20 object-contain" />
                ) : (
                  <PhotoIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Button logo (sits left of “Index”)</p>
                <div className="mt-1 flex items-center gap-2">
                  <Button
                    style="outline"
                    color="primary"
                    size="xsmall"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? 'Uploading…' : formData.logo_url ? 'Change logo' : 'Upload logo'}
                  </Button>
                  {formData.logo_url ? (
                    <Button
                      style="ghost"
                      color="destructive"
                      size="xsmall"
                      onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                      iconLeft={<TrashIcon className="h-3.5 w-3.5" />}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="index_enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label htmlFor="index_enabled" className="ml-2 block text-sm text-foreground font-medium">
                Index enabled
              </label>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            When enabled, signing in with this password opens this page and adds an “Index” button to
            the bottom right of every page. Links to this site open over the Index. When disabled,
            this password works exactly as it does without one.
          </p>
        </div>

        {/* Content Editor */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-background border border-border rounded-lg p-6">
            <MilkdownEditor
              value={formData.content}
              onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              className="min-h-[500px]"
              uploadFolder="access-index"
            />
          </div>
        </div>
      </div>
    </>
  )
}
