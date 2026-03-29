'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import Button from './Button'
import {
  defaultC64Settings,
  LEGACY_SITE_THEME_KEY,
  loadC64Settings,
  saveC64Settings,
  type C64Accent,
  type C64BootMode,
  type C64ScreenTint,
  type C64Settings,
  type C64TextScale,
} from '@/lib/c64-settings'
import {
  applyC64SettingsNow,
  dispatchC64SettingsChanged,
} from '@/app/components/C64SettingsApplier'

const ACCENT_OPTIONS: { id: C64Accent; label: string }[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'yellow', label: 'Yellow' },
  { id: 'green', label: 'Green' },
  { id: 'pink', label: 'Pink' },
  { id: 'orange', label: 'Orange' },
  { id: 'white', label: 'White' },
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

const TEXT_OPTIONS: { id: C64TextScale; label: string }[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'comfortable', label: 'Comfortable' },
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent motion-safe:animate-spin" aria-hidden />
        <span className="sr-only">Loading settings</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="border-2 border-primary bg-background p-4 c64-screen-grid">
        <h3 className="text-lg font-bold text-foreground mb-3 border-b-2 border-primary pb-2">
          Highlight color
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Picks the whole site palette: dark screen and borders shift with this hue, highlights stay
          in the classic C64 spirit (Dim / Default / Bright still control overall lightness).
        </p>
        <div className="flex flex-wrap gap-2">
          {ACCENT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => persist({ ...settings, accent: id })}
              className={`min-h-11 min-w-11 px-3 py-2 border-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                settings.accent === id
                  ? 'border-primary bg-primary/20 text-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="border-2 border-primary bg-background p-4 c64-screen-grid">
        <h3 className="text-lg font-bold text-foreground mb-3 border-b-2 border-primary pb-2">
          Screen brightness
        </h3>
        <div className="flex flex-wrap gap-2">
          {TINT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => persist({ ...settings, screenTint: id })}
              className={`min-h-11 px-4 py-2 border-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                settings.screenTint === id
                  ? 'border-primary bg-primary/20'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="border-2 border-primary bg-background p-4 c64-screen-grid">
        <h3 className="text-lg font-bold text-foreground mb-3 border-b-2 border-primary pb-2">
          Text size
        </h3>
        <div className="flex flex-wrap gap-2">
          {TEXT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => persist({ ...settings, textScale: id })}
              className={`min-h-11 px-4 py-2 border-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                settings.textScale === id
                  ? 'border-primary bg-primary/20'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="border-2 border-primary bg-background p-4 c64-screen-grid">
        <h3 className="text-lg font-bold text-foreground mb-3 border-b-2 border-primary pb-2">
          Effects
        </h3>
        <label className="flex items-center gap-3 min-h-11 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.scanlines}
            onChange={(e) => persist({ ...settings, scanlines: e.target.checked })}
            className="h-5 w-5 border-2 border-primary accent-primary"
          />
          <span className="text-foreground">CRT scanlines overlay</span>
        </label>
      </section>

      <section className="border-2 border-primary bg-background p-4 c64-screen-grid">
        <h3 className="text-lg font-bold text-foreground mb-3 border-b-2 border-primary pb-2">
          Home boot sequence
        </h3>
        <div className="space-y-2">
          {BOOT_OPTIONS.map(({ id, label, hint }) => (
            <label
              key={id}
              className="flex items-start gap-3 p-2 border-2 border-transparent hover:border-border cursor-pointer rounded-none"
            >
              <input
                type="radio"
                name="c64-boot"
                checked={settings.boot === id}
                onChange={() => persist({ ...settings, boot: id })}
                className="mt-1 h-4 w-4 border-2 border-primary accent-primary"
              />
              <span>
                <span className="block font-bold text-foreground">{label}</span>
                <span className="block text-sm text-muted-foreground">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="border-2 border-primary bg-background p-4 c64-screen-grid">
        <h3 className="text-lg font-bold text-foreground mb-3 border-b-2 border-primary pb-2">
          Preview
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button style="solid" color="primary" size="small">
            Primary
          </Button>
          <Button style="outline" color="accent" size="small">
            Outline
          </Button>
          <Button style="ghost" color="primary" size="small">
            Ghost
          </Button>
        </div>
      </section>

      {showSignOut && (
        <div className="flex justify-center pt-6 pb-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 min-h-11 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
