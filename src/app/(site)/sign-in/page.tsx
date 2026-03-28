'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import LevinMediaLogo from '@/app/components/LevinMediaLogo'
import Button from '@/app/components/Button'
import Input from '@/app/components/ui/Input'
export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if admin user exists, if not redirect to secure setup
    const checkAdminExists = async () => {
      try {
        const response = await fetch('/api/admin/secure-setup')
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          return
        }
        const data = await response.json()
        if (response.ok && !data.setupCompleted) {
          router.push('/admin/secure-setup')
        }
      } catch {
        // ignore
      }
    }

    checkAdminExists()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        setError('Server error: Received invalid response. Please check your environment variables.')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      if (data.cookie_error) {
        setError(data.cookie_error)
        return
      }
      sessionStorage.setItem('admin_user', JSON.stringify(data))
      if (data.access_role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--c64-screen-bg)] text-foreground">
      <div className="absolute inset-0 z-0 pointer-events-none c64-screen-grid opacity-60" aria-hidden />

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="sm:hidden">
            <LevinMediaLogo size={28} fillBackground />
          </div>
          <div className="hidden sm:block">
            <LevinMediaLogo size={52} fillBackground />
          </div>
          <h2 className="text-2xl sm:text-5xl font-bold tracking-wide text-foreground">
            LevinMedia
          </h2>
        </div>

        <div className="bg-[var(--c64-border-bg)] border-4 border-[var(--c64-accent)] c64-petscii-frame p-8 c64-screen-grid">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Email Address"
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-none"
              />
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full px-3 py-2 pr-10 border border-border rounded-none shadow-sm placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded-r-md"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-none bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              style="solid"
              color="primary"
              size="large"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
      </div>
    </div>
  )
}
