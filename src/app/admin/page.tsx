'use client'

import { useState, useEffect } from 'react'
import { 
  CogIcon, 
  UserIcon, 
  DocumentTextIcon, 
  BriefcaseIcon, 
  BookOpenIcon, 
  ChartBarIcon,
  HomeIcon 
} from '@heroicons/react/24/outline'

interface AdminStats {
  workCompanies: number
  workPositions: number
  howdyContent: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    workCompanies: 0,
    workPositions: 0,
    howdyContent: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch admin dashboard stats
    const fetchStats = async () => {
      try {
        // This would be replaced with actual API calls
        // For now, using mock data
        setStats({
          workCompanies: 5,
          workPositions: 12,
          howdyContent: 1
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const quickActions = [
    {
      name: 'General Settings',
      href: '/admin',
      icon: CogIcon,
      description: 'Configure site-wide settings',
      color: 'bg-gray-500'
    },
    {
      name: 'Howdy Content',
      href: '/admin/howdy',
      icon: UserIcon,
      description: 'Manage the main greeting section',
      color: 'bg-blue-500'
    },
    {
      name: 'Selected Work',
      href: '/admin/selected-work',
      icon: DocumentTextIcon,
      description: 'Curate featured work samples',
      color: 'bg-green-500'
    },
    {
      name: 'Work History',
      href: '/admin/work-history',
      icon: BriefcaseIcon,
      description: 'Manage employment history',
      color: 'bg-purple-500'
    },
    {
      name: 'About Section',
      href: '/admin/about',
      icon: BookOpenIcon,
      description: 'Edit about page content',
      color: 'bg-yellow-500'
    },
    {
      name: 'Site Statistics',
      href: '/admin/stats',
      icon: ChartBarIcon,
      description: 'View analytics and metrics',
      color: 'bg-red-500'
    },
    {
      name: 'Guestbook',
      href: '/admin/guestbook',
      icon: HomeIcon,
      description: 'Manage visitor messages',
      color: 'bg-indigo-500'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-background border border-border/20 overflow-hidden shadow rounded-lg" style={{ 
        backgroundImage: `
          linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
        backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
      }}>
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-foreground">
            Welcome to the Admin Panel
          </h3>
          <div className="mt-2 max-w-xl text-sm text-muted-foreground">
            <p>
              Manage your site content, work history, and settings from this centralized dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-background border border-border/20 overflow-hidden shadow rounded-lg" style={{ 
          backgroundImage: `
            linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
          backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
        }}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BriefcaseIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Work Companies
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {stats.workCompanies}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background border border-border/20 overflow-hidden shadow rounded-lg" style={{ 
          backgroundImage: `
            linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
          backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
        }}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Work Positions
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {stats.workPositions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background border border-border/20 overflow-hidden shadow rounded-lg" style={{ 
          backgroundImage: `
            linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
          backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
        }}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Howdy Content
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {stats.howdyContent}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-background border border-border/20 shadow rounded-lg" style={{ 
        backgroundImage: `
          linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
        backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
      }}>
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <a
                key={action.name}
                href={action.href}
                className="relative group bg-background p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded-lg border border-border/20 hover:border-border transition-colors"
              >
                <div>
                  <span className={`rounded-lg inline-flex p-3 ${action.color} text-white`}>
                    <action.icon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-foreground">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {action.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
