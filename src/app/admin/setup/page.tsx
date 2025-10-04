'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function AdminSetup() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; loginCredentials?: { username: string; password: string } } | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  // Debug: Log when component mounts
  console.log('AdminSetup component mounted')

  const handleSetup = async () => {
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      console.log('Making setup API call...')
      const response = await fetch('/api/admin/setup-admin', {
        method: 'POST',
      })

      console.log('Setup API response status:', response.status)
      const data = await response.json()
      console.log('Setup API response data:', data)

      if (!response.ok) {
        const errorMessage = data.error || 'Setup failed'
        console.error('Setup failed:', errorMessage)
        
        // Check if it's a database table missing error
        if (errorMessage.includes('Could not find the table')) {
          setError('Database tables not found. Please deploy the database schema first by running the SQL script in your Supabase SQL Editor.')
        } else {
          setError(errorMessage)
        }
        return
      }

      setResult(data)
    } catch (err) {
      console.error('Setup API error:', err)
      setError('An error occurred during setup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToLogin = () => {
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-[family-name:var(--font-geist-sans)] py-12 px-4 sm:px-6 lg:px-8" style={{ 
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
    }}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-2xl sm:text-5xl font-extrabold tracking-wide text-foreground font-[family-name:var(--font-geist-mono)]">
            Admin Setup
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Initialize the admin user account
          </p>
        </div>

        <div className="bg-background border border-border/20 rounded-lg p-6 shadow-lg" style={{ 
          backgroundImage: `
            linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
          backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
        }}>
          {!result && !error && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Create Admin User
                </h3>
                <p className="text-sm text-muted-foreground">
                  This will create a default admin user with the following credentials:
                </p>
                <div className="mt-3 bg-muted p-3 rounded-md border border-border/20">
                  <div className="text-sm">
                    <div><strong className="text-foreground">Username:</strong> <span className="text-muted-foreground">Admin</span></div>
                    <div><strong className="text-foreground">Password:</strong> <span className="text-muted-foreground">TheLetterA!</span></div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSetup}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Setting up...' : 'Setup Admin User'}
              </button>
            </div>
          )}

          {result && (
            <div>
              <div className="flex items-center mb-4">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
                <h3 className="text-lg font-medium text-foreground">
                  Setup Complete
                </h3>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4">
                <p className="text-sm text-green-800">
                  {result.message}
                </p>
              </div>
              {result.loginCredentials && (
                <div className="bg-muted border border-border/20 p-4 rounded-md mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Login Credentials:
                  </h4>
                  <div className="text-sm">
                    <div><strong className="text-foreground">Username:</strong> <span className="text-muted-foreground">{result.loginCredentials.username}</span></div>
                    <div><strong className="text-foreground">Password:</strong> <span className="text-muted-foreground">{result.loginCredentials.password}</span></div>
                  </div>
                </div>
              )}
              <button
                onClick={handleGoToLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}

          {error && (
            <div>
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-destructive mr-2" />
                <h3 className="text-lg font-medium text-foreground">
                  Setup Failed
                </h3>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md mb-4">
                <p className="text-sm text-destructive">
                  {error}
                </p>
              </div>
              <button
                onClick={() => {
                  setError('')
                  setResult(null)
                }}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
