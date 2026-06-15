'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@headlessui/react'
import type { PortfolioCoverImage } from '@/lib/portfolio-cover-images-server'
import SignInCoverGrid from './SignInCoverGrid'
import { clsx } from 'clsx'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import ButtonSpinner from './ButtonSpinner'
import { c64FormFieldClass, c64FormFieldLabelClass } from '@/lib/c64-form-classes'
import {
  c64DrawerBtnSelectedClass,
  c64DrawerHintClass,
  c64DrawerSectionHeadingClass,
} from '@/lib/c64-drawer-classes'

type AccessContentProps = {
  coverImages: PortfolioCoverImage[]
}

export default function AccessContent({ coverImages }: AccessContentProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ password?: string }>({})
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!password) {
      setFieldErrors({ password: 'Password is required' })
      return
    }
    setFieldErrors({})

    setIsLoading(true)

    try {
      const response = await fetch('/api/access/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        setError('Server error: Received invalid response. Please try again.')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid password')
        return
      }

      if (data.cookie_error) {
        setError(data.cookie_error)
        return
      }

      sessionStorage.setItem(
        'admin_user',
        JSON.stringify({ label: data.label, access_role: data.access_role }),
      )
      router.push('/?selected-works=true')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chrome-sign-in-split">
      <div className="chrome-sign-in-split__form-col">
        <div className="chrome-sign-in-split__form c64-drawer-copy">
          <section aria-labelledby="access-heading">
            <h2 id="access-heading" className={c64DrawerSectionHeadingClass}>
              Howdy
            </h2>
            <p className={`${c64DrawerHintClass} mb-6`}>
              Sign in to see all the things
            </p>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="access-password" className={`${c64FormFieldLabelClass} mb-2`}>
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="access-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-invalid={fieldErrors.password ? true : undefined}
                    aria-describedby={fieldErrors.password ? 'access-password-error' : undefined}
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
                      setFieldErrors({})
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
                  <p id="access-password-error" role="alert" className="chrome-field-error">
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
                    <ButtonSpinner />
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
