'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/sign-in')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <p className="text-muted-foreground">Redirecting to sign-in…</p>
    </div>
  )
}
