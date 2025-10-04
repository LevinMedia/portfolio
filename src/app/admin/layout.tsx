'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Bars3Icon,
  XMarkIcon,
  CogIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BookOpenIcon,
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'General Settings', href: '/admin', icon: CogIcon },
  { name: 'Howdy', href: '/admin/howdy', icon: UserIcon },
  { name: 'Selected Work', href: '/admin/selected-work', icon: DocumentTextIcon },
  { name: 'Work History', href: '/admin/work-history', icon: BriefcaseIcon },
  { name: 'About', href: '/admin/about', icon: BookOpenIcon },
  { name: 'Manage Stats', href: '/admin/stats', icon: ChartBarIcon },
  { name: 'Manage Guestbook', href: '/admin/guestbook', icon: HomeIcon },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [adminUser, setAdminUser] = useState<{ username: string; email: string } | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip authentication check for login and secure setup pages
    if (pathname === '/admin/login' || pathname === '/admin/secure-setup') {
      return
    }

    // Check if user is authenticated
    const user = sessionStorage.getItem('admin_user')
    if (!user) {
      router.push('/admin/login')
      return
    }
    setAdminUser(JSON.parse(user))
  }, [router, pathname])

  // For setup and login pages, render without admin layout
  if (pathname === '/admin/setup' || pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_user')
    router.push('/admin/login')
  }

  if (!adminUser) {
    return null // Will redirect to login
  }

  return (
    <div className="h-screen font-[family-name:var(--font-geist-sans)] flex" style={{ 
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
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full h-full bg-background border border-border/20" style={{ 
            backgroundImage: `
              linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
            backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
          }}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-foreground" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">Admin Panel</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-4 flex-shrink-0 h-6 w-6" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-border/20 p-4">
              <div className="flex items-center">
                <div>
                  <div className="text-base font-medium text-foreground">{adminUser.username}</div>
                  <div className="text-sm font-medium text-muted-foreground">{adminUser.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden md:flex md:flex-shrink-0 ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} transition-all duration-300 h-full`}>
        <div className="flex flex-col w-full h-full">
          <div className="flex flex-col h-full border-r border-border/20 bg-background" style={{ 
            backgroundImage: `
              linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
            backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
          }}>
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                {!sidebarCollapsed && (
                  <h1 className="text-xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">Admin Panel</h1>
                )}
                {sidebarCollapsed && (
                  <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">A</span>
                  </div>
                )}
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <item.icon className="mr-3 flex-shrink-0 h-6 w-6" />
                      {!sidebarCollapsed && item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-border/20 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-medium text-sm">
                      {adminUser.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-foreground">{adminUser.username}</div>
                    <div className="text-xs text-muted-foreground">{adminUser.email}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-background border-b border-border/20">
          <button
            type="button"
            className="px-4 border-r border-border/20 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex items-center">
              {/* Desktop collapse button */}
              <button
                type="button"
                className="hidden md:block p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5" />
                )}
              </button>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {navigation.find(item => item.href === pathname)?.name || 'Admin Panel'}
                </h2>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                <span className="sr-only">Logout</span>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
