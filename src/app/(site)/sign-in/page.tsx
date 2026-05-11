'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@headlessui/react'
import { clsx } from 'clsx'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import LevinMediaLogo from '@/app/components/LevinMediaLogo'
import Button from '@/app/components/Button'
import { c64FormFieldClass, c64FormFieldLabelClass } from '@/lib/c64-form-classes'

const c64FieldErrorClass =
  'mt-2 border-2 border-[#ee4444] bg-[var(--c64-border-bg)]/40 px-3 py-2 text-base font-bold uppercase tracking-[0.06em] text-[#ffb4b4]'

const c64FormErrorBannerClass =
  'border-4 border-[#ee4444] bg-[var(--c64-border-bg)]/35 p-4 text-base font-bold uppercase tracking-[0.06em] text-[#ffb4b4]'

function isValidEmail(value: string): boolean {
  const t = value.trim()
  if (!t) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
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

  const validateFields = (): boolean => {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) {
      next.email = 'Email address is required'
    } else if (!isValidEmail(email)) {
      next.email = 'Enter a valid email address'
    }
    if (!password) {
      next.password = 'Password is required'
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateFields()) {
      return
    }

    setIsLoading(true)

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
        setFieldErrors({})
        setError('Server error: Received invalid response. Please check your environment variables.')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setFieldErrors({})
        setError(data.error || 'Login failed')
        return
      }

      if (data.cookie_error) {
        setFieldErrors({})
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
      setFieldErrors({})
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
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className={`${c64FormFieldLabelClass} mb-2`}>
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={fieldErrors.email ? true : undefined}
                  aria-describedby={fieldErrors.email ? 'sign-in-email-error' : undefined}
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                    setFieldErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  className={clsx(c64FormFieldClass, fieldErrors.email && '!border-[#ee4444]')}
                />
                {fieldErrors.email ? (
                  <p id="sign-in-email-error" role="alert" className={c64FieldErrorClass}>
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="password" className={`${c64FormFieldLabelClass} mb-2`}>
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-invalid={fieldErrors.password ? true : undefined}
                    aria-describedby={fieldErrors.password ? 'sign-in-password-error' : undefined}
                    className={clsx(c64FormFieldClass, 'pr-10', fieldErrors.password && '!border-[#ee4444]')}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                      setFieldErrors((prev) => ({ ...prev, password: undefined }))
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--c64-accent)] hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c64-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c64-border-bg)] rounded-none"
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
                {fieldErrors.password ? (
                  <p id="sign-in-password-error" role="alert" className={c64FieldErrorClass}>
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>
            </div>

            {error && (
              <div role="alert" className={c64FormErrorBannerClass}>
                {error}
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
