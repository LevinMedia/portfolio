'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  colorModeToScreenTint,
  resolveAppColorMode,
  type AppColorMode,
} from '@/lib/app-settings'
import {
  getC64ThemeColors,
  type C64Accent,
} from '@/lib/c64-settings'

const PREVIEW_LINES = [
  '**** LEVINMEDIA 64 BASIC V2 ****',
  '64K RAM SYSTEM  38911 BASIC BYTES FREE',
] as const

type C64SettingsPreviewProps = {
  accent: C64Accent
  scanlines: boolean
  colorMode: AppColorMode
}

export default function C64SettingsPreview({
  accent,
  scanlines,
  colorMode,
}: C64SettingsPreviewProps) {
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' ? resolveAppColorMode('system') : 'light',
  )

  useEffect(() => {
    if (colorMode !== 'system') return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemScheme(mq.matches ? 'dark' : 'light')
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [colorMode])

  const screenTint = useMemo(() => {
    if (colorMode === 'system') {
      return systemScheme === 'dark' ? 'dim' : 'bright'
    }
    return colorModeToScreenTint(colorMode)
  }, [colorMode, systemScheme])

  const colors = useMemo(
    () => getC64ThemeColors(accent, screenTint),
    [accent, screenTint],
  )

  return (
    <div className="c64-settings-preview" aria-hidden>
      <div
        className="c64-settings-preview__bezel"
        style={{ backgroundColor: colors.crtInk }}
      >
        <div
          className="c64-settings-preview__screen"
          style={{
            backgroundColor: colors.screen,
            color: colors.crtInk,
          }}
        >
          <div className="c64-settings-preview__copy">
            {PREVIEW_LINES.map((line) => (
              <p key={line} className="c64-settings-preview__line">
                {line}
              </p>
            ))}
          </div>
          {scanlines ? <div className="c64-settings-preview__scanlines" aria-hidden /> : null}
        </div>
      </div>
    </div>
  )
}
