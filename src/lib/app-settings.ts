/**
 * Application chrome / brightness prefs (drawers + derived C64 screen tint).
 */

import type { C64ScreenTint } from './c64-settings'

export const APP_STORAGE_KEY = 'site-app-settings'

export type AppColorMode = 'system' | 'light' | 'dark'

export interface AppSettings {
  colorMode: AppColorMode
}

export const defaultAppSettings: AppSettings = {
  colorMode: 'system',
}

/** Resolved theme for chrome CSS and C64 screen tint (system follows OS). */
export function resolveAppColorMode(mode: AppColorMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function colorModeToScreenTint(mode: AppColorMode): C64ScreenTint {
  return resolveAppColorMode(mode) === 'light' ? 'bright' : 'dim'
}

export function screenTintToColorMode(tint: string | undefined): AppColorMode {
  if (tint === 'dim') return 'dark'
  if (tint === 'bright') return 'light'
  return 'system'
}

function parseColorMode(value: unknown): AppColorMode {
  if (value === 'light' || value === 'dark' || value === 'system') return value
  return defaultAppSettings.colorMode
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(settings))
}

export function loadAppSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultAppSettings
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>
      return { colorMode: parseColorMode(parsed.colorMode) }
    }
  } catch {
    // ignore
  }
  return defaultAppSettings
}

/** Migrate legacy `screenTint` from combined site-c64-settings blob into app settings. */
export function migrateScreenTintFromLegacy(screenTint: string | undefined): AppSettings | null {
  if (!screenTint) return null
  const colorMode = screenTintToColorMode(screenTint)
  const app = { colorMode }
  saveAppSettings(app)
  return app
}
