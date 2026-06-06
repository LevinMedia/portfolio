'use client'

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { PaperAirplaneIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { Input } from '@headlessui/react'
import ReactMarkdown from 'react-markdown'
import { normalizeLiteralHtmlBreaksInMarkdown } from '@/lib/markdown-normalize'
import remarkGfm from 'remark-gfm'
import MilkdownEditor from './MilkdownEditor'
import { c64FormFieldClass, c64FormFieldLabelClass } from '@/lib/c64-form-classes'
import DrawerSection from './DrawerSection'
import {
  c64DrawerBtnClass,
  c64DrawerBtnSelectedClass,
  c64DrawerEntryHeadingClass,
  c64DrawerHintClass,
  c64DrawerMetaClass,
  c64DrawerSectionHeadingClass,
  c64DrawerStackClass,
} from '@/lib/c64-drawer-classes'
import { C64LoadingScreen, C64SpriteLoader, useC64LoaderVisible } from './C64SpriteLoader'

interface SocialLinks {
  linkedin?: string
  threads?: string
  twitter?: string
  instagram?: string
}

interface GuestbookEntry {
  id: string
  name: string
  message: string
  social_links: SocialLinks
  created_at: string
}

interface GuestbookFormData {
  name: string
  message: string
  socialLinks: SocialLinks
}

const SOCIAL_PLATFORMS = ['linkedin', 'threads', 'twitter', 'instagram'] as const

const CARD_MS = 320
const FADE_MS = 220

type ComposePhase = 'idle' | 'expanding' | 'open' | 'collapsing'

const fieldClass = c64FormFieldClass
const guestbookFieldLabelClass = c64FormFieldLabelClass

export default function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [composePhase, setComposePhase] = useState<ComposePhase>('idle')
  const [contentVisible, setContentVisible] = useState(false)
  const [panelHeight, setPanelHeight] = useState<number | null>(null)
  const composeTimersRef = useRef<number[]>([])
  const leaveBtnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const collapsedHeightRef = useRef(44)
  const [formData, setFormData] = useState<GuestbookFormData>({
    name: '',
    message: '',
    socialLinks: {
      linkedin: '',
      threads: '',
      twitter: '',
      instagram: '',
    },
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/guestbook')
      const data = await response.json()

      if (response.ok) {
        setEntries(data.entries)
      } else {
        setError('Failed to load guestbook entries')
      }
    } catch {
      setError('Failed to load guestbook entries')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const clearComposeTimers = useCallback(() => {
    composeTimersRef.current.forEach((id) => window.clearTimeout(id))
    composeTimersRef.current = []
  }, [])

  const scheduleCompose = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    composeTimersRef.current.push(id)
  }, [])

  useEffect(() => () => clearComposeTimers(), [clearComposeTimers])

  const prefersReducedMotion = useCallback(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  const openCompose = useCallback(() => {
    clearComposeTimers()
    if (prefersReducedMotion()) {
      setComposePhase('open')
      setPanelHeight(null)
      setContentVisible(true)
      return
    }

    const collapsed = leaveBtnRef.current?.offsetHeight ?? 44
    collapsedHeightRef.current = collapsed

    setComposePhase('expanding')
    setContentVisible(false)
    setPanelHeight(collapsed)

    scheduleCompose(() => {
      setContentVisible(true)
      setComposePhase('open')
      setPanelHeight(null)
    }, CARD_MS)
  }, [clearComposeTimers, prefersReducedMotion, scheduleCompose])

  useLayoutEffect(() => {
    if (composePhase !== 'expanding') return undefined

    const collapsed = collapsedHeightRef.current
    if (panelHeight !== collapsed) return undefined

    const panel = panelRef.current
    if (!panel) return undefined

    const expandedHeight = panel.scrollHeight
    let innerFrame = 0
    const frame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        setPanelHeight(expandedHeight)
      })
    })

    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(innerFrame)
    }
  }, [composePhase, panelHeight])

  const closeCompose = useCallback(() => {
    clearComposeTimers()
    if (prefersReducedMotion()) {
      setComposePhase('idle')
      setPanelHeight(null)
      setContentVisible(false)
      setError('')
      return
    }

    setContentVisible(false)
    setComposePhase('collapsing')

    scheduleCompose(() => {
      const panel = panelRef.current
      const collapsed = leaveBtnRef.current?.offsetHeight ?? collapsedHeightRef.current
      const expandedHeight = panel?.offsetHeight ?? panel?.scrollHeight ?? collapsed
      setPanelHeight(expandedHeight)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPanelHeight(collapsed)
        })
      })
    }, FADE_MS)

    scheduleCompose(() => {
      setComposePhase('idle')
      setPanelHeight(null)
      setError('')
    }, FADE_MS + CARD_MS)
  }, [clearComposeTimers, prefersReducedMotion, scheduleCompose])

  const isComposeActive = composePhase !== 'idle'
  const isComposeAnimating = composePhase === 'expanding' || composePhase === 'collapsing'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Your message has been added to the guestbook!')
        setFormData({
          name: '',
          message: '',
          socialLinks: {
            linkedin: '',
            threads: '',
            twitter: '',
            instagram: '',
          },
        })
        closeCompose()
        await fetchEntries()
      } else {
        setError(data.error || 'Failed to add message')
      }
    } catch {
      setError('Failed to add message')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const showLoader = useC64LoaderVisible(isLoading)
  if (showLoader) {
    return <C64LoadingScreen label="Loading guestbook" />
  }

  return (
    <div className={`c64-guestbook-content c64-drawer-copy ${c64DrawerStackClass}`}>
      <DrawerSection
        ariaLabel={isComposeActive ? 'New guestbook entry' : 'Leave a message'}
        className="chrome-guestbook-compose"
      >
        {(composePhase === 'idle' || composePhase === 'collapsing') && (
          <button
            ref={leaveBtnRef}
            type="button"
            onClick={openCompose}
            disabled={composePhase === 'collapsing'}
            tabIndex={composePhase === 'collapsing' ? -1 : 0}
            aria-hidden={composePhase === 'collapsing'}
            className={`${c64DrawerBtnClass} chrome-guestbook-leave-btn${
              composePhase === 'collapsing' ? ' chrome-guestbook-leave-btn--revealing' : ''
            }`}
          >
            <PencilSquareIcon className="h-5 w-5 shrink-0" aria-hidden />
            Leave a message on my wall
          </button>
        )}

        {composePhase !== 'idle' && (
          <div
            ref={panelRef}
            className={`chrome-guestbook-compose-panel${
              composePhase === 'collapsing' ? ' chrome-guestbook-compose-panel--collapsing' : ''
            }`}
            style={panelHeight !== null ? { height: panelHeight } : undefined}
          >
            <div
              className={`chrome-guestbook-compose-panel__content${
                contentVisible ? ' chrome-guestbook-compose-panel__content--visible' : ''
              }`}
            >
                <h2 className={c64DrawerSectionHeadingClass}>New entry</h2>
                <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                  <div>
                    <label className={`${guestbookFieldLabelClass} mb-2`}>Your name</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className={fieldClass}
                      placeholder="Enter your name"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className={`${guestbookFieldLabelClass} mb-2`}>Your message</label>
                    <div className="gb-editor">
                      <MilkdownEditor
                        value={formData.message}
                        onChange={(value) => setFormData((prev) => ({ ...prev, message: value }))}
                        className="min-h-[160px] md:min-h-[200px]"
                        allowVideo={false}
                        allowGallery={false}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`${guestbookFieldLabelClass} mb-3`}>
                      Your social links (optional)
                    </label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <div key={platform}>
                          <label className={`${guestbookFieldLabelClass} mb-1.5 capitalize`}>
                            {platform}
                          </label>
                          <Input
                            type="url"
                            value={formData.socialLinks[platform] || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                socialLinks: {
                                  ...prev.socialLinks,
                                  [platform]: e.target.value,
                                },
                              }))
                            }
                            className={fieldClass}
                            placeholder={`https://${platform}.com/yourusername`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div
                      className="chrome-guestbook-alert chrome-guestbook-alert--error"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}

                  {success && (
                    <div
                      className="chrome-guestbook-alert chrome-guestbook-alert--success"
                      role="status"
                    >
                      {success}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeCompose}
                      disabled={isComposeAnimating}
                      className={c64DrawerBtnClass}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isComposeAnimating}
                      className={`${c64DrawerBtnSelectedClass} inline-flex items-center gap-2`}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="inline-flex h-5 w-8 items-center justify-center overflow-hidden">
                            <C64SpriteLoader className="scale-[0.06] origin-center" />
                          </span>
                          Adding…
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4 shrink-0" aria-hidden />
                          Add to guestbook
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
          </div>
        )}
      </DrawerSection>

      {entries.length === 0 ? (
        <DrawerSection ariaLabel="No entries">
          <p className={`${c64DrawerHintClass} m-0 text-center`}>
            No messages yet. Be the first to leave one.
          </p>
        </DrawerSection>
      ) : (
        entries.map((entry) => {
          const activeSocialLinks = Object.entries(entry.social_links).filter(([, url]) => url)

          return (
            <DrawerSection key={entry.id} ariaLabel={entry.name}>
              <div className="flex items-start gap-3 mb-4">
                <div className="chrome-guestbook-avatar" aria-hidden>
                  {entry.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3 className={c64DrawerEntryHeadingClass}>{entry.name}</h3>
                  <p className={`${c64DrawerMetaClass} mt-0.5`}>{formatDate(entry.created_at)}</p>
                </div>
              </div>

              <div className="c64-prose max-w-none mb-4">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1>{children}</h1>,
                    h2: ({ children }) => <h2>{children}</h2>,
                    h3: ({ children }) => <h3>{children}</h3>,
                    h4: ({ children }) => <h4>{children}</h4>,
                    h5: ({ children }) => <h5>{children}</h5>,
                    h6: ({ children }) => <h6>{children}</h6>,
                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="mb-3 list-disc list-outside space-y-1 pl-5">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 list-decimal list-outside space-y-1 pl-5">{children}</ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-[var(--chrome-border)] pl-4 italic my-4">
                        {children}
                      </blockquote>
                    ),
                    img: ({ src, alt }) => {
                      if (!src) return null
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={alt || ''}
                          className="max-w-full h-auto my-4"
                          loading="lazy"
                        />
                      )
                    },
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => (
                      <code className="rounded bg-[color-mix(in_srgb,var(--chrome-text)_6%,var(--chrome-card-bg))] px-1.5 py-0.5 text-sm font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="overflow-x-auto rounded-xl border border-[var(--chrome-border)] bg-[color-mix(in_srgb,var(--chrome-text)_5%,var(--chrome-card-bg))] p-4 my-4">
                        {children}
                      </pre>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--chrome-accent)] underline underline-offset-2"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {normalizeLiteralHtmlBreaksInMarkdown(entry.message)}
                </ReactMarkdown>
              </div>

              {activeSocialLinks.length > 0 && (
                <div className="chrome-guestbook-social">
                  <span className={c64DrawerHintClass}>Connect</span>
                  <div className="chrome-guestbook-social-links">
                    {activeSocialLinks.map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chrome-guestbook-social-link capitalize"
                      >
                        {platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </DrawerSection>
          )
        })
      )}
    </div>
  )
}
