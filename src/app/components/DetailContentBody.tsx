'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { normalizeLiteralHtmlBreaksInMarkdown } from '@/lib/markdown-normalize'
import { parseContentWithEmbeds } from '@/lib/gallery-markdown'
import VideoPlayer from './VideoPlayer'
import YouTubeEmbed from './YouTubeEmbed'
import ImageGallery from './ImageGallery'
import ZoomableImage from './ZoomableImage'

interface DetailContentBodyProps {
  content: string
  /** Extra classes for inline images (field notes round theirs). */
  imageClassName?: string
  /**
   * When set, links that point at this site call it with the in-app href instead of
   * opening a new tab, so the destination can stack over the current overlay.
   */
  onInternalNavigate?: (href: string) => void
}

/** In-app href for links to this site (relative, same origin, or levinmedia.com); otherwise null. */
function toInternalHref(href: string | undefined): string | null {
  if (!href || typeof window === 'undefined') return null
  if (href.startsWith('#')) return null
  try {
    const url = new URL(href, window.location.origin)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    const host = url.hostname.replace(/^www\./, '')
    if (url.origin !== window.location.origin && host !== 'levinmedia.com') return null
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) return null
    // Files (PDFs, images) are not app routes; let them open in a new tab like external links.
    if (/\.[a-z0-9]+$/i.test(url.pathname)) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

/** Markdown body shared by featured work, field notes and password-access Index pages. */
export default function DetailContentBody({
  content,
  imageClassName = '',
  onInternalNavigate,
}: DetailContentBodyProps) {
  return (
    <div className="c64-prose c64-media space-y-8 mt-8 w-full md:max-w-4xl mx-auto">
      <div className="max-w-none md:px-32">
        {parseContentWithEmbeds(content).map((part, index) => {
          if (part.type === 'video') {
            return (
              <div key={index} className="my-6 md:-mx-32">
                <VideoPlayer src={part.content} />
              </div>
            )
          }

          if (part.type === 'youtube') {
            return (
              <div key={index} className="my-6 md:-mx-32">
                <YouTubeEmbed videoId={part.videoId} />
              </div>
            )
          }

          if (part.type === 'gallery') {
            return (
              <div key={index} className="my-6 md:-mx-32">
                <ImageGallery images={part.images} caption={part.caption} />
              </div>
            )
          }

          return (
            <div key={index}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1>{children}</h1>,
                  h2: ({ children }) => <h2>{children}</h2>,
                  h3: ({ children }) => <h3>{children}</h3>,
                  h4: ({ children }) => <h4>{children}</h4>,
                  h5: ({ children }) => <h5>{children}</h5>,
                  h6: ({ children }) => <h6>{children}</h6>,
                  p: ({ children, node }) => {
                    // Check if this paragraph only contains an image
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const hasImage = node?.children?.some((child: any) => child.tagName === 'img')
                    if (hasImage) {
                      return <div className="mb-4 last:mb-0">{children}</div>
                    }
                    return <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
                  },
                  ul: ({ children }) => <ul className="list-disc mb-4 space-y-2" style={{ paddingLeft: '1.5rem' }}>{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal mb-4 space-y-2" style={{ paddingLeft: '1.5rem' }}>{children}</ol>,
                  li: ({ children }) => <li>{children}</li>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">{children}</blockquote>,
                  img: ({ src, alt }) => {
                    if (!src) return null
                    return (
                      <div className="my-6 md:-mx-32">
                        <ZoomableImage
                          src={String(src)}
                          alt={alt || ''}
                          className={`w-full h-auto ${imageClassName}`.trim()}
                        />
                      </div>
                    )
                  },
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
                      {children}
                    </pre>
                  ),
                  a: ({ href, children }) => {
                    const internalHref = onInternalNavigate ? toInternalHref(href) : null
                    if (internalHref && onInternalNavigate) {
                      return (
                        <a
                          href={internalHref}
                          className="text-primary underline hover:text-primary/80"
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                            e.preventDefault()
                            onInternalNavigate(internalHref)
                          }}
                        >
                          {children}
                        </a>
                      )
                    }
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                        {children}
                      </a>
                    )
                  },
                }}
              >
                {normalizeLiteralHtmlBreaksInMarkdown(part.content)}
              </ReactMarkdown>
            </div>
          )
        })}
      </div>
    </div>
  )
}
