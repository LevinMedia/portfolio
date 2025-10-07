'use client'

import { useState, useEffect } from 'react'
import { HeartIcon, PaperAirplaneIcon, UserIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
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
  const [likedEntries, setLikedEntries] = useState<Set<string>>(new Set())
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


  // Handle like toggle
  const toggleLike = (entryId: string) => {
    setLikedEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
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
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
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
            <div className="relative">
              <MilkdownEditor
                value={formData.message}
                onChange={(value) => setFormData(prev => ({ ...prev, message: value }))}
                className="min-h-[200px]"
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                {formData.message.length}/5000 characters • Use / for formatting commands
              </p>
              <div className="flex space-x-2 text-xs text-muted-foreground">
                <span>Type / for commands</span>
                <span>Ctrl+B for bold</span>
                <span>Ctrl+I for italic</span>
              </div>
            </div>
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
                  <input
                    type="url"
                    value={formData.socialLinks[platform as keyof SocialLinks] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: {
                        ...prev.socialLinks,
                        [platform]: e.target.value
                      }
                    }))}
                    className="block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
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
            <button
              type="button"
              onClick={() => setIsFormVisible(false)}
              className="px-6 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Add to Guestbook
                </>
              )}
            </button>
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
          entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-background border border-border/20 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
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
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {entry.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{entry.name}</h3>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleLike(entry.id)}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  {likedEntries.has(entry.id) ? (
                    <HeartSolidIcon className="h-5 w-5 text-red-500" />
                  ) : (
                    <HeartIcon className="h-5 w-5" />
                  )}
                  <span className="text-sm">
                    {likedEntries.has(entry.id) ? 'Liked!' : 'Like'}
                  </span>
                </button>
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
              {Object.entries(entry.social_links).some(([, url]) => url) && (
                <div className="flex items-center space-x-4 pt-4 border-t border-border/20">
                  <span className="text-xs text-muted-foreground">Connect:</span>
                  {Object.entries(entry.social_links).map(([platform, url]) => 
                    url && (
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
                    )
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
