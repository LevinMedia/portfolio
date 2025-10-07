'use client'

import { useState, useCallback } from 'react'
import Cropper, { Point, Area } from 'react-easy-crop'

interface ThumbnailCropperProps {
  imageUrl: string
  initialCrop?: { x: number; y: number; width: number; height: number; unit: string }
  onCropChange: (crop: { x: number; y: number; width: number; height: number; unit: string }) => void
  onCropComplete?: (croppedAreaPixels: Area) => void
}

export default function ThumbnailCropper({
  imageUrl,
  initialCrop,
  onCropChange,
  onCropComplete
}: ThumbnailCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: initialCrop?.x || 0, y: initialCrop?.y || 0 })
  const [zoom, setZoom] = useState(1)

  const onCropChangeInternal = useCallback((location: Point) => {
    setCrop(location)
  }, [])

  const onCropCompleteInternal = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      // Convert to percentage-based crop for storage
      onCropChange({
        x: croppedArea.x,
        y: croppedArea.y,
        width: croppedArea.width,
        height: croppedArea.height,
        unit: '%'
      })

      if (onCropComplete) {
        onCropComplete(croppedAreaPixels)
      }
    },
    [onCropChange, onCropComplete]
  )

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={onCropChangeInternal}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={setZoom}
          objectFit="contain"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Zoom: {zoom.toFixed(2)}x
        </label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="text-xs text-muted-foreground">
        <p>Drag to reposition the crop area. Use the slider to zoom.</p>
        <p className="mt-1">This 1:1 crop will be used for the thumbnail grid.</p>
      </div>
    </div>
  )
}
