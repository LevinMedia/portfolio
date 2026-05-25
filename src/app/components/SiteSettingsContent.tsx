'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import {
  defaultC64Settings,
  LEGACY_SITE_THEME_KEY,
  loadC64Settings,
  saveC64Settings,
  type C64Accent,
  type C64BootMode,
  type C64ScreenTint,
  type C64Settings,
} from '@/lib/c64-settings'
import {
  applyC64SettingsNow,
  dispatchC64SettingsChanged,
} from '@/app/components/C64SettingsApplier'
import DrawerSection from './DrawerSection'
import { C64LoadingScreen, useC64LoaderVisible } from './C64SpriteLoader'
import {
  c64DrawerBtnClass,
  c64DrawerBtnSelectedClass,
  c64DrawerChoiceClass,
  c64DrawerChoiceLabelClass,
  c64DrawerHintClass,
  c64DrawerStackClass,
} from '@/lib/c64-drawer-classes'

const ACCENT_OPTIONS: { id: C64Accent; label: string }[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'yellow', label: 'Yellow' },
  { id: 'green', label: 'Green' },
  { id: 'pink', label: 'Pink' },
  { id: 'orange', label: 'Dirt' },
  { id: 'white', label: 'Abyss' },
  { id: 'red', label: 'Red' },
]

const TINT_OPTIONS: { id: C64ScreenTint; label: string }[] = [
  { id: 'dim', label: 'Dim' },
  { id: 'default', label: 'Default' },
  { id: 'bright', label: 'Bright' },
]

const BOOT_OPTIONS: { id: C64BootMode; label: string; hint: string }[] = [
  { id: 'off', label: 'Off', hint: 'Home shows the classic boot text immediately (no type-in)' },
  { id: 'session', label: 'Once per tab', hint: 'Type-in animation once; then instant until you close this tab' },
  { id: 'always', label: 'Always animate', hint: 'Type-in lines every time the home page loads' },
]

export default function SiteSettingsContent() {
  const router = useRouter()
  const [settings, setSettings] = useState<C64Settings>(defaultC64Settings)
  const [isLoading, setIsLoading] = useState(true)
  const [showSignOut, setShowSignOut] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem('admin_user')
      if (!raw) return
      const user = JSON.parse(raw) as { access_role?: string }
      const role = user?.access_role
      setShowSignOut(role === 'admin' || role === 'private')
    } catch {
      setShowSignOut(false)
    }
  }, [])

  useEffect(() => {
    const s = loadC64Settings()
    setSettings(s)
    applyC64SettingsNow(s)
    setIsLoading(false)
  }, [])

  const persist = useCallback((next: C64Settings) => {
    setSettings(next)
    saveC64Settings(next)
    applyC64SettingsNow(next)
    dispatchC64SettingsChanged()
    try {
      localStorage.removeItem(LEGACY_SITE_THEME_KEY)
      localStorage.removeItem('selected-preset')
    } catch {
      // ignore
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'same-origin' })
    } catch {
      // ignore
    }
    sessionStorage.removeItem('admin_user')
    router.push('/')
  }

  const showLoader = useC64LoaderVisible(isLoading)
  if (showLoader) {
    return <C64LoadingScreen label="Loading settings" />
  }

  return (
    <div className={`c64-site-settings c64-drawer-copy ${c64DrawerStackClass}`}>
      <DrawerSection title="Highlight color">
        <p className={`${c64DrawerHintClass} mb-4`}>
          Picks the whole site palette: dark screen and borders shift with this hue, highlights stay
          in the classic C64 spirit (Dim / Default / Bright still control overall lightness).
        </p>
        <div className="flex flex-wrap gap-2">
          {ACCENT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => persist({ ...settings, accent: id })}
              className={settings.accent === id ? c64DrawerBtnSelectedClass : c64DrawerBtnClass}
            >
              {label}
            </button>
          ))}
        </div>
      </DrawerSection>

      <DrawerSection title="Screen brightness">
        <div className="flex flex-wrap gap-2">
          {TINT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => persist({ ...settings, screenTint: id })}
              className={settings.screenTint === id ? c64DrawerBtnSelectedClass : c64DrawerBtnClass}
            >
              {label}
            </button>
          ))}
        </div>
      </DrawerSection>

      <DrawerSection title="Effects">
        <label className={c64DrawerChoiceClass}>
          <input
            type="checkbox"
            checked={settings.scanlines}
            onChange={(e) => persist({ ...settings, scanlines: e.target.checked })}
          />
          <span className={c64DrawerChoiceLabelClass}>CRT scanlines overlay</span>
        </label>
      </DrawerSection>

      <DrawerSection title="Home boot sequence">
        <div className="space-y-2">
          {BOOT_OPTIONS.map(({ id, label, hint }) => (
            <label key={id} className={c64DrawerChoiceClass}>
              <input
                type="radio"
                name="c64-boot"
                checked={settings.boot === id}
                onChange={() => persist({ ...settings, boot: id })}
              />
              <span className={c64DrawerChoiceLabelClass}>{label}</span>
              <span className={c64DrawerHintClass}>{hint}</span>
            </label>
          ))}
        </div>
      </DrawerSection>

      {showSignOut && (
        <div className="flex justify-center pt-2 pb-2">
          <button
            type="button"
            onClick={handleSignOut}
            className={`inline-flex items-center gap-2 min-h-11 px-3 ${c64DrawerHintClass} hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c64-accent)]`}
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
