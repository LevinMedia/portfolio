'use client'

import { useEffect } from 'react'
import {
  applyC64ToElement,
  C64_STORAGE_KEY,
  loadC64Settings,
  type C64Settings,
} from '@/lib/c64-settings'

const ROOT_ID = 'c64-site-root'

export function getC64SiteRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.getElementById(ROOT_ID)
}

export function applyC64SettingsNow(settings?: C64Settings): void {
  const el = getC64SiteRoot()
  if (!el) return
  applyC64ToElement(el, settings ?? loadC64Settings())
}

/**
 * Keeps #c64-site-root in sync with localStorage (and cross-tab updates).
 */
export default function C64SettingsApplier() {
  useEffect(() => {
    applyC64SettingsNow()

    const onStorage = (e: StorageEvent) => {
      if (e.key === C64_STORAGE_KEY || e.key === null) {
        applyC64SettingsNow()
      }
    }
    window.addEventListener('storage', onStorage)

    const onCustom = () => applyC64SettingsNow()
    window.addEventListener('c64-settings-changed', onCustom)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('c64-settings-changed', onCustom)
    }
  }, [])

  return null
}

export function dispatchC64SettingsChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('c64-settings-changed'))
}
