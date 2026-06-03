/**
 * Combined site preferences: C64 home CRT + application chrome.
 */

import {
  applyC64ToElement,
  defaultC64Settings,
  loadC64Settings,
  saveC64Settings,
  type C64Settings,
} from './c64-settings'
import {
  colorModeToScreenTint,
  defaultAppSettings,
  loadAppSettings,
  migrateScreenTintFromLegacy,
  resolveAppColorMode,
  saveAppSettings,
  type AppSettings,
} from './app-settings'

export type { C64Settings, C64Accent, C64BootMode } from './c64-settings'
export type { AppSettings, AppColorMode } from './app-settings'
export { defaultC64Settings, defaultAppSettings }

export interface SiteSettings {
  c64: C64Settings
  app: AppSettings
}

export const defaultSiteSettings: SiteSettings = {
  c64: defaultC64Settings,
  app: defaultAppSettings,
}

const LEGACY_COMBINED_KEY = 'site-c64-settings'

type LegacyCombined = Partial<C64Settings> & {
  screenTint?: string
  colorMode?: string
}

/** Load C64 + app; migrate legacy screenTint from combined storage once. */
export function loadSiteSettings(): SiteSettings {
  if (typeof window === 'undefined') return defaultSiteSettings

  let app = loadAppSettings()
  const hasAppKey = localStorage.getItem('site-app-settings') != null

  try {
    const raw = localStorage.getItem(LEGACY_COMBINED_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LegacyCombined
      if (!hasAppKey && parsed.screenTint != null) {
        const migrated = migrateScreenTintFromLegacy(parsed.screenTint)
        if (migrated) app = migrated
      }
      if (parsed.colorMode === 'light' || parsed.colorMode === 'dark') {
        app = { colorMode: parsed.colorMode }
        saveAppSettings(app)
      }
    }
  } catch {
    // ignore
  }

  return { c64: loadC64Settings(), app }
}

export function saveSiteSettings(settings: SiteSettings): void {
  saveC64Settings(settings.c64)
  saveAppSettings(settings.app)
}

export function applySiteSettingsToRoot(
  root: HTMLElement,
  settings: SiteSettings = loadSiteSettings(),
): void {
  const resolved = resolveAppColorMode(settings.app.colorMode)
  const screenTint = colorModeToScreenTint(settings.app.colorMode)
  applyC64ToElement(root, settings.c64, screenTint)

  root.dataset.chromeTheme = resolved
}
