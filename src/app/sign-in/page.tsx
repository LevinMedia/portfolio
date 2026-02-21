'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import LevinMediaLogo from '@/app/components/LevinMediaLogo'
import Button from '@/app/components/Button'
import Input from '@/app/components/ui/Input'
import { ParticleBackground } from '@/app/components/ParticleBackground'

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
    <div className="relative h-dvh min-h-screen overflow-hidden font-[family-name:var(--font-geist-sans)] bg-background text-foreground">
      {/* Particle background - same as home page */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <ParticleBackground />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(rgba(115, 115, 115, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.06) 1px, transparent 1px),
            repeating-linear-gradient(90deg, 
              rgba(0, 100, 255, 0.015) 0, 
              rgba(0, 100, 255, 0.015) calc((100% - 5 * var(--grid-major)) / 6), 
              transparent calc((100% - 5 * var(--grid-major)) / 6), 
              transparent calc((100% - 5 * var(--grid-major)) / 6 + var(--grid-major))
            )
          `,
          backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), 100% 100%',
          backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), 0 0'
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center px-4 py-4 sm:px-6 sm:py-12 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="sm:hidden">
            <LevinMediaLogo size={28} fillBackground />
          </div>
          <div className="hidden sm:block">
            <LevinMediaLogo size={52} fillBackground />
          </div>
          <h2 className="text-2xl sm:text-5xl font-extrabold tracking-wide text-foreground font-[family-name:var(--font-geist-mono)]">
            LevinMedia
          </h2>
        </div>

        <div className="bg-background border border-border/20 rounded-none p-8 shadow-lg" style={{
          backgroundImage: `
            linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
          backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
        }}>
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
