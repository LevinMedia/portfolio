'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

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
      const workHistory = searchParams.get('work-history')
      const about = searchParams.get('about')
      const selectedWorks = searchParams.get('selected-works')
      const guestbook = searchParams.get('guestbook')
      const stats = searchParams.get('stats')
      
      if (workHistory === 'true') {
        analyticsPath = '/work-history'
      } else if (about === 'true') {
        analyticsPath = '/about'
      } else if (selectedWorks === 'true') {
        analyticsPath = '/selected-works'
      } else if (guestbook === 'true') {
        analyticsPath = '/guestbook'
      } else if (stats === 'true') {
        analyticsPath = '/stats'
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
