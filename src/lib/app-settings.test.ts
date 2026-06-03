import { describe, expect, it } from 'vitest'
import {
  colorModeToScreenTint,
  screenTintToColorMode,
  resolveAppColorMode,
  defaultAppSettings,
} from './app-settings'

describe('app settings', () => {
  it('maps resolved color mode to C64 screen tint', () => {
    expect(colorModeToScreenTint('light')).toBe('bright')
    expect(colorModeToScreenTint('dark')).toBe('dim')
  })

  it('keeps explicit light and dark modes', () => {
    expect(resolveAppColorMode('light')).toBe('light')
    expect(resolveAppColorMode('dark')).toBe('dark')
  })

  it('migrates legacy screen tint to color mode', () => {
    expect(screenTintToColorMode('bright')).toBe('light')
    expect(screenTintToColorMode('dim')).toBe('dark')
    expect(screenTintToColorMode('default')).toBe('system')
    expect(screenTintToColorMode(undefined)).toBe('system')
  })

  it('defaults to system mode', () => {
    expect(defaultAppSettings.colorMode).toBe('system')
  })
})
