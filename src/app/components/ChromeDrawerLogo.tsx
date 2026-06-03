'use client'

import { useRouter } from 'next/navigation'
import LevinMediaLogo from './LevinMediaLogo'

export default function ChromeDrawerLogo() {
  const router = useRouter()

  return (
    <button
      type="button"
      className="chrome-drawer-logo"
      aria-label="Home"
      tabIndex={-1}
      onClick={() => router.push('/', { scroll: false })}
    >
      <LevinMediaLogo size={36} fillBackground className="chrome-drawer-logo__mark" />
    </button>
  )
}
