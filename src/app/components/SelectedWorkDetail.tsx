'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface SelectedWorkDetailProps {
  slug: string
}

interface SelectedWork {
  id: string
  title: string
  slug: string
  content: string
  feature_image_url: string
  published_at: string
}

export default function SelectedWorkDetail({ slug }: SelectedWorkDetailProps) {
  const [work, setWork] = useState<SelectedWork | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchWork = async () => {
      try {
        const response = await fetch(`/api/selected-works/${slug}`)
        if (response.ok) {
          const data = await response.json()
          setWork(data.work)
        } else {
          setError('Work not found')
        }
      } catch {
        setError('Failed to load work')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWork()
  }, [slug])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !work) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || 'Work not found'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Feature Image with Title Overlay */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${work.feature_image_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="text-4xl font-bold text-white font-[family-name:var(--font-geist-mono)]">
            {work.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-3xl font-bold text-foreground mb-4 mt-6">{children}</h1>,
            h2: ({ children }) => <h2 className="text-2xl font-bold text-foreground mb-3 mt-5">{children}</h2>,
            h3: ({ children }) => <h3 className="text-xl font-semibold text-foreground mb-3 mt-4">{children}</h3>,
            h4: ({ children }) => <h4 className="text-lg font-semibold text-foreground mb-2 mt-3">{children}</h4>,
            h5: ({ children }) => <h5 className="text-base font-semibold text-foreground mb-2 mt-3">{children}</h5>,
            h6: ({ children }) => <h6 className="text-sm font-semibold text-foreground mb-2 mt-2">{children}</h6>,
            p: ({ children }) => <p className="mb-4 last:mb-0 text-foreground">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-foreground">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground">{children}</ol>,
            blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">{children}</blockquote>,
            img: ({ src, alt }) => {
              if (!src) return null
              return (
                <img 
                  src={src} 
                  alt={alt || ''} 
                  className="max-w-full h-auto rounded-lg my-6"
                  loading="lazy"
                />
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
          {work.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
