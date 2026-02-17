'use client'

import { useState, useEffect } from 'react'
import { UserPlusIcon, KeyIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Button from '@/app/components/Button'
import Input from '@/app/components/ui/Input'

interface PrivateUser {
  id: string
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
  pageViews?: { path: string; occurred_at: string }[]
}

export default function PrivateUsersAdmin() {
  const [users, setUsers] = useState<PrivateUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null)
  const [passwordValue, setPasswordValue] = useState('')
  const [revealedPassword, setRevealedPassword] = useState<{ userId: string; password: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingPasswordId, setUpdatingPasswordId] = useState<string | null>(null)
  const [expandedPagesId, setExpandedPagesId] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/private-users', { credentials: 'same-origin' }),
        fetch('/api/admin/stats/private-users', { credentials: 'same-origin' }),
      ])
      if (usersRes.ok) {
        const list = await usersRes.json()
        const usersList = Array.isArray(list) ? list : []
        const stats = statsRes.ok ? (await statsRes.json()).users ?? [] : []
        const byId = new Map(stats.map((s: { id: string }) => [s.id, s]))
        const merged: PrivateUser[] = usersList.map((u: PrivateUser) => {
          const s = byId.get(u.id)
          return {
            ...u,
            signInCount: s?.signInCount ?? 0,
            pageViewCount: s?.pageViewCount ?? 0,
            lastSignInAt: s?.lastSignInAt ?? null,
            lastPageViewAt: s?.lastPageViewAt ?? null,
            lastPageViewPath: s?.lastPageViewPath ?? null,
            pageViews: s?.pageViews ?? [],
          }
        })
        setUsers(merged)
      } else {
        setError('Failed to load private users')
      }
    } catch {
      setError('Failed to load private users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/private-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setUsers(prev => [data, ...prev])
        setEmail('')
        setPassword('')
      } else {
        setError(data.error || 'Failed to add user')
      }
    } catch {
      setError('Failed to add user')
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

  const openSetPassword = (userId: string) => {
    setPasswordUserId(userId)
    setPasswordValue('')
    setRevealedPassword(null)
  }

  const closeSetPassword = () => {
    setPasswordUserId(null)
    setPasswordValue('')
    setRevealedPassword(null)
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordUserId || passwordValue.length < 8) return
    setUpdatingPasswordId(passwordUserId)
    setError('')
    try {
      const res = await fetch('/api/admin/private-users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: passwordUserId, newPassword: passwordValue }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setRevealedPassword({ userId: passwordUserId, password: passwordValue })
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

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this private user? They will no longer be able to sign in.')) return
    setDeletingId(userId)
    setError('')
    try {
      const res = await fetch(`/api/admin/private-users?id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        closeSetPassword()
      } else {
        setError(data.error || 'Failed to delete user')
      }
    } catch {
      setError('Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground font-[family-name:var(--font-geist-mono)]">
          Private Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add users who can sign in to access private featured works. They will not see the admin panel.
        </p>
      </div>

      <section className="border border-border/20 bg-background p-6 rounded-none">
        <h2 className="text-sm font-medium text-foreground mb-4">Add private user</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <Input
            label="Email"
            type="email"
            required
            placeholder="viewer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button
            type="submit"
            style="solid"
            color="primary"
            size="medium"
            disabled={isSubmitting}
            iconLeft={<UserPlusIcon className="w-4 h-4" />}
          >
            {isSubmitting ? 'Adding…' : 'Add user'}
          </Button>
        </form>
      </section>

      <section className="border border-border/20 bg-background p-6 rounded-none">
        <h2 className="text-sm font-medium text-foreground mb-4">Private users</h2>
        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No private users yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-border/20">
            {users.map((user) => (
              <li key={user.id} className="py-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {formatDate(user.created_at)}
                      {user.last_login ? ` · Last sign-in ${formatDate(user.last_login)}` : ''}
                      {(user.signInCount ?? 0) > 0 && (
                        <> · {user.signInCount} sign-in{(user.signInCount ?? 0) !== 1 ? 's' : ''} · {user.pageViewCount ?? 0} page view{(user.pageViewCount ?? 0) !== 1 ? 's' : ''}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!user.is_active && (
                      <span className="text-xs text-muted-foreground">Inactive</span>
                    )}
                    <Button
                      type="button"
                      style="outline"
                      color="primary"
                      size="small"
                      onClick={() => openSetPassword(user.id)}
                      iconLeft={<KeyIcon className="w-4 h-4" />}
                    >
                      Set password
                    </Button>
                    <Button
                      type="button"
                      style="outline"
                      color="destructive"
                      size="small"
                      disabled={deletingId === user.id}
                      onClick={() => handleDelete(user.id)}
                      iconLeft={<TrashIcon className="w-4 h-4" />}
                    >
                      {deletingId === user.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setExpandedPagesId(expandedPagesId === user.id ? null : user.id)}
                  >
                    {expandedPagesId === user.id ? (
                      <ChevronDownIcon className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    )}
                    Pages viewed ({user.pageViewCount ?? 0})
                  </button>
                  {expandedPagesId === user.id && (
                    (user.pageViews?.length ?? 0) > 0 ? (
                      <ul className="mt-2 ml-4 space-y-1 max-h-40 overflow-y-auto text-xs">
                        {(user.pageViews ?? []).map((pv, i) => (
                          <li key={i} className="flex justify-between gap-4 font-mono">
                            <span className="truncate text-foreground">{pv.path}</span>
                            <span className="text-muted-foreground shrink-0">{new Date(pv.occurred_at).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 ml-4 text-xs text-muted-foreground">No page views recorded yet.</p>
                    )
                  )}
                </div>
                {passwordUserId === user.id && (
                  <div className="mt-3 pt-3 border-t border-border/20">
                    {revealedPassword?.userId === user.id ? (
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
                          disabled={updatingPasswordId === user.id || passwordValue.length < 8}
                        >
                          {updatingPasswordId === user.id ? 'Saving…' : 'Save & show password'}
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
