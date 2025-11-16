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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Big Button to Show Form */}
      {!isFormVisible && (
        <Button
          onClick={() => setIsFormVisible(true)}
          style="outline"
          color="primary"
          size="large"
          fullWidth
          iconLeft={<PencilSquareIcon className="w-5 h-5" />}
        >
          Leave a message on my wall
        </Button>
      )}

      {/* Add New Entry Form */}
      {isFormVisible && (
        <div className="bg-background border border-border/20 rounded-lg p-6 shadow-lg" style={{ 
        backgroundImage: `
          linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
        backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
      }}>
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
              className="block w-full px-3 py-2 border border-border shadow-sm placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
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
                    className="block w-full px-3 py-2 border border-border shadow-sm placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                    placeholder={`https://${platform}.com/yourusername`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 border border-green-200 p-4">
              <div className="text-sm text-green-800">{success}</div>
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
      </div>
      )}

      {/* Guestbook Entries */}
      <div className="space-y-6">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No messages yet. Be the first to leave one! 🎉</p>
          </div>
        ) : (
          entries.map((entry) => {
            const activeSocialLinks = Object.entries(entry.social_links).filter(([, url]) => url)
            const shouldStackSocialLinks = activeSocialLinks.length >= 3

            return (
              <div
                key={entry.id}
                className="bg-background border border-border/20 p-6"
                style={{
                backgroundImage: `
                  linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
                backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
              }}
              >
              {/* Entry Header */}
              <div className="flex items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {entry.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{entry.name}</h3>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="prose prose-sm max-w-none mb-4 text-foreground">
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
                <div className="pt-4 border-t border-border/20">
                  {shouldStackSocialLinks ? (
                    <div className="flex flex-col items-start space-y-2">
                      <span className="text-xs text-muted-foreground">Connect:</span>
                      <div className="flex flex-wrap gap-4">
                        {activeSocialLinks.map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <span>{getSocialIcon(platform)}</span>
                            <span className="text-xs capitalize">{platform}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-muted-foreground">Connect:</span>
                      {activeSocialLinks.map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <span>{getSocialIcon(platform)}</span>
                          <span className="text-xs capitalize">{platform}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
