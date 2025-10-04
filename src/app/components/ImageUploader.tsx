'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Cropper from 'react-easy-crop'
import { PhotoIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

interface ImageUploaderProps {
  currentImage?: string
  currentAlt?: string
  onImageChange: (imageUrl: string, altText: string) => void
  onClose: () => void
}

interface Area {
  x: number
  y: number
  width: number
  height: number
}

export default function ImageUploader({ currentAlt, onImageChange, onClose }: ImageUploaderProps) {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [altText, setAltText] = useState(currentAlt || '')
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '')
      })
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false
  })

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        const reader = new FileReader()
        reader.addEventListener('load', () => resolve(reader.result as string))
        reader.readAsDataURL(blob)
      }, 'image/jpeg', 0.9)
    })
  }

  const onDownloadCropClick = async () => {
    if (!croppedAreaPixels) {
      return
    }

    setIsProcessing(true)
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      onImageChange(croppedImage, altText)
      onClose()
    } catch (error) {
      console.error('Error cropping image:', error)
      alert('Error processing image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-foreground">Upload and Crop Image</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {!imageSrc ? (
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
                {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
              </p>
              <p className="text-sm text-muted-foreground">
                Supports: JPEG, PNG, GIF, WebP
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image Cropper */}
              <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={true}
                />
              </div>

              {/* Zoom Control */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Zoom: {Math.round(zoom * 100)}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
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
                  placeholder="Describe the image for accessibility..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setImageSrc('')}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Choose Different Image
                </button>
                <button
                  onClick={onDownloadCropClick}
                  disabled={!croppedAreaPixels || isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Use This Image'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}