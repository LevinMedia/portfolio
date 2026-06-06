'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Bars3Icon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { GalleryImage } from '@/lib/gallery-markdown'

interface GalleryUploadModalProps {
  open: boolean
  folder: string
  mode?: 'create' | 'edit'
  initialGalleryCaption?: string
  initialImages?: GalleryImage[]
  onClose: () => void
  onConfirm: (images: GalleryImage[], galleryCaption: string) => void
}

interface GalleryItemDraft {
  id: string
  url?: string
  file?: File
  preview: string
  caption: string
}

async function uploadImage(file: File, folder: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const response = await fetch('/api/admin/upload-image', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Upload failed')
  }

  const data = await response.json()
  return data.url as string
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function GalleryUploadModal({
  open,
  folder,
  mode = 'create',
  initialGalleryCaption = 'Gallery',
  initialImages,
  onClose,
  onConfirm,
}: GalleryUploadModalProps) {
  const [items, setItems] = useState<GalleryItemDraft[]>([])
  const [galleryCaption, setGalleryCaption] = useState('Gallery')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const prevOpenRef = useRef(false)

  // Initialize form state only when the modal opens (avoids infinite loop from unstable [] deps)
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current
    prevOpenRef.current = open

    if (!justOpened) return

    if (mode === 'edit' && initialImages && initialImages.length > 0) {
      setItems(
        initialImages.map((image) => ({
          id: createId(),
          url: image.url,
          preview: image.url,
          caption: image.caption || '',
        })),
      )
      setGalleryCaption(initialGalleryCaption || 'Gallery')
    } else {
      setItems([])
      setGalleryCaption('Gallery')
    }
    setError('')
    setIsUploading(false)
  }, [open, mode, initialGalleryCaption, initialImages])

  const handleClose = () => {
    setItems((current) => {
      current.forEach((item) => {
        if (item.file) URL.revokeObjectURL(item.preview)
      })
      return []
    })
    setGalleryCaption('Gallery')
    setError('')
    setIsUploading(false)
    setDragIndex(null)
    onClose()
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('')
    const newItems = acceptedFiles.map((file) => ({
      id: createId(),
      file,
      preview: URL.createObjectURL(file),
      caption: '',
    }))
    setItems((prev) => [...prev, ...newItems])
  }, [])

  const removeItem = (index: number) => {
    setItems((prev) => {
      const next = [...prev]
      const removed = next.splice(index, 1)[0]
      if (removed?.file) URL.revokeObjectURL(removed.preview)
      return next
    })
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const updateCaption = (index: number, caption: string) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], caption }
      return next
    })
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  const handleConfirm = async () => {
    if (items.length < 2) {
      setError('Add at least 2 images for a gallery.')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const images: GalleryImage[] = await Promise.all(
        items.map(async (item) => {
          const url = item.url ?? (item.file ? await uploadImage(item.file, folder) : '')
          if (!url) throw new Error('Missing image URL')
          return {
            url,
            caption: item.caption.trim() || undefined,
          }
        }),
      )
      onConfirm(images, galleryCaption.trim() || 'Gallery')
      setIsUploading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images')
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    disabled: isUploading,
  })

  if (!open) return null

  const title = mode === 'edit' ? 'Edit Image Gallery' : 'Image Gallery'
  const confirmLabel =
    mode === 'edit'
      ? isUploading
        ? 'Saving…'
        : `Save gallery (${items.length})`
      : isUploading
        ? 'Uploading…'
        : `Insert gallery (${items.length})`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label htmlFor="gallery-caption" className="mb-1 block text-sm font-medium">
              Gallery title (optional)
            </label>
            <input
              id="gallery-caption"
              type="text"
              value={galleryCaption}
              onChange={(e) => setGalleryCaption(e.target.value)}
              disabled={isUploading}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Gallery"
            />
          </div>

          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            <PhotoIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {isDragActive ? 'Drop images here…' : 'Add more images — drag & drop or click'}
            </p>
          </div>

          {items.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Drag to reorder · add a caption per image
              </p>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  draggable={!isUploading}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex gap-3 rounded-lg border border-border bg-muted/30 p-2 ${
                    dragIndex === index ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="flex shrink-0 cursor-grab items-center self-center px-1 text-muted-foreground active:cursor-grabbing"
                    aria-label="Drag to reorder"
                    tabIndex={-1}
                  >
                    <Bars3Icon className="h-5 w-5" />
                  </button>

                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.preview}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Image {index + 1} caption
                    </label>
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) => updateCaption(index, e.target.value)}
                      disabled={isUploading}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      placeholder="Optional caption"
                    />
                  </div>

                  <div className="flex shrink-0 flex-col gap-1 self-center">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={isUploading || index === 0}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={isUploading || index === items.length - 1}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={isUploading}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      aria-label="Remove image"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isUploading || items.length < 2}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
