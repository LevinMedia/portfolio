'use client'

import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { remarkCaption } from '@/lib/caption-markdown'
import { IMAGE_BORDERLESS_CLASS, parseImageBlockAlt } from '@/lib/image-borderless'
import { normalizeLiteralHtmlBreaksInMarkdown } from '@/lib/markdown-normalize'
import { indexPostMedia, videoDisplayCaption } from '@/lib/post-media'
import VideoPlayer from './VideoPlayer'
import YouTubeEmbed from './YouTubeEmbed'
import ImageGallery from './ImageGallery'
import ImageGalleryLightbox from './ImageGalleryLightbox'
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
  /** Featured work and field notes: 20% wider text column and media frame. */
  wide?: boolean
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
  wide = false,
}: DetailContentBodyProps) {
  const frameClass = wide ? 'md:max-w-[67.2rem]' : 'md:max-w-4xl'
  const insetClass = wide ? 'md:px-[14.285714%]' : 'md:px-32'
  const bleedClass = wide ? 'my-6 md:-mx-[20%]' : 'my-6 md:-mx-32'
  const { parts, media } = useMemo(() => indexPostMedia(content), [content])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <div className={`c64-prose c64-media space-y-8 mt-8 w-full mx-auto ${frameClass}`}>
      <div className={`max-w-none ${insetClass}`}>
        {parts.map((part, index) => {
          if (part.type === 'video') {
            const caption = videoDisplayCaption(part.alt)
            return (
              <div
                key={index}
                className={bleedClass}
                onClickCapture={(event) => {
                  const target = event.target as HTMLElement
                  if (target.closest('.vjs-control-bar, .vjs-big-play-button, .vjs-menu, button')) return
                  if (!target.closest('.video-js, video')) return
                  event.preventDefault()
                  event.stopPropagation()
                  setLightboxIndex(part.mediaStart)
                }}
              >
                <VideoPlayer src={part.content} />
                {caption ? <p className="md-caption mt-3">{caption}</p> : null}
              </div>
            )
          }

          if (part.type === 'youtube') {
            return (
              <div key={index} className={bleedClass}>
                <YouTubeEmbed videoId={part.videoId} />
              </div>
            )
          }

          if (part.type === 'gallery') {
            return (
              <div key={index} className={bleedClass}>
                <ImageGallery
                  images={part.images}
                  caption={part.caption}
                  onOpenImage={(imageIndex) => setLightboxIndex(part.mediaStart + imageIndex)}
                />
              </div>
            )
          }

          const imageOrdinal = { next: part.mediaStart }

          return (
            <div key={index}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkCaption]}
                components={{
                  h1: ({ children }) => <h1>{children}</h1>,
                  h2: ({ children }) => <h2>{children}</h2>,
                  h3: ({ children }) => <h3>{children}</h3>,
                  h4: ({ children }) => <h4>{children}</h4>,
                  h5: ({ children }) => <h5>{children}</h5>,
                  h6: ({ children }) => <h6>{children}</h6>,
                  mdcaption: ({ children }) => (
                    <p className="md-caption mb-4 last:mb-0 leading-relaxed">{children}</p>
                  ),
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
                  img: ({ src, alt, title }) => {
                    if (!src) return null
                    const slideIndex = imageOrdinal.next
                    imageOrdinal.next += 1
                    const parsed = parseImageBlockAlt(typeof alt === 'string' ? alt : undefined)
                    const slide = media[slideIndex]
                    const fromTitle = typeof title === 'string' ? title.trim() : ''
                    const fromSlide = slide?.kind === 'image' ? slide.caption?.trim() || '' : ''
                    const caption = fromTitle || fromSlide
                    const displayAlt = parsed.ratio != null ? caption : alt || ''
                    const frameClass = parsed.borderless ? IMAGE_BORDERLESS_CLASS : ''
                    return (
                      <div className={bleedClass}>
                        <ZoomableImage
                          src={String(src)}
                          alt={displayAlt}
                          className={`w-full h-auto ${imageClassName} ${frameClass}`.trim()}
                          onOpen={() => setLightboxIndex(slideIndex)}
                        />
                        {caption ? <p className="md-caption mt-3">{caption}</p> : null}
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
      <ImageGalleryLightbox
        key={lightboxIndex ?? 'closed'}
        images={media}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  )
}
