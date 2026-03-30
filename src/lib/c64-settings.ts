/**
 * Commodore 64–style appearance for the public portfolio only.
 * Persisted in localStorage; never store private content here.
 */

import chroma from 'chroma-js'

export const C64_STORAGE_KEY = 'site-c64-settings'
export const LEGACY_SITE_THEME_KEY = 'site-theme'
/**
 * After the home boot line animation finishes once in this tab, skip animation until the tab closes.
 * Used when boot mode is `session`.
 */
export const C64_HOME_BOOT_LINES_SESSION_KEY = 'c64-home-boot-lines-done'

export type C64Accent =
  | 'classic'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'orange'
  | 'white'
  | 'red'

export type C64ScreenTint = 'dim' | 'default' | 'bright'

/** off = never show; session = once per tab session; always = every visit until dismissed */
export type C64BootMode = 'off' | 'session' | 'always'

export type C64TextScale = 'compact' | 'comfortable'

export interface C64Settings {
  accent: C64Accent
  screenTint: C64ScreenTint
  scanlines: boolean
  boot: C64BootMode
  textScale: C64TextScale
}

export const defaultC64Settings: C64Settings = {
  accent: 'classic',
  screenTint: 'default',
  scanlines: true,
  boot: 'session',
  textScale: 'comfortable',
}

/** Classic C64-ish hex values for accents (highlights, links, primary buttons) */
export const C64_ACCENT_HEX: Record<C64Accent, string> = {
  /** VIC-II light blue: screen is color 6, this is the familiar “C64 blue on blue” chrome */
  classic: '#a8a8ff',
  yellow: '#dcdc50',
  green: '#58d854',
  pink: '#ffa0d0',
  orange: '#e8b898',
  /** Soft pearl — easier on the eyes than pure white on near-black */
  white: '#c9cad8',
  red: '#ee4444',
}

const ACCENT_ORDER: C64Accent[] = [
  'classic',
  'yellow',
  'green',
  'pink',
  'orange',
  'white',
  'red',
]

const SCREEN_TINT_ORDER: C64ScreenTint[] = ['dim', 'default', 'bright']

const ACCENT_RGB: Record<C64Accent, [number, number, number]> = {
  classic: [168, 168, 255],
  yellow: [220, 220, 80],
  green: [88, 216, 84],
  pink: [255, 160, 208],
  orange: [232, 184, 152],
  white: [201, 202, 216],
  red: [238, 68, 68],
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function dist2(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return dx * dx + dy * dy + dz * dz
}

export function nearestAccentFromHex(hex: string): C64Accent {
  const rgb = hexToRgb(hex)
  if (!rgb) return 'classic'
  let best: C64Accent = 'classic'
  let bestD = Infinity
  for (const key of Object.keys(ACCENT_RGB) as C64Accent[]) {
    const d = dist2(rgb, ACCENT_RGB[key])
    if (d < bestD) {
      bestD = d
      best = key
    }
  }
  return best
}

/**
 * Hue for the dark CRT “field” (screen + border). Cool accents stay blue-purple-ish;
 * warm accents shift toward their family (e.g. red → maroon field).
 */
const SURFACE_HUE: Record<C64Accent, number> = {
  classic: 252,
  yellow: 52,
  green: 132,
  pink: 312,
  orange: 22,
  white: 252,
  red: 358,
}

const TINT_LEVELS: Record<
  C64ScreenTint,
  { screenL: number; borderL: number; sat: number }
> = {
  /* Screen L: main CRT panel (--c64-screen-bg). Border stays slightly above screen for edge read. */
  dim: { screenL: 0.09, borderL: 0.05, sat: 0.42 },
  default: { screenL: 0.118, borderL: 0.066, sat: 0.46 },
  bright: { screenL: 0.158, borderL: 0.088, sat: 0.5 },
}

/** White accent only: deeper near-black field so soft “white” highlights don’t blow contrast */
const WHITE_SURFACE_LEVELS: Record<
  C64ScreenTint,
  { screenL: number; borderL: number }
> = {
  dim: { screenL: 0.036, borderL: 0.02 },
  default: { screenL: 0.048, borderL: 0.028 },
  bright: { screenL: 0.064, borderL: 0.038 },
}

/** Authentic blue-purple field + border (color 6 family); Dim/Default/Bright match original site tiers */
const CLASSIC_CRT_BY_TINT: Record<
  C64ScreenTint,
  { screen: string; border: string }
> = {
  dim: { screen: '#2a2060', border: '#181058' },
  default: { screen: '#352879', border: '#1d1d6e' },
  bright: { screen: '#403898', border: '#252070' },
}

export interface C64ThemeColors {
  screen: string
  border: string
  crtInk: string
}

export function getC64ThemeColors(
  accent: C64Accent,
  screenTint: C64ScreenTint,
): C64ThemeColors {
  if (accent === 'classic') {
    const { screen, border } = CLASSIC_CRT_BY_TINT[screenTint]
    return {
      screen,
      border,
      crtInk: C64_ACCENT_HEX.classic,
    }
  }

  const tl = TINT_LEVELS[screenTint]
  let sat = tl.sat
  let screenL = tl.screenL
  let borderL = tl.borderL
  if (accent === 'white') {
    sat = Math.min(0.2, tl.sat * 0.38)
    const w = WHITE_SURFACE_LEVELS[screenTint]
    screenL = w.screenL
    borderL = w.borderL
  }
  const h = SURFACE_HUE[accent]
  const screen = chroma.hsl(h, sat, screenL).hex()
  const border = chroma.hsl(h, Math.min(0.64, sat + 0.1), borderL).hex()
  const accentHex = C64_ACCENT_HEX[accent]

  let crtInk: string
  if (accent === 'white') {
    crtInk = chroma.mix(accentHex, '#e4e6ef', 0.55).mix(screen, 0.14).hex()
  } else if (accent === 'yellow') {
    crtInk = chroma.mix(accentHex, '#fff8d0', 0.5).saturate(0.08).hex()
  } else {
    crtInk = chroma.mix(accentHex, '#f0f0ff', 0.38, 'rgb').saturate(0.15).hex()
  }

  return { screen, border, crtInk }
}

function onAccentForeground(accentHex: string): string {
  const lum = chroma(accentHex).luminance()
  if (lum > 0.52) {
    return chroma.mix('#080510', accentHex, 0.12).hex()
  }
  return chroma.mix('#f8f8ff', accentHex, 0.08).hex()
}

function buildCssVarSnapshot(
  accent: C64Accent,
  screenTint: C64ScreenTint,
): Record<string, string> {
  const { screen, border, crtInk } = getC64ThemeColors(accent, screenTint)
  const accentHex = C64_ACCENT_HEX[accent]
  const fg =
    accent === 'white'
      ? chroma.mix(crtInk, accentHex, 0.14).hex()
      : chroma.mix(crtInk, '#ffffff', 0.1).hex()
  const mutedFg = chroma.mix(screen, crtInk, 0.52).hex()
  const secondary = chroma.mix(screen, accentHex, 0.4).hex()
  const secondaryFg =
    accent === 'white'
      ? chroma.mix(accentHex, crtInk, 0.28).hex()
      : chroma.mix(accentHex, '#ffffff', 0.32).hex()
  const onPrimary = onAccentForeground(accentHex)

  return {
    '--c64-screen-bg': screen,
    '--c64-border-bg': border,
    '--c64-accent': accentHex,
    '--c64-crt-ink': crtInk,
    '--c64-bezel-bg': crtInk,
    '--background': screen,
    '--foreground': fg,
    '--muted': 'color-mix(in srgb, var(--c64-screen-bg) 72%, #000)',
    '--muted-foreground': mutedFg,
    '--border': accentHex,
    '--input': screen,
    '--primary': accentHex,
    '--primary-foreground': onPrimary,
    '--secondary': secondary,
    '--secondary-foreground': secondaryFg,
    '--accent': accentHex,
    '--accent-foreground': onPrimary,
    '--destructive': '#ee4444',
    '--destructive-foreground': '#ffffff',
    '--ring': accentHex,
  }
}

function buildInlineThemeJson(): Record<string, Record<string, Record<string, string>>> {
  const out: Record<string, Record<string, Record<string, string>>> = {}
  for (const a of ACCENT_ORDER) {
    out[a] = {}
    for (const t of SCREEN_TINT_ORDER) {
      out[a][t] = buildCssVarSnapshot(a, t)
    }
  }
  return out
}

/**
 * Precomputed theme CSS vars for every accent × screen brightness (for layout inline script).
 */
export const C64_INLINE_THEME_VARS_JSON = JSON.stringify(buildInlineThemeJson())

const TEXT_SCALE: Record<C64TextScale, string> = {
  compact: '0.9',
  comfortable: '1.05',
}

export function saveC64Settings(settings: C64Settings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(C64_STORAGE_KEY, JSON.stringify(settings))
}

export function loadC64Settings(): C64Settings {
  if (typeof window === 'undefined') return defaultC64Settings
  try {
    const raw = localStorage.getItem(C64_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<C64Settings> & { accent?: string }
      const merged = { ...defaultC64Settings, ...parsed }
      if (String(merged.accent) === 'cyan' || String(merged.accent) === 'lightblue') {
        merged.accent = 'classic'
      }
      return merged
    }
    const legacy = localStorage.getItem(LEGACY_SITE_THEME_KEY)
    if (legacy) {
      const t = JSON.parse(legacy) as { primaryColor?: string }
      if (t.primaryColor) {
        const migrated: C64Settings = {
          ...defaultC64Settings,
          accent: nearestAccentFromHex(t.primaryColor),
        }
        saveC64Settings(migrated)
        localStorage.removeItem(LEGACY_SITE_THEME_KEY)
        try {
          localStorage.removeItem('selected-preset')
        } catch {
          // ignore
        }
        return migrated
      }
    }
  } catch {
    // ignore
  }
  return defaultC64Settings
}

/**
 * Apply C64 CSS variables and data attributes on the portfolio root element.
 */
export function applyC64ToElement(el: HTMLElement, s: C64Settings): void {
  const snap = buildCssVarSnapshot(s.accent, s.screenTint)
  for (const [k, v] of Object.entries(snap)) {
    el.style.setProperty(k, v)
  }
  el.style.setProperty('--c64-text-scale', TEXT_SCALE[s.textScale])

  el.dataset.c64Scanlines = s.scanlines ? 'on' : 'off'
  el.dataset.c64Boot = s.boot
}
