'use client'

import { useRouter } from 'next/navigation'
import LevinMediaLogo from './LevinMediaLogo'

interface ChromeDrawerLogoProps {
  /** Replaces the default "go to /" behavior. */
  onClick?: () => void
}

export default function ChromeDrawerLogo({ onClick }: ChromeDrawerLogoProps) {
  const router = useRouter()

  return (
    <button
      type="button"
      className="chrome-drawer-logo"
      aria-label="Home"
      onClick={onClick ?? (() => router.push('/', { scroll: false }))}
    >
      <LevinMediaLogo size={36} fillBackground className="chrome-drawer-logo__mark" />
    </button>
  )
}
