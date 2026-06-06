'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Crepe } from '@milkdown/crepe'
import { commandsCtx } from '@milkdown/kit/core'
import { clearTextInCurrentBlockCommand } from '@milkdown/kit/preset/commonmark'
import { insert, replaceAll } from '@milkdown/utils'
import { ADMIN_VIDEO_MAX_BYTES } from '@/lib/admin-video-upload'
import {
  buildGalleryMarkdown,
  findAllGalleriesInContent,
  type GalleryImage,
} from '@/lib/gallery-markdown'
import GalleryUploadModal from './GalleryUploadModal'
import '@milkdown/crepe/theme/common/style.css'

const galleryIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM4 8h4V12H4V8ZM10 8h10v2H10V8ZM10 11h10v2H10v-2ZM4 14h4v3H4v-3ZM10 14h10v3H10v-3Z"/>
  </svg>
`

interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  allowVideo?: boolean
  allowGallery?: boolean
  uploadFolder?: string
}

export default function MilkdownEditor({
  value,
  onChange,
  className,
  allowVideo = true,
  allowGallery = true,
  uploadFolder = 'selected-works',
}: MilkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const creatingRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const openGalleryModalRef = useRef<() => void>(() => {})
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)
  const [galleryModalMode, setGalleryModalMode] = useState<'create' | 'edit'>('create')
  const [editingGallery, setEditingGallery] = useState<{
    raw: string
    caption: string
    images: GalleryImage[]
  } | null>(null)
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false)
  const [galleryCandidates, setGalleryCandidates] = useState<
    ReturnType<typeof findAllGalleriesInContent>
  >([])

  const openCreateGalleryModal = () => {
    setGalleryModalMode('create')
    setEditingGallery(null)
    setGalleryModalOpen(true)
  }

  openGalleryModalRef.current = openCreateGalleryModal

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const uploadImage = async (file: File, folder: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

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
    return data.url as string
  }

  const handleGalleryConfirm = (images: GalleryImage[], caption: string) => {
    const newMarkdown = buildGalleryMarkdown(caption, images)

    if (galleryModalMode === 'edit' && editingGallery) {
      const current = crepeRef.current?.getMarkdown() ?? value
      const updated = current.includes(editingGallery.raw)
        ? current.replace(editingGallery.raw, newMarkdown)
        : `${current}\n\n${newMarkdown}`

      crepeRef.current?.editor.action(replaceAll(updated))
      onChange(updated)
    } else {
      crepeRef.current?.editor.action(insert(newMarkdown))
    }

    setGalleryModalOpen(false)
    setEditingGallery(null)
    setGalleryModalMode('create')
  }

  const startEditGallery = () => {
    const markdown = crepeRef.current?.getMarkdown() ?? value
    const galleries = findAllGalleriesInContent(markdown)

    if (galleries.length === 0) {
      alert('No galleries found in this content. Insert one with / → Image Gallery first.')
      return
    }

    if (galleries.length === 1) {
      setGalleryModalMode('edit')
      setEditingGallery(galleries[0])
      setGalleryModalOpen(true)
      return
    }

    setGalleryCandidates(galleries)
    setGalleryPickerOpen(true)
  }

  const selectGalleryToEdit = (gallery: (typeof galleryCandidates)[number]) => {
    setGalleryPickerOpen(false)
    setGalleryModalMode('edit')
    setEditingGallery(gallery)
    setGalleryModalOpen(true)
  }

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
      
      editorRef.current.innerHTML = ''

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
                  return await uploadImage(file, uploadFolder)
                } catch (error) {
                  console.error('❌ Image upload failed:', error)
                  throw error
                }
              },
            },
            ...(allowGallery
              ? {
                  [Crepe.Feature.BlockEdit]: {
                    buildMenu: (builder) => {
                      builder.getGroup('advanced').addItem('image-gallery', {
                        label: 'Image Gallery',
                        icon: galleryIcon,
                        onRun: (ctx) => {
                          const commands = ctx.get(commandsCtx)
                          commands.call(clearTextInCurrentBlockCommand.key)
                          openGalleryModalRef.current()
                        },
                      })
                    },
                  },
                }
              : {}),
          },
        })

        if (!mounted) {
          crepe.destroy()
          creatingRef.current = false
          return
        }

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
  }, [])

  return (
    <div className="relative">
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
              Tip: Use / in the editor for images and galleries
            </span>
          </div>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,video/mpeg,video/3gpp,video/x-flv"
            onChange={handleVideoInputChange}
            className="hidden"
          />
        </>
      )}

      {allowGallery && (
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={startEditGallery}
            className="inline-flex items-center px-3 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Edit Gallery
          </button>
          <span className="text-xs text-muted-foreground">
            Reorder images, captions, or add more to an existing gallery
          </span>
        </div>
      )}

      <div className={`crepe-editor border border-border rounded-md bg-background ${className}`} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <div ref={editorRef} style={{ overflow: 'visible' }} />
      </div>

      {allowGallery && (
        <>
          <GalleryUploadModal
            open={galleryModalOpen}
            folder={uploadFolder}
            mode={galleryModalMode}
            initialGalleryCaption={editingGallery?.caption}
            initialImages={editingGallery?.images}
            onClose={() => {
              setGalleryModalOpen(false)
              setEditingGallery(null)
              setGalleryModalMode('create')
            }}
            onConfirm={handleGalleryConfirm}
          />

          {galleryPickerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-background border border-border rounded-lg max-w-md w-full shadow-lg">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-lg font-semibold">Choose a gallery to edit</h2>
                </div>
                <ul className="max-h-64 overflow-auto p-2">
                  {galleryCandidates.map((gallery, index) => (
                    <li key={gallery.raw}>
                      <button
                        type="button"
                        onClick={() => selectGalleryToEdit(gallery)}
                        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        Gallery {index + 1}: {gallery.caption || 'Untitled'} ({gallery.images.length}{' '}
                        images)
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end border-t border-border px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setGalleryPickerOpen(false)}
                    className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
