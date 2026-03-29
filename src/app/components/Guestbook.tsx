'use client'

import { useState, useEffect } from 'react'
import { PaperAirplaneIcon, UserIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { Input } from '@headlessui/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MilkdownEditor from './MilkdownEditor'
import Button from './Button'

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

const boxClass =
  'border-4 border-[var(--c64-accent)] bg-[var(--c64-screen-bg)] c64-petscii-frame c64-screen-grid'

const fieldClass =
  'block w-full px-3 py-2 border-2 border-[var(--c64-accent)]/45 bg-[var(--c64-border-bg)]/25 text-foreground placeholder:text-foreground/45 shadow-none focus:outline-none focus:ring-2 focus:ring-[var(--c64-accent)] focus:border-[var(--c64-accent)] sm:text-sm transition-colors rounded-none'

export default function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [formData, setFormData] = useState<GuestbookFormData>({
    name: '',
    message: '',
    socialLinks: {
      linkedin: '',
      threads: '',
      twitter: '',
      instagram: ''
    }
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch guestbook entries
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    console.log('📤 Submitting form data:', formData)

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
            instagram: ''
          }
        })
        // Collapse form and refresh entries
        setIsFormVisible(false)
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get social icon
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return '💼'
      case 'threads':
        return '🧵'
      case 'twitter':
        return '🐦'
      case 'instagram':
        return '📸'
      default:
        return '🔗'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="c64-guestbook-content c64-drawer-copy w-full space-y-6 sm:space-y-8">
      {/* Big Button to Show Form */}
      {!isFormVisible && (
        <section className={`${boxClass} p-5 sm:p-6`} aria-label="Leave a message">
          <Button
            onClick={() => setIsFormVisible(true)}
            style="outline"
            color="primary"
            size="large"
            fullWidth
            iconLeft={<PencilSquareIcon className="w-5 h-5" />}
            className="!border-2 !border-[var(--c64-accent)] rounded-none"
          >
            Leave a message on my wall
          </Button>
        </section>
      )}

      {/* Add New Entry Form */}
      {isFormVisible && (
        <section className={`${boxClass} p-5 sm:p-7`} aria-label="New guestbook entry">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={fieldClass}
              placeholder="Enter your name"
              required
              maxLength={100}
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Message
            </label>
            <div className="relative gb-editor">
              <MilkdownEditor
                value={formData.message}
                onChange={(value) => setFormData(prev => ({ ...prev, message: value }))}
                className="min-h-[160px] md:min-h-[200px]"
                allowVideo={false}
              />
            </div>
            {/* Helper text removed per request */}
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Your Social Links (Optional)
            </label>
            <div className="grid grid-cols-2 gap-4">
              {['linkedin', 'threads', 'twitter', 'instagram'].map((platform) => (
                <div key={platform}>
                  <label className="block text-xs text-muted-foreground mb-1 capitalize">
                    {getSocialIcon(platform)} {platform}
                  </label>
                  <Input
                    type="url"
                    value={formData.socialLinks[platform as keyof SocialLinks] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: {
                        ...prev.socialLinks,
                        [platform]: e.target.value
                      }
                    }))}
                    className={fieldClass}
                    placeholder={`https://${platform}.com/yourusername`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="border-4 border-destructive/60 bg-destructive/10 p-4 rounded-none">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          {success && (
            <div className="border-4 border-[var(--c64-accent)]/50 bg-[var(--c64-border-bg)]/40 p-4 rounded-none">
              <div className="text-sm text-[var(--c64-accent)]">{success}</div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => setIsFormVisible(false)}
              style="ghost"
              color="primary"
              size="medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style="solid"
              color="primary"
              size="medium"
              iconLeft={isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
            >
              {isSubmitting ? 'Adding...' : 'Add to Guestbook'}
            </Button>
          </div>
        </form>
        </section>
      )}

      {/* Guestbook Entries */}
      <div className="space-y-6 sm:space-y-8">
        {entries.length === 0 ? (
          <section className={`${boxClass} p-8 text-center`} aria-label="No entries">
            <UserIcon className="h-12 w-12 text-[var(--c64-accent)]/70 mx-auto mb-4" />
            <p className="text-foreground/75">No messages yet. Be the first to leave one! 🎉</p>
          </section>
        ) : (
          entries.map((entry) => {
            const activeSocialLinks = Object.entries(entry.social_links).filter(([, url]) => url)
            const shouldStackSocialLinks = activeSocialLinks.length >= 3

            return (
              <article
                key={entry.id}
                className={`${boxClass} p-5 sm:p-7`}
              >
              {/* Entry Header */}
              <div className="flex items-start mb-5 pb-3 border-b-4 border-[var(--c64-accent)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0 border-2 border-[var(--c64-accent)] bg-[var(--c64-border-bg)]/40 flex items-center justify-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]">
                    <span className="text-[var(--c64-accent)] font-bold">
                      {entry.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-[0.06em] text-[var(--c64-accent)]">
                      {entry.name}
                    </h3>
                    <p className="text-foreground/65 uppercase tracking-wide mt-1">{formatDate(entry.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="c64-prose max-w-none mb-4 text-foreground leading-snug">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-3xl font-bold text-foreground mb-4 mt-6 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--foreground)' }}>{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold mb-3 mt-5 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--accent)' }}>{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-semibold mb-3 mt-4 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--secondary)' }}>{children}</h3>,
                    h4: ({ children }) => <h4 className="text-lg font-semibold text-foreground mb-2 mt-3 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--foreground)' }}>{children}</h4>,
                    h5: ({ children }) => <h5 className="text-base font-semibold text-foreground mb-2 mt-3 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--foreground)' }}>{children}</h5>,
                    h6: ({ children }) => <h6 className="text-sm font-semibold text-foreground mb-2 mt-2 font-[family-name:var(--font-geist-mono)]" style={{ color: 'var(--foreground)' }}>{children}</h6>,
                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">{children}</blockquote>,
                    img: ({ src, alt }) => {
                      if (!src) return null
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={src} 
                          alt={alt || ''} 
                          className="max-w-full h-auto rounded-md my-4"
                          loading="lazy"
                        />
                      )
                    },
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto my-4">
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
                  {entry.message}
                </ReactMarkdown>
              </div>

              {/* Social Links */}
              {activeSocialLinks.length > 0 && (
                <div className="pt-4 border-t-4 border-[var(--c64-accent)]/35">
                  {shouldStackSocialLinks ? (
                    <div className="flex flex-col items-start space-y-2">
                      <span className="text-xs text-[var(--c64-accent)]/85 uppercase tracking-wider">Connect:</span>
                      <div className="flex flex-wrap gap-4">
                        {activeSocialLinks.map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-foreground/70 hover:text-[var(--c64-accent)] transition-colors"
                          >
                            <span>{getSocialIcon(platform)}</span>
                            <span className="text-xs capitalize">{platform}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-[var(--c64-accent)]/85 uppercase tracking-wider">Connect:</span>
                      {activeSocialLinks.map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-foreground/70 hover:text-[var(--c64-accent)] transition-colors"
                        >
                          <span>{getSocialIcon(platform)}</span>
                          <span className="text-xs capitalize">{platform}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
