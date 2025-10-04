'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { PhotoIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface CompanyLogoUploaderProps {
  currentLogo?: string
  currentAlt?: string
  onLogoChange: (logoUrl: string, altText: string) => void
  onClose: () => void
}

export default function CompanyLogoUploader({ currentLogo, currentAlt, onLogoChange, onClose }: CompanyLogoUploaderProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [altText, setAltText] = useState(currentAlt || '')
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setImageFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false
  })

  const handleUpload = async () => {
    if (!imageFile) {
      onLogoChange(currentLogo || '', altText)
      onClose()
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('folder', 'company-logos')

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        onLogoChange(result.url, altText)
        onClose()
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
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border/20 rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-foreground font-[family-name:var(--font-geist-mono)]">Upload Company Logo</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {!imageFile && !currentLogo ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border/20 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <PhotoIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-foreground mb-2">
                {isDragActive ? 'Drop the logo here' : 'Drag & drop a logo, or click to select'}
              </p>
              <p className="text-sm text-muted-foreground">
                Supports: JPEG, PNG, GIF, WebP
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview */}
              <div className="text-center">
                <h4 className="text-sm font-medium text-foreground mb-2">Preview</h4>
                <div className="inline-block border border-border/20 rounded-lg p-4 bg-muted/5">
                  <Image
                    src={previewUrl || currentLogo || ''}
                    alt={altText}
                    width={100}
                    height={100}
                    className="object-contain"
                    style={{ maxWidth: '100px', maxHeight: '100px' }}
                  />
                </div>
              </div>

              {/* Alt Text Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="block w-full px-3 py-2 border border-border/20 rounded-md shadow-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="Describe the logo for accessibility..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setImageFile(null)
                    setPreviewUrl('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Choose Different Image
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Use This Logo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
