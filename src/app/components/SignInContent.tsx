'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@headlessui/react'
import type { PortfolioCoverImage } from '@/lib/portfolio-cover-images-server'
import SignInCoverGrid from './SignInCoverGrid'
import { clsx } from 'clsx'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { C64SpriteLoader } from './C64SpriteLoader'
import { c64FormFieldClass, c64FormFieldLabelClass } from '@/lib/c64-form-classes'
import {
  c64DrawerBtnSelectedClass,
  c64DrawerHintClass,
  c64DrawerSectionHeadingClass,
} from '@/lib/c64-drawer-classes'

function isValidEmail(value: string): boolean {
  const t = value.trim()
  if (!t) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

type SignInContentProps = {
  coverImages: PortfolioCoverImage[]
}

export default function SignInContent({ coverImages }: SignInContentProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const router = useRouter()

  useEffect(() => {
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
    <div className="chrome-sign-in-split">
      <div className="chrome-sign-in-split__form-col">
        <div className="chrome-sign-in-split__form c64-drawer-copy">
          <section aria-labelledby="sign-in-heading">
          <h2 id="sign-in-heading" className={c64DrawerSectionHeadingClass}>
            Howdy
          </h2>
          <p className={`${c64DrawerHintClass} mb-6`}>
            Sign in to see all the things
          </p>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="sign-in-email" className={`${c64FormFieldLabelClass} mb-2`}>
              Email address
            </label>
            <Input
              id="sign-in-email"
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
              className={clsx(c64FormFieldClass, fieldErrors.email && 'c64-form-field--invalid')}
            />
            {fieldErrors.email ? (
              <p id="sign-in-email-error" role="alert" className="chrome-field-error">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="sign-in-password" className={`${c64FormFieldLabelClass} mb-2`}>
              Password
            </label>
            <div className="relative">
              <Input
                id="sign-in-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? 'sign-in-password-error' : undefined}
                className={clsx(
                  c64FormFieldClass,
                  'pr-11',
                  fieldErrors.password && 'c64-form-field--invalid',
                )}
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
                className="chrome-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" aria-hidden />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden />
                )}
              </button>
            </div>
            {fieldErrors.password ? (
              <p id="sign-in-password-error" role="alert" className="chrome-field-error">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="chrome-guestbook-alert chrome-guestbook-alert--error" role="alert">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className={`${c64DrawerBtnSelectedClass} w-full inline-flex items-center justify-center gap-2 min-h-11`}
          >
            {isLoading ? (
              <>
                <span className="inline-flex h-5 w-8 items-center justify-center overflow-hidden">
                  <C64SpriteLoader className="scale-[0.06] origin-center" />
                </span>
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
        </section>
        </div>
      </div>

      <div className="chrome-sign-in-split__aside">
        <SignInCoverGrid images={coverImages} />
      </div>
    </div>
  )
}
