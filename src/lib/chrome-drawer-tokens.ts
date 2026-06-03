/**
 * Chrome drawer theme tokens (must stay in sync with globals.css [data-chrome-theme]).
 */

export const CHROME_THEME_TOKENS = {
  light: {
    '--chrome-text': '#1d1d1f',
    '--chrome-muted': '#6e6e73',
    '--chrome-card-bg': '#ffffff',
    '--chrome-header-bg': '#ffffff',
    '--chrome-bg-solid': '#f5f5f7',
    '--chrome-accent': '#0071e3',
  },
  dark: {
    '--chrome-text': '#f5f5f7',
    '--chrome-muted': '#98989d',
    '--chrome-card-bg': '#2c2c2e',
    '--chrome-header-bg': '#2c2c2e',
    '--chrome-bg-solid': '#1c1c1e',
    '--chrome-accent': '#64b5ff',
  },
} as const
