'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface SimpleImageUploaderProps {
  currentImage?: string
  onImageUpload: (url: string) => void
  folder?: string
  aspectRatio?: number
}

export default function SimpleImageUploader({ 
  currentImage, 
  onImageUpload, 
  folder = 'images',
  aspectRatio = 16 / 9
}: SimpleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentImage || '')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setPreviewUrl(result.url)
        onImageUpload(result.url)
      } else {
        const errorData = await response.json()
        console.error('Upload failed:', errorData.error)
        alert('Failed to upload image. Please try again.')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [folder, onImageUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    disabled: isUploading
  })

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative w-full bg-muted rounded-lg overflow-hidden" style={{ aspectRatio }}>
          <Image
            src={previewUrl}
            alt="Preview"
            fill
            className="object-cover"
          />
          <button
            onClick={() => {
              setPreviewUrl('')
              onImageUpload('')
            }}
            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border/20 hover:border-primary/50'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <PhotoIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-foreground mb-2">
                {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
              </p>
              <p className="text-sm text-muted-foreground">
                Supports: JPEG, PNG, GIF, WebP
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended aspect ratio: {aspectRatio === 16 / 9 ? '16:9' : aspectRatio === 1 ? '1:1' : aspectRatio}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
