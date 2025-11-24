'use client'

import { useState, useEffect } from 'react'
import { PaperAirplaneIcon, UserIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { Input } from '@headlessui/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MilkdownEditor from '@/app/components/MilkdownEditor'
import Next95Button from './Next95Button'

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
        <div className="text-sm" style={{ color: 'var(--win95-content-text, #111)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Big Button to Show Form */}
      {!isFormVisible && (
        <Next95Button
          onClick={() => setIsFormVisible(true)}
          className="w-full flex items-center justify-center gap-2 py-3 text-base font-bold"
        >
          <PencilSquareIcon className="w-5 h-5" />
          Leave a message on my wall
        </Next95Button>
      )}

      {/* Add New Entry Form */}
      {isFormVisible && (
        <>
        <div 
          className="border-2 p-4 @container"
          style={{
            backgroundColor: 'var(--win95-content-bg, #ffffff)',
            borderColor: 'var(--win95-border-mid, #808080)',
            color: 'var(--win95-content-text, #000000)'
          }}
        >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--win95-content-text, #111)' }}>
              Your Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="block w-full px-2 py-1 border-2 text-sm focus:outline-none"
              style={{
                borderColor: 'var(--win95-border-mid, #808080)',
                backgroundColor: 'var(--win95-content-bg, #ffffff)',
                color: 'var(--win95-content-text, #111)'
              }}
              placeholder="Enter your name"
              required
              maxLength={100}
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--win95-content-text, #111)' }}>
              Your Message
            </label>
            <div className="relative gb-editor">
              <style jsx global>{`
                .gb-editor .crepe-editor {
                  border: 2px solid var(--win95-border-mid, #808080) !important;
                  border-radius: 0 !important;
                  background-color: var(--win95-content-bg, white) !important;
                  background: var(--win95-content-bg, white) !important;
                  color: var(--win95-content-text, #000) !important;
                  outline: none !important;
                  box-shadow: inset -2px -2px 0 0 var(--win95-border-light, #fff), inset 2px 2px 0 0 var(--win95-border-dark, #000) !important;
                }
                .gb-editor .crepe-editor:focus,
                .gb-editor .crepe-editor:focus-within {
                  border: 2px solid var(--win95-border-mid, #808080) !important;
                  outline: none !important;
                  box-shadow: inset -2px -2px 0 0 var(--win95-border-light, #fff), inset 2px 2px 0 0 var(--win95-border-dark, #000) !important;
                }
                .gb-editor .milkdown,
                .gb-editor .milkdown-theme-nord,
                .gb-editor .editor,
                .gb-editor [contenteditable],
                .gb-editor .ProseMirror,
                .gb-editor .ProseMirror *,
                .gb-editor .ProseMirror p,
                .gb-editor .ProseMirror div,
                .gb-editor .ProseMirror span {
                  background-color: var(--win95-content-bg, white) !important;
                  background: var(--win95-content-bg, white) !important;
                  color: var(--win95-content-text, #000) !important;
                }
                .gb-editor .ProseMirror::placeholder,
                .gb-editor .ProseMirror .placeholder,
                .gb-editor [contenteditable]::placeholder,
                .gb-editor [data-placeholder]::before {
                  color: var(--win95-content-text, #666) !important;
                  opacity: 0.5 !important;
                }
                /* Slash menu styling */
                .milkdown-slash-menu {
                  background-color: var(--win95-content-bg, white) !important;
                  background: var(--win95-content-bg, white) !important;
                  border: 2px solid var(--win95-border-mid, #808080) !important;
                  border-radius: 0 !important;
                  box-shadow: inset -2px -2px 0 0 var(--win95-border-dark, #000), inset 2px 2px 0 0 var(--win95-border-light, #fff) !important;
                  padding: 0 !important;
                }
                .milkdown-slash-menu *,
                .milkdown-slash-menu > *,
                .milkdown-slash-menu div,
                .milkdown-slash-menu [role="menu"],
                .milkdown-slash-menu svg,
                .milkdown-slash-menu span {
                  border: none !important;
                  border-radius: 0 !important;
                  background: transparent !important;
                  box-shadow: none !important;
                }
                .milkdown-slash-menu [role="menuitem"],
                .milkdown-slash-menu button {
                  background-color: transparent !important;
                  background: transparent !important;
                  color: var(--win95-content-text, #000) !important;
                  border-radius: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  padding: 8px 12px !important;
                  font-weight: 600 !important;
                }
                .milkdown-slash-menu [role="menuitem"] svg,
                .milkdown-slash-menu button svg {
                  color: var(--win95-content-text, #000) !important;
                  fill: currentColor !important;
                  stroke: currentColor !important;
                }
                .milkdown-slash-menu [role="menuitem"]:hover,
                .milkdown-slash-menu [role="menuitem"][data-active="true"],
                .milkdown-slash-menu button:hover {
                  background-color: var(--next95-primary, #000080) !important;
                  background: var(--next95-primary, #000080) !important;
                  color: white !important;
                }
                .milkdown-slash-menu [role="menuitem"]:hover svg,
                .milkdown-slash-menu [role="menuitem"][data-active="true"] svg,
                .milkdown-slash-menu button:hover svg {
                  color: white !important;
                  fill: currentColor !important;
                  stroke: currentColor !important;
                }
              `}</style>
              <MilkdownEditor
                value={formData.message}
                onChange={(value) => setFormData(prev => ({ ...prev, message: value }))}
                className="min-h-[160px] @[600px]:min-h-[200px]"
                allowVideo={false}
                placeholder="Holla atcha boi"
              />
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: 'var(--win95-content-text, #111)' }}>
              Your Social Links (Optional)
            </label>
            <div className="grid grid-cols-1 @[400px]:grid-cols-2 gap-3">
              {['linkedin', 'threads', 'twitter', 'instagram'].map((platform) => (
                <div key={platform}>
                  <label className="block text-xs mb-1 capitalize" style={{ color: 'var(--win95-content-text, #666)' }}>
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
                    className="block w-full px-2 py-1 border-2 text-xs focus:outline-none"
                    style={{
                      borderColor: 'var(--win95-border-mid, #808080)',
                      backgroundColor: 'var(--win95-content-bg, #ffffff)',
                      color: 'var(--win95-content-text, #111)'
                    }}
                    placeholder={`https://${platform}.com/yourusername`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-[#ffcccc] border-2 border-[#ff0000] p-2">
              <div className="text-sm text-[#cc0000] font-bold">{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-[#ccffcc] border-2 border-[#00cc00] p-2">
              <div className="text-sm text-[#006600] font-bold">{success}</div>
            </div>
          )}
        </form>
      </div>

      {/* Submit Buttons - Outside form in chrome area */}
      <div className="flex justify-end gap-2">
        <Next95Button
          type="button"
          onClick={() => setIsFormVisible(false)}
          className="min-w-[110px] justify-center"
        >
          Cancel
        </Next95Button>
        <Next95Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="min-w-[160px] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              Adding...
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="h-4 w-4" />
              Add to Guestbook
            </>
          )}
        </Next95Button>
      </div>
      </> 
      )}

      {/* Guestbook Entries */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div 
            className="text-center py-12 border-2 p-4"
            style={{
              backgroundColor: 'var(--win95-content-bg, #ffffff)',
              borderColor: 'var(--win95-border-mid, #808080)',
              color: 'var(--win95-content-text, #666)'
            }}
          >
            <UserIcon className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--win95-content-text, #666)' }} />
            <p>No messages yet. Be the first to leave one! 🎉</p>
          </div>
        ) : (
          entries.map((entry) => {
            const activeSocialLinks = Object.entries(entry.social_links).filter(([, url]) => url)
            const shouldStackSocialLinks = activeSocialLinks.length >= 3

            return (
              <div
                key={entry.id}
                className="border-2 p-3"
                style={{
                  backgroundColor: 'var(--win95-content-bg, #ffffff)',
                  borderColor: 'var(--win95-border-mid, #808080)',
                  color: 'var(--win95-content-text, #000000)'
                }}
              >
              {/* Entry Header */}
              <div className="flex items-start mb-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-10 h-10 flex items-center justify-center border-2"
                    style={{
                      backgroundColor: 'var(--next95-primary, #0000ff)',
                      borderColor: 'var(--win95-text, #000)'
                    }}
                  >
                    <span className="text-white font-bold text-sm">
                      {entry.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--win95-content-text, #111)' }}>{entry.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--win95-content-text, #666)' }}>{formatDate(entry.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="prose prose-sm max-w-none mb-3" style={{ color: 'var(--win95-content-text, #111)' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-2" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-bold mb-1 mt-2" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h4>,
                    h5: ({ children }) => <h5 className="text-sm font-bold mb-1 mt-2" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h5>,
                    h6: ({ children }) => <h6 className="text-xs font-bold mb-1 mt-1" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h6>,
                    p: ({ children }) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-sm">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">{children}</ol>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 pl-3 italic my-2 text-sm" style={{ borderColor: 'var(--next95-primary, #0000ff)', color: 'var(--win95-content-text, #666)' }}>{children}</blockquote>,
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
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--next95-primary)] underline hover:text-[var(--next95-secondary)]">
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
                <div className="pt-2 border-t-2" style={{ borderColor: 'var(--win95-border-mid, #808080)' }}>
                  {shouldStackSocialLinks ? (
                    <div className="flex flex-col items-start space-y-1">
                      <span className="text-xs font-bold" style={{ color: 'var(--win95-content-text, #666)' }}>Connect:</span>
                      <div className="flex flex-wrap gap-2">
                        {activeSocialLinks.map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 transition-colors"
                            style={{ color: 'var(--next95-primary, #0000ff)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--next95-secondary').trim() || '#ff00ff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--next95-primary').trim() || '#0000ff'}
                          >
                            <span>{getSocialIcon(platform)}</span>
                            <span className="text-xs capitalize underline">{platform}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold" style={{ color: 'var(--win95-content-text, #666)' }}>Connect:</span>
                      {activeSocialLinks.map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-[var(--next95-primary)] hover:text-[var(--next95-secondary)] transition-colors"
                        >
                          <span>{getSocialIcon(platform)}</span>
                          <span className="text-xs capitalize underline">{platform}</span>
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
