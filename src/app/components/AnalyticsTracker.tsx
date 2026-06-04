'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { isDrawerParamOpen } from '@/lib/drawer-url'

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Skip admin pages
    if (pathname.startsWith('/admin')) return

    // Create a meaningful path that includes drawer state
    let analyticsPath = pathname
    
    // For the home page, check which drawer is open and create a virtual path
    if (pathname === '/') {
      if (isDrawerParamOpen(searchParams, 'work-history')) {
        analyticsPath = '/work-history'
      } else if (isDrawerParamOpen(searchParams, 'about')) {
        analyticsPath = '/about'
      } else if (isDrawerParamOpen(searchParams, 'selected-works')) {
        analyticsPath = '/selected-works'
      } else if (isDrawerParamOpen(searchParams, 'guestbook')) {
        analyticsPath = '/guestbook'
      } else if (isDrawerParamOpen(searchParams, 'stats')) {
        analyticsPath = '/stats'
      } else if (isDrawerParamOpen(searchParams, 'sign-in')) {
        analyticsPath = '/sign-in'
      }
      // If no drawer is open, keep it as '/' (home page)
    }

    // Post page view
    void fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        path: analyticsPath, 
        currentUrl: window.location.href, 
        isAdmin: false 
      })
    }).catch(() => {})
  }, [pathname, searchParams])

  return null
}
