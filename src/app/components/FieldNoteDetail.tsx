'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import VideoPlayer from './VideoPlayer'

interface FieldNoteDetailProps {
  slug: string
  onTitleLoad?: (title: string) => void
  onTitleVisibilityChange?: (isVisible: boolean) => void
}

interface FieldNote {
  id: string
  title: string
  slug: string
  content: string
  feature_image_url: string
  published_at: string
  author: string
  og_vertical_align?: 'top' | 'center' | 'bottom'
}

// Helper function to parse content and extract video embeds
function parseContentWithVideos(content: string) {
  const videoRegex = /!video\[([^\]]*)\]\(([^)]+)\)/g
  const parts: Array<{ type: 'markdown' | 'video'; content: string; alt?: string }> = []
  let lastIndex = 0
  let match

  while ((match = videoRegex.exec(content)) !== null) {
    // Add markdown content before the video
    if (match.index > lastIndex) {
      parts.push({
        type: 'markdown',
        content: content.substring(lastIndex, match.index)
      })
    }

    // Add video
    parts.push({
      type: 'video',
      content: match[2], // URL
      alt: match[1] // Alt text
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining markdown content
  if (lastIndex < content.length) {
    parts.push({
      type: 'markdown',
      content: content.substring(lastIndex)
    })
  }

  return parts.length > 0 ? parts : [{ type: 'markdown', content }]
}

export default function FieldNoteDetail({ slug, onTitleLoad, onTitleVisibilityChange }: FieldNoteDetailProps) {
  const [note, setNote] = useState<FieldNote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await fetch(`/api/field-notes/${slug}`)
        if (response.ok) {
          const data = await response.json()
          setNote(data.note)
          // Notify parent of the title
          if (onTitleLoad && data.note?.title) {
            onTitleLoad(data.note.title)
          }
        } else {
          setError('Note not found')
        }
      } catch {
        setError('Failed to load note')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNote()
  }, [slug, onTitleLoad])

  // Set up Intersection Observer to detect when title scrolls out of view
  useEffect(() => {
    if (!titleRef.current || !onTitleVisibilityChange) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Title is visible if it's intersecting
        onTitleVisibilityChange(entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '-80px 0px 0px 0px', // Account for drawer header height
      }
    )

    observer.observe(titleRef.current)

    return () => {
      observer.disconnect()
    }
  }, [onTitleVisibilityChange, note])


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || 'Note not found'}</p>
      </div>
    )
  }

  return (
    <>
      {/* Feature Image with Title Overlay - Full Width Edge to Edge */}
      <div 
        className="relative overflow-hidden -mx-4" 
        style={{ 
          width: 'calc(100% + 2rem)',
          maxWidth: 'none',
          height: '50vh',
          maxHeight: '50vh'
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${note.feature_image_url})`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 ref={titleRef} className="text-4xl font-bold text-white font-[family-name:var(--font-geist-mono)]">
            {note.title}
          </h1>
          <p className="text-white/80 text-sm mt-2 font-[family-name:var(--font-geist-mono)]">
            {note.author}
          </p>
        </div>
      </div>

      <div className="space-y-8 mt-8 w-full md:max-w-4xl mx-auto">
        {/* Content */}
        <div className="prose prose-lg text-foreground md:px-32">
          {parseContentWithVideos(note.content).map((part, index) => {
            if (part.type === 'video') {
              return (
                <div key={index} className="my-6 md:-mx-32">
                  <VideoPlayer src={part.content} />
                </div>
              )
            }
            
            return (
              <div key={index}>
                <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h1 className="text-3xl font-bold text-foreground mb-4 mt-6 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--foreground)' }}>{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold mb-3 mt-5 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--accent)' }}>{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-semibold mb-3 mt-4 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--secondary)' }}>{children}</h3>,
                    h4: ({ children }) => <h4 className="text-lg font-semibold text-foreground mb-2 mt-3 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--foreground)' }}>{children}</h4>,
                    h5: ({ children }) => <h5 className="text-base font-semibold text-foreground mb-2 mt-3 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--foreground)' }}>{children}</h5>,
                    h6: ({ children }) => <h6 className="text-sm font-semibold text-foreground mb-2 mt-2 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--foreground)' }}>{children}</h6>,
                    p: ({ children, node }) => {
                      // Check if this paragraph only contains an image
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const hasImage = node?.children?.some((child: any) => child.tagName === 'img')
                      if (hasImage) {
                        return <div className="mb-4 last:mb-0 text-foreground">{children}</div>
                      }
                      return <p className="mb-4 last:mb-0 text-foreground">{children}</p>
                    },
                    ul: ({ children }) => <ul className="list-disc mb-4 space-y-2 text-foreground" style={{ paddingLeft: '1.5rem' }}>{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal mb-4 space-y-2 text-foreground" style={{ paddingLeft: '1.5rem' }}>{children}</ol>,
                    li: ({ children }) => <li className="text-foreground">{children}</li>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">{children}</blockquote>,
                    img: ({ src, alt }) => {
                      if (!src) return null
                      return (
                        <div className="my-6 md:-mx-32">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={src} 
                            alt={alt || ''} 
                            className="w-full h-auto rounded-lg"
                            loading="lazy"
                          />
                        </div>
                      )
                    },
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-foreground">
                        {children}
                      </pre>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                        {children}
                      </a>
                    )
                  }}
                >
                  {part.content}
                </ReactMarkdown>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

