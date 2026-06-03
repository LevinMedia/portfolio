import { describe, expect, it } from 'vitest'
import chroma from 'chroma-js'
import { WCAG_AA_NORMAL_TEXT } from './c64-settings'
import { CHROME_THEME_TOKENS } from './chrome-drawer-tokens'

describe('Chrome drawer contrast (WCAG AA)', () => {
  for (const [theme, vars] of Object.entries(CHROME_THEME_TOKENS)) {
    const label = theme
    const text = vars['--chrome-text']
    const muted = vars['--chrome-muted']
    const card = vars['--chrome-card-bg']
    const sheet = vars['--chrome-bg-solid']
    const accent = vars['--chrome-accent']

    it(`${label}: text on card background`, () => {
      expect(chroma.contrast(text, card)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
    })

    it(`${label}: text on sheet background`, () => {
      expect(chroma.contrast(text, sheet)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
    })

    it(`${label}: muted on card background`, () => {
      expect(chroma.contrast(muted, card)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
    })

    it(`${label}: accent on card background`, () => {
      expect(chroma.contrast(accent, card)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
    })
  }
})
