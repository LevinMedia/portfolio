'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Crepe } from '@milkdown/crepe'
import { ADMIN_VIDEO_MAX_BYTES } from '@/lib/admin-video-upload'
import '@milkdown/crepe/theme/common/style.css'
// Don't import frame.css - we'll use our own theme

interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  allowVideo?: boolean
}

export default function MilkdownEditor({ value, onChange, className, allowVideo = true }: MilkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const creatingRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Handle video file upload
  const handleVideoUpload = async (file: File) => {
    setIsUploadingVideo(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !supabaseAnonKey) {
        alert('Missing Supabase public env (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).')
        return
      }

      if (file.size > ADMIN_VIDEO_MAX_BYTES) {
        alert(
          `Video is too large (max ${Math.floor(ADMIN_VIDEO_MAX_BYTES / (1024 * 1024))} MB). Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
        )
        return
      }

      const isQuickTimeMov =
        file.type === 'video/quicktime' || /\.mov$/i.test(file.name)
      if (
        isQuickTimeMov &&
        !window.confirm(
          'QuickTime (.mov) files often fail in the site video player (HEVC, ProRes, etc.). For reliable playback, export to MP4 with H.264 video and AAC audio first.\n\nUpload this .mov anyway?',
        )
      ) {
        return
      }

      console.log('📹 Uploading video:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB')

      const initRes = await fetch('/api/admin/upload-video/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          folder: 'selected-works-videos',
          fileName: file.name,
          contentType: file.type || 'video/mp4',
          fileSize: file.size,
        }),
      })

      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}))
        console.error('❌ Video init failed:', err)
        alert('Failed to start upload: ' + (err.error || initRes.statusText))
        return
      }

      const { path, token, publicUrl } = (await initRes.json()) as {
        path: string
        token: string
        publicUrl: string
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { error: uploadError } = await supabase.storage.from('media').uploadToSignedUrl(path, token, file, {
        contentType: file.type || 'video/mp4',
        cacheControl: '3600',
        upsert: false,
      })

      if (uploadError) {
        console.error('❌ Video upload failed:', uploadError)
        let detail = uploadError.message
        if (/exceeded the maximum allowed size/i.test(detail)) {
          detail +=
            '\n\nSupabase Storage enforces a max file size per project (Free plan: 50 MB). For ~108 MB videos, upgrade to Pro (or higher) and raise “Global file size limit” under Dashboard → Storage → Settings, then retry.'
        }
        alert('Failed to upload video: ' + detail)
        return
      }

      console.log('✅ Video uploaded successfully!')
      console.log('🔗 Video URL:', publicUrl)

      const videoMarkdown = `!video[Video](${publicUrl})`
      
      try {
        await navigator.clipboard.writeText(videoMarkdown)
        alert(`Video uploaded successfully!\n\nThe video markdown has been copied to your clipboard. Paste it in the editor where you want the video to appear:\n\n${videoMarkdown}`)
      } catch {
        // Fallback if clipboard API is not available
        alert(`Video uploaded successfully!\n\nCopy and paste this into the editor:\n\n${videoMarkdown}`)
      }
    } catch (error) {
      console.error('❌ Video upload error:', error)
      alert('Failed to upload video. Please try again.')
    } finally {
      setIsUploadingVideo(false)
      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }
    }
  }

  const handleVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleVideoUpload(file)
    }
  }

  const triggerVideoUpload = () => {
    videoInputRef.current?.click()
  }

  useEffect(() => {
    if (!editorRef.current || crepeRef.current || creatingRef.current) return

    creatingRef.current = true
    const initialValue = value
    let mounted = true

    const initEditor = async () => {
      if (!editorRef.current || !mounted) {
        creatingRef.current = false
        return
      }
      
      // Ensure the mount root is clean to avoid duplicate editors in StrictMode/dev
      editorRef.current.innerHTML = ''

      // Small delay to ensure DOM is ready and avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 50))
      
      if (!mounted || !editorRef.current) {
        creatingRef.current = false
        return
      }

      try {
        const crepe = new Crepe({
          root: editorRef.current!,
          defaultValue: initialValue || '',
          featureConfigs: {
            [Crepe.Feature.ImageBlock]: {
              onUpload: async (file: File) => {
                try {
                  const formData = new FormData()
                  formData.append('file', file)
                  formData.append('folder', 'selected-works')

                  const response = await fetch('/api/admin/upload-image', {
                    method: 'POST',
                    body: formData,
                  })

                  if (!response.ok) {
                    const errorData = await response.json()
                    console.error('❌ Upload failed:', errorData)
                    throw new Error(errorData.error || 'Upload failed')
                  }

                  const data = await response.json()
                  return data.url
                } catch (error) {
                  console.error('❌ Image upload failed:', error)
                  throw error
                }
              },
            },
          },
        })

        if (!mounted) {
          crepe.destroy()
          creatingRef.current = false
          return
        }

        // Set up listener BEFORE creating the editor
        crepe.on((listener) => {
          listener.markdownUpdated((ctx, markdown) => {
            if (onChangeRef.current) {
              onChangeRef.current(markdown)
            }
          })
        })

        await crepe.create()
        
        if (mounted) {
          crepeRef.current = crepe
        } else {
          crepe.destroy()
        }
        creatingRef.current = false
      } catch (err) {
        console.error('❌ Failed to create Crepe:', err)
        creatingRef.current = false
      }
    }

    initEditor()

    return () => {
      mounted = false
      if (crepeRef.current) {
        try {
          crepeRef.current.destroy()
        } catch (err) {
          console.error('Error destroying editor:', err)
        }
        crepeRef.current = null
      }
      creatingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only initialize once on mount

  return (
    <div className="relative">
      {/* Video Upload Button - Only show if allowVideo is true */}
      {allowVideo && (
        <>
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={triggerVideoUpload}
              disabled={isUploadingVideo}
              className="inline-flex items-center px-3 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingVideo ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Add Video
                </>
              )}
            </button>
            <span className="text-xs text-muted-foreground">
              Tip: Use the image button (/) in the editor for images
            </span>
          </div>

          {/* Hidden file input */}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,video/mpeg,video/3gpp,video/x-flv"
            onChange={handleVideoInputChange}
            className="hidden"
          />
        </>
      )}

      {/* Editor */}
      <div className={`crepe-editor border border-border rounded-md bg-background ${className}`} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <div ref={editorRef} style={{ overflow: 'visible' }} />
      </div>
    </div>
  )
}