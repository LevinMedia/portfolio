'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function AdminLogin() {
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
        console.log('Checking admin setup status...')
        const response = await fetch('/api/admin/secure-setup')
        
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Non-JSON response from secure-setup endpoint')
          return
        }
        
        const data = await response.json()
        
        console.log('Setup status response:', data)
        
        if (response.ok && !data.setupCompleted) {
          console.log('No admin exists, redirecting to secure setup...')
          // No admin exists, redirect to secure setup
          router.push('/admin/secure-setup')
        } else {
          console.log('Admin setup already completed or error occurred')
        }
      } catch (error) {
        console.error('Error checking admin existence:', error)
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

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        setError('Server error: Received invalid response. Please check your environment variables.')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // Store user info in session storage
      sessionStorage.setItem('admin_user', JSON.stringify(data))
      
      // Redirect to admin dashboard
      router.push('/admin')
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to access the admin panel
          </p>
        </div>

        <div className="bg-background border border-border/20 rounded-lg p-8 shadow-lg" style={{ 
          backgroundImage: `
            linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
          backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
        }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full px-3 py-2 pr-10 border border-border rounded-md shadow-sm placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                <div className="text-sm text-destructive">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
