import { VT323 } from 'next/font/google'
import localFont from 'next/font/local'

/** Public-site fonts. The variable classes set --font-vt323 and --font-c64-pro. */
export const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
})

export const c64ProMono = localFont({
  src: '../../public/fonts/C64_Pro_Mono-STYLE.woff2',
  display: 'swap',
  variable: '--font-c64-pro',
  fallback: ['ui-monospace', 'monospace'],
  preload: true,
})
