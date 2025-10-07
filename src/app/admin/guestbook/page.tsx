'use client'

import { useState, useEffect } from 'react'
import { TrashIcon, CheckIcon, XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  is_approved: boolean
  created_at: string
  updated_at: string
}

export default function GuestbookAdmin() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Fetch all guestbook entries
  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/admin/guestbook')
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

  // Update entry approval status
  const updateEntryStatus = async (entryId: string, isApproved: boolean) => {
    setIsUpdating(entryId)
    try {
      const response = await fetch('/api/admin/guestbook', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entryId, isApproved }),
      })

      const data = await response.json()

      if (response.ok) {
        setEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, is_approved: isApproved, updated_at: new Date().toISOString() }
            : entry
        ))
      } else {
        setError(data.error || 'Failed to update entry')
      }
    } catch {
      setError('Failed to update entry')
    } finally {
      setIsUpdating(null)
    }
  }

  // Delete entry
  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return
    }

    setIsUpdating(entryId)
    try {
      const response = await fetch(`/api/admin/guestbook?entryId=${entryId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setEntries(prev => prev.filter(entry => entry.id !== entryId))
      } else {
        setError(data.error || 'Failed to delete entry')
      }
    } catch {
      setError('Failed to delete entry')
    } finally {
      setIsUpdating(null)
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">Guestbook Management</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">Guestbook Management</h1>
        <div className="text-sm text-muted-foreground">
          {entries.length} total entries
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-background border border-border/20 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">No Guestbook Entries</h3>
          <p className="text-muted-foreground">No entries have been submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`bg-background border rounded-lg p-6 shadow-lg ${
                entry.is_approved 
                  ? 'border-border/20' 
                  : 'border-yellow-500/50 bg-yellow-50/50'
              }`}
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
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.created_at)}
                      {entry.updated_at !== entry.created_at && (
                        <span className="ml-2">• Updated {formatDate(entry.updated_at)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Approval Status */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    entry.is_approved
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {entry.is_approved ? (
                      <>
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Approved
                      </>
                    ) : (
                      <>
                        <EyeSlashIcon className="h-3 w-3 mr-1" />
                        Pending
                      </>
                    )}
                  </span>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1">
                    {!entry.is_approved && (
                      <button
                        onClick={() => updateEntryStatus(entry.id, true)}
                        disabled={isUpdating === entry.id}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                        title="Approve entry"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    )}
                    {entry.is_approved && (
                      <button
                        onClick={() => updateEntryStatus(entry.id, false)}
                        disabled={isUpdating === entry.id}
                        className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-md transition-colors disabled:opacity-50"
                        title="Reject entry"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      disabled={isUpdating === entry.id}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Delete entry"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
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
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-sm font-mono text-foreground">
                        {children}
                      </pre>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline"
                      >
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
                  <span className="text-xs text-muted-foreground">Social Links:</span>
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
          ))}
        </div>
      )}
    </div>
  )
}
