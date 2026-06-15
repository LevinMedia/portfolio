'use client'

import { useState, useEffect } from 'react'
import { KeyIcon, PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Button from '@/app/components/Button'
import Input from '@/app/components/ui/Input'

/** Shape returned by /api/admin/stats/private-users for merging */
interface PasswordAccessStats {
  id: string
  label: string
  signInCount: number
  pageViewCount: number
  lastSignInAt: string | null
  lastPageViewAt: string | null
  lastPageViewPath: string | null
  pageViews: { path: string; url: string; occurred_at: string }[]
}

interface PasswordAccessEntry {
  id: string
  label: string
  email: string
  username: string
  is_active: boolean
  created_at: string
  last_login: string | null
  signInCount?: number
  pageViewCount?: number
  lastSignInAt?: string | null
  lastPageViewAt?: string | null
  lastPageViewPath?: string | null
  pageViews?: { path: string; url: string; occurred_at: string }[]
}

export default function PasswordAccessAdmin() {
  const [entries, setEntries] = useState<PasswordAccessEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [label, setLabel] = useState('')
  const [password, setPassword] = useState('')
  const [passwordEntryId, setPasswordEntryId] = useState<string | null>(null)
  const [passwordValue, setPasswordValue] = useState('')
  const [revealedPassword, setRevealedPassword] = useState<{ entryId: string; password: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingPasswordId, setUpdatingPasswordId] = useState<string | null>(null)
  const [expandedPagesId, setExpandedPagesId] = useState<string | null>(null)

  const fetchEntries = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/private-users', { credentials: 'same-origin' }),
        fetch('/api/admin/stats/private-users', { credentials: 'same-origin' }),
      ])
      if (usersRes.ok) {
        const list = await usersRes.json()
        const entriesList = Array.isArray(list) ? list : []
        const stats: PasswordAccessStats[] = statsRes.ok ? (await statsRes.json()).users ?? [] : []
        const byId = new Map(stats.map((s) => [s.id, s]))
        const merged: PasswordAccessEntry[] = entriesList.map((entry: PasswordAccessEntry) => {
          const s = byId.get(entry.id)
          return {
            ...entry,
            signInCount: s?.signInCount ?? 0,
            pageViewCount: s?.pageViewCount ?? 0,
            lastSignInAt: s?.lastSignInAt ?? null,
            lastPageViewAt: s?.lastPageViewAt ?? null,
            lastPageViewPath: s?.lastPageViewPath ?? null,
            pageViews: s?.pageViews ?? [],
          }
        })
        setEntries(merged)
      } else {
        setError('Failed to load password access entries')
      }
    } catch {
      setError('Failed to load password access entries')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/private-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setEntries((prev) => [data, ...prev])
        setLabel('')
        setPassword('')
      } else {
        setError(data.error || 'Failed to add password')
      }
    } catch {
      setError('Failed to add password')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const openSetPassword = (entryId: string) => {
    setPasswordEntryId(entryId)
    setPasswordValue('')
    setRevealedPassword(null)
  }

  const closeSetPassword = () => {
    setPasswordEntryId(null)
    setPasswordValue('')
    setRevealedPassword(null)
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordEntryId || passwordValue.length < 8) return
    setUpdatingPasswordId(passwordEntryId)
    setError('')
    try {
      const res = await fetch('/api/admin/private-users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: passwordEntryId, newPassword: passwordValue }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setRevealedPassword({ entryId: passwordEntryId, password: passwordValue })
        setPasswordValue('')
      } else {
        setError(data.error || 'Failed to update password')
      }
    } catch {
      setError('Failed to update password')
    } finally {
      setUpdatingPasswordId(null)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!confirm('Delete this password? It will no longer grant access to private featured work.')) return
    setDeletingId(entryId)
    setError('')
    try {
      const res = await fetch(`/api/admin/private-users?id=${encodeURIComponent(entryId)}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
        closeSetPassword()
      } else {
        setError(data.error || 'Failed to delete password')
      }
    } catch {
      setError('Failed to delete password')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground font-[family-name:var(--font-geist-mono)]">
          Password Access
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create labeled passwords for private featured work. Share{' '}
          <span className="font-mono">/access</span> with viewers — they only need the password.
        </p>
      </div>

      <section className="border border-border/20 bg-background p-6 rounded-none">
        <h2 className="text-sm font-medium text-foreground mb-4">Add password</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <Input
            label="Label"
            type="text"
            required
            placeholder="e.g. Acme hiring team"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-none"
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={8}
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-none"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            style="solid"
            color="primary"
            size="medium"
            disabled={isSubmitting}
            iconLeft={<PlusIcon className="w-4 h-4" />}
          >
            {isSubmitting ? 'Adding…' : 'Add password'}
          </Button>
        </form>
      </section>

      <section className="border border-border/20 bg-background p-6 rounded-none">
        <h2 className="text-sm font-medium text-foreground mb-4">Password access</h2>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No passwords yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-border/20">
            {entries.map((entry) => (
              <li key={entry.id} className="py-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-foreground">{entry.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {formatDate(entry.created_at)}
                      {entry.last_login ? ` · Last sign-in ${formatDate(entry.last_login)}` : ''}
                      {(entry.signInCount ?? 0) > 0 && (
                        <>
                          {' '}
                          · {entry.signInCount} sign-in{(entry.signInCount ?? 0) !== 1 ? 's' : ''} ·{' '}
                          {entry.pageViewCount ?? 0} page view
                          {(entry.pageViewCount ?? 0) !== 1 ? 's' : ''}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!entry.is_active && (
                      <span className="text-xs text-muted-foreground">Inactive</span>
                    )}
                    <Button
                      type="button"
                      style="outline"
                      color="primary"
                      size="small"
                      onClick={() => openSetPassword(entry.id)}
                      iconLeft={<KeyIcon className="w-4 h-4" />}
                    >
                      Set password
                    </Button>
                    <Button
                      type="button"
                      style="outline"
                      color="destructive"
                      size="small"
                      disabled={deletingId === entry.id}
                      onClick={() => handleDelete(entry.id)}
                      iconLeft={<TrashIcon className="w-4 h-4" />}
                    >
                      {deletingId === entry.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setExpandedPagesId(expandedPagesId === entry.id ? null : entry.id)}
                  >
                    {expandedPagesId === entry.id ? (
                      <ChevronDownIcon className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    )}
                    Pages viewed ({entry.pageViewCount ?? 0})
                  </button>
                  {expandedPagesId === entry.id &&
                    ((entry.pageViews?.length ?? 0) > 0 ? (
                      <ul className="mt-2 ml-4 space-y-1 max-h-40 overflow-y-auto text-xs">
                        {(entry.pageViews ?? []).map((pv, i) => (
                          <li key={i} className="flex justify-between gap-4">
                            <a
                              href={pv.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-foreground hover:underline font-mono"
                            >
                              {pv.url}
                            </a>
                            <span className="text-muted-foreground shrink-0">
                              {new Date(pv.occurred_at).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 ml-4 text-xs text-muted-foreground">
                        No page views recorded yet.
                      </p>
                    ))}
                </div>
                {passwordEntryId === entry.id && (
                  <div className="mt-3 pt-3 border-t border-border/20">
                    {revealedPassword?.entryId === entry.id ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-foreground">Password set. Copy it:</span>
                        <code className="px-2 py-1 bg-muted text-foreground text-sm font-mono rounded">
                          {revealedPassword.password}
                        </code>
                        <Button
                          type="button"
                          style="ghost"
                          color="primary"
                          size="small"
                          onClick={() => closeSetPassword()}
                        >
                          Done
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSetPassword} className="flex items-end gap-2 flex-wrap">
                        <div className="min-w-[200px]">
                          <Input
                            label="New password"
                            type="password"
                            required
                            minLength={8}
                            placeholder="Min 8 characters"
                            value={passwordValue}
                            onChange={(e) => setPasswordValue(e.target.value)}
                            className="rounded-none"
                          />
                        </div>
                        <Button
                          type="submit"
                          style="solid"
                          color="primary"
                          size="small"
                          disabled={updatingPasswordId === entry.id || passwordValue.length < 8}
                        >
                          {updatingPasswordId === entry.id ? 'Saving…' : 'Save & show password'}
                        </Button>
                        <Button
                          type="button"
                          style="ghost"
                          color="primary"
                          size="small"
                          onClick={closeSetPassword}
                        >
                          Cancel
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
