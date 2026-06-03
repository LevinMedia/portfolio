'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import {
  defaultSiteSettings,
  loadSiteSettings,
  saveSiteSettings,
  type C64Accent,
  type C64BootMode,
  type AppColorMode,
  type SiteSettings,
} from '@/lib/site-settings'
import {
  applyC64SettingsNow,
  dispatchC64SettingsChanged,
} from '@/app/components/C64SettingsApplier'
import DrawerSection from './DrawerSection'
import ChromeSegmentedControl from './ChromeSegmentedControl'
import C64SettingsPreview from './C64SettingsPreview'
import { C64LoadingScreen, useC64LoaderVisible } from './C64SpriteLoader'
import {
  c64DrawerChoiceClass,
  c64DrawerChoiceLabelClass,
  c64DrawerEntryHeadingClass,
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

const COLOR_MODE_OPTIONS: { id: AppColorMode; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

const BOOT_OPTIONS: { id: C64BootMode; label: string; hint: string }[] = [
  { id: 'session', label: 'Once per session', hint: 'Run boot sequence on first home page view of session' },
  { id: 'off', label: 'Off', hint: 'Never run boot sequence animation' },
  { id: 'always', label: 'Always animate', hint: 'Run boot sequence every home page view' },
]

export default function SiteSettingsContent() {
  const router = useRouter()
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
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
    const s = loadSiteSettings()
    setSettings(s)
    applyC64SettingsNow(s)
    setIsLoading(false)
  }, [])

  const persist = useCallback((next: SiteSettings) => {
    setSettings(next)
    saveSiteSettings(next)
    applyC64SettingsNow(next)
    dispatchC64SettingsChanged()
    try {
      localStorage.removeItem('site-theme')
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
      <DrawerSection title="C64 settings" titleId="c64-settings-heading">
        <p className="chrome-settings-intro mb-4">
          Control the C64 terminal appearance only.
        </p>

        <h3 className={`${c64DrawerEntryHeadingClass} chrome-settings-section-heading`}>
          Styles
        </h3>
        <div className="chrome-settings-styles-block">
          <div className="chrome-settings-field chrome-settings-field--color">
            <span className={`${c64DrawerChoiceLabelClass} chrome-settings-field-label`}>
              Color
            </span>
            <ChromeSegmentedControl
              ariaLabel="C64 highlight color"
              options={ACCENT_OPTIONS}
              value={settings.c64.accent}
              onChange={(accent) => persist({ ...settings, c64: { ...settings.c64, accent } })}
              fullWidth
            />
            <C64SettingsPreview
              accent={settings.c64.accent}
              scanlines={settings.c64.scanlines}
              colorMode={settings.app.colorMode}
            />
          </div>

          <label className={c64DrawerChoiceClass}>
            <input
              type="checkbox"
              checked={settings.c64.scanlines}
              onChange={(e) =>
                persist({
                  ...settings,
                  c64: { ...settings.c64, scanlines: e.target.checked },
                })
              }
            />
            <span className={c64DrawerChoiceLabelClass}>Scanlines</span>
            <span className={c64DrawerHintClass}>Shown on the home screen only</span>
          </label>
        </div>

        <h3
          className={`${c64DrawerEntryHeadingClass} chrome-settings-section-heading chrome-settings-boot-heading`}
        >
          Boot Sequence
        </h3>
        <div className="chrome-settings-boot-options space-y-2">
          {BOOT_OPTIONS.map(({ id, label, hint }) => (
            <label key={id} className={c64DrawerChoiceClass}>
              <input
                type="radio"
                name="c64-boot"
                checked={settings.c64.boot === id}
                onChange={() =>
                  persist({
                    ...settings,
                    c64: { ...settings.c64, boot: id },
                  })
                }
              />
              <span className={c64DrawerChoiceLabelClass}>{label}</span>
              <span className={c64DrawerHintClass}>{hint}</span>
            </label>
          ))}
        </div>
      </DrawerSection>

      <DrawerSection title="Program settings" titleId="app-settings-heading">
        <p className="chrome-settings-intro">
          Control the color mode of programs launched from the C64 terminal.
        </p>
        <div className="chrome-settings-field chrome-settings-field--color-mode">
          <span className={`${c64DrawerChoiceLabelClass} chrome-settings-field-label`}>
            Color mode
          </span>
          <ChromeSegmentedControl
            ariaLabel="Application color mode"
            options={COLOR_MODE_OPTIONS}
            value={settings.app.colorMode}
            onChange={(colorMode) => persist({ ...settings, app: { colorMode } })}
            fullWidth
          />
        </div>
      </DrawerSection>

      {showSignOut && (
        <div className="flex justify-center pt-2 pb-2">
          <button
            type="button"
            onClick={handleSignOut}
            className={`inline-flex items-center gap-2 min-h-11 px-3 ${c64DrawerHintClass} hover:text-[var(--chrome-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--chrome-focus-ring)]`}
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
