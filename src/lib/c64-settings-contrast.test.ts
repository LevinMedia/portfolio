import { describe, expect, it } from 'vitest'
import chroma from 'chroma-js'
import { C64_INLINE_THEME_VARS_JSON, WCAG_AA_NORMAL_TEXT } from './c64-settings'

type ThemeVars = Record<string, string>

describe('C64 theme contrast (WCAG AA)', () => {
  const themes = JSON.parse(C64_INLINE_THEME_VARS_JSON) as Record<
    string,
    Record<string, ThemeVars>
  >

  for (const [accent, tints] of Object.entries(themes)) {
    for (const [tint, vars] of Object.entries(tints)) {
      const label = `${accent}/${tint}`
      const screen = vars['--c64-screen-bg']
      const border = vars['--c64-border-bg']

      it(`${label}: foreground on screen`, () => {
        expect(chroma.contrast(vars['--foreground'], screen)).toBeGreaterThanOrEqual(
          WCAG_AA_NORMAL_TEXT,
        )
      })

      it(`${label}: muted-foreground on screen`, () => {
        expect(chroma.contrast(vars['--muted-foreground'], screen)).toBeGreaterThanOrEqual(
          WCAG_AA_NORMAL_TEXT,
        )
      })

      it(`${label}: heading on screen`, () => {
        expect(
          chroma.contrast(vars['--c64-heading-on-screen'], screen),
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
      })

      it(`${label}: link on screen`, () => {
        expect(chroma.contrast(vars['--c64-link-on-screen'], screen)).toBeGreaterThanOrEqual(
          WCAG_AA_NORMAL_TEXT,
        )
      })

      it(`${label}: drawer header text on border`, () => {
        expect(
          chroma.contrast(vars['--c64-drawer-header-text'], border),
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
      })
    }
  }
})
