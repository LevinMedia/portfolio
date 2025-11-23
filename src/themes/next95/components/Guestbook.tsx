'use client'

import { useState, useEffect } from 'react'
import { PaperAirplaneIcon, UserIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { Input } from '@headlessui/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MilkdownEditor from '@/app/components/MilkdownEditor'

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
        <div className="text-sm text-[#111]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Big Button to Show Form */}
      {!isFormVisible && (
        <button
          onClick={() => setIsFormVisible(true)}
          className="w-full px-4 py-3 text-sm text-[#000] font-bold flex items-center justify-center gap-2"
          style={{
            background: '#A7A7A7',
            boxShadow: '-4px -4px 0 0 rgba(0, 0, 0, 0.50) inset, 4px 4px 0 0 rgba(255, 255, 255, 0.50) inset'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#B1B1B1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#A7A7A7';
          }}
        >
          <PencilSquareIcon className="w-5 h-5" />
          Leave a message on my wall
        </button>
      )}

      {/* Add New Entry Form */}
      {isFormVisible && (
        <div className="bg-white border-2 border-[#808080] p-4 @container">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-[#111] mb-1">
              Your Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="block w-full px-2 py-1 border-2 border-[#808080] text-sm text-[#111] bg-white focus:outline-none focus:border-[#0000ff]"
              placeholder="Enter your name"
              required
              maxLength={100}
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-xs font-bold text-[#111] mb-1">
              Your Message
            </label>
            <div className="relative gb-editor">
              <style jsx global>{`
                .gb-editor .crepe-editor {
                  border: 2px solid #808080 !important;
                  border-radius: 0 !important;
                  background-color: white !important;
                  background: white !important;
                }
                .gb-editor .milkdown,
                .gb-editor .milkdown-theme-nord,
                .gb-editor .editor,
                .gb-editor [contenteditable],
                .gb-editor .ProseMirror {
                  background-color: white !important;
                  background: white !important;
                }
                /* Slash menu styling */
                .milkdown-slash-menu,
                .milkdown-slash-menu * {
                  background-color: white !important;
                  background: white !important;
                  border: 2px solid #808080 !important;
                  border-radius: 0 !important;
                }
                .milkdown-slash-menu [role="menuitem"],
                .milkdown-slash-menu button {
                  background-color: white !important;
                  color: #000 !important;
                  border-radius: 0 !important;
                }
                .milkdown-slash-menu [role="menuitem"]:hover,
                .milkdown-slash-menu [role="menuitem"][data-active="true"],
                .milkdown-slash-menu button:hover {
                  background-color: #000080 !important;
                  color: white !important;
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
            <label className="block text-xs font-bold text-[#111] mb-2">
              Your Social Links (Optional)
            </label>
            <div className="grid grid-cols-1 @[400px]:grid-cols-2 gap-3">
              {['linkedin', 'threads', 'twitter', 'instagram'].map((platform) => (
                <div key={platform}>
                  <label className="block text-xs text-[#666] mb-1 capitalize">
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
                    className="block w-full px-2 py-1 border-2 border-[#808080] text-xs text-[#111] bg-white focus:outline-none focus:border-[#0000ff]"
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

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormVisible(false)}
              className="px-4 py-2 text-sm text-[#000] font-bold"
              style={{
                background: '#A7A7A7',
                boxShadow: '-4px -4px 0 0 rgba(0, 0, 0, 0.50) inset, 4px 4px 0 0 rgba(255, 255, 255, 0.50) inset'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#B1B1B1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#A7A7A7';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-[#000] font-bold flex items-center gap-2"
              style={{
                background: isSubmitting ? '#969696' : '#A7A7A7',
                boxShadow: isSubmitting 
                  ? '-4px -4px 0 0 rgba(255, 255, 255, 0.50) inset, 4px 4px 0 0 rgba(0, 0, 0, 0.50) inset'
                  : '-4px -4px 0 0 rgba(0, 0, 0, 0.50) inset, 4px 4px 0 0 rgba(255, 255, 255, 0.50) inset'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = '#B1B1B1';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = '#A7A7A7';
                }
              }}
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
            </button>
          </div>
        </form>
      </div>
      )}

      {/* Guestbook Entries */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-white border-2 border-[#808080] p-4">
            <UserIcon className="h-12 w-12 text-[#666] mx-auto mb-4" />
            <p className="text-[#666]">No messages yet. Be the first to leave one! 🎉</p>
          </div>
        ) : (
          entries.map((entry) => {
            const activeSocialLinks = Object.entries(entry.social_links).filter(([, url]) => url)
            const shouldStackSocialLinks = activeSocialLinks.length >= 3

            return (
              <div
                key={entry.id}
                className="bg-white border-2 border-[#808080] p-3"
              >
              {/* Entry Header */}
              <div className="flex items-start mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-[#0000ff] flex items-center justify-center border-2 border-[#000]">
                    <span className="text-white font-bold text-sm">
                      {entry.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#111]">{entry.name}</h3>
                    <p className="text-xs text-[#666]">{formatDate(entry.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="prose prose-sm max-w-none mb-3 text-[#111]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-lg font-bold text-[#111] mb-2 mt-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold text-[#111] mb-2 mt-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold text-[#111] mb-2 mt-2">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-bold text-[#111] mb-1 mt-2">{children}</h4>,
                    h5: ({ children }) => <h5 className="text-sm font-bold text-[#111] mb-1 mt-2">{children}</h5>,
                    h6: ({ children }) => <h6 className="text-xs font-bold text-[#111] mb-1 mt-1">{children}</h6>,
                    p: ({ children }) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-sm">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">{children}</ol>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-[#0000ff] pl-3 italic text-[#666] my-2 text-sm">{children}</blockquote>,
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
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#0000ff] underline hover:text-[#ff00ff]">
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
                <div className="pt-2 border-t-2 border-[#808080]">
                  {shouldStackSocialLinks ? (
                    <div className="flex flex-col items-start space-y-1">
                      <span className="text-xs text-[#666] font-bold">Connect:</span>
                      <div className="flex flex-wrap gap-2">
                        {activeSocialLinks.map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-[#0000ff] hover:text-[#ff00ff] transition-colors"
                          >
                            <span>{getSocialIcon(platform)}</span>
                            <span className="text-xs capitalize underline">{platform}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-[#666] font-bold">Connect:</span>
                      {activeSocialLinks.map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-[#0000ff] hover:text-[#ff00ff] transition-colors"
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
