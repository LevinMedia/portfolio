'use client'

import { useEffect, useRef } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
// Don't import frame.css - we'll use our own theme

interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function MilkdownEditor({ value, onChange, className }: MilkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const onChangeRef = useRef(onChange)

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!editorRef.current || crepeRef.current) return

    let isCreating = false
    const initialValue = value

    const initEditor = async () => {
      if (isCreating) return
      isCreating = true

      try {
        const crepe = new Crepe({
          root: editorRef.current!,
          defaultValue: initialValue || '',
          featureConfigs: {
            [Crepe.Feature.ImageBlock]: {
              onUpload: async (file: File) => {
                console.log('🖼️ ImageBlock onUpload called!')
                console.log('📤 Uploading image:', file.name, 'Size:', file.size, 'Type:', file.type)
                
                try {
                  const formData = new FormData()
                  formData.append('file', file)
                  formData.append('folder', 'selected-works')

                  console.log('📡 Sending upload request...')
                  const response = await fetch('/api/admin/upload-image', {
                    method: 'POST',
                    body: formData,
                  })

                  console.log('📡 Upload response status:', response.status)

                  if (!response.ok) {
                    const errorData = await response.json()
                    console.error('❌ Upload failed:', errorData)
                    throw new Error(errorData.error || 'Upload failed')
                  }

                  const data = await response.json()
                  console.log('✅ Image uploaded successfully!')
                  console.log('🔗 Image URL:', data.url)
                  return data.url
                } catch (error) {
                  console.error('❌ Image upload failed:', error)
                  throw error
                }
              },
            },
          },
        })

        // Set up listener BEFORE creating the editor
        crepe.on((listener) => {
          listener.markdownUpdated((ctx, markdown) => {
            if (onChangeRef.current) {
              onChangeRef.current(markdown)
            }
          })
        })

        await crepe.create()
        console.log('✅ Crepe editor created!')
        crepeRef.current = crepe
      } catch (err) {
        console.error('❌ Failed to create Crepe:', err)
        isCreating = false
      }
    }

    initEditor()

    return () => {
      if (crepeRef.current) {
        try {
          crepeRef.current.destroy()
        } catch (err) {
          console.error('Error destroying editor:', err)
        }
        crepeRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only initialize once on mount

  return (
    <div className={`crepe-editor border border-border rounded-md bg-background ${className}`} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
      <div ref={editorRef} style={{ overflow: 'visible' }} />
    </div>
  )
}