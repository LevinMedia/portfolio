'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AboutPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home with about query parameter
    router.push('/?about=true')
  }, [router])

  return null // This page just redirects
} 