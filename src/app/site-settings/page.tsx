'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftIcon, SunIcon, MoonIcon, SwatchIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

const defaultTheme: ThemeSettings = {
  mode: 'system',
  primaryColor: '#C614E1',
  secondaryColor: '#ec4899',
  accentColor: '#0891b2'
}

const colorPresets = [
  { name: 'Party', primary: '#C614E1', secondary: '#ec4899', accent: '#0891b2' },
  { name: 'Blue', primary: '#3b82f6', secondary: '#1d4ed8', accent: '#06b6d4' },
  { name: 'Green', primary: '#10b981', secondary: '#059669', accent: '#34d399' },
  { name: 'Orange', primary: '#f59e0b', secondary: '#d97706', accent: '#fb923c' },
  { name: 'Red', primary: '#ef4444', secondary: '#dc2626', accent: '#f87171' },
  { name: 'Indigo', primary: '#6366f1', secondary: '#4f46e5', accent: '#8b5cf6' }
]

export default function SiteSettings() {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('site-theme')
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme)
        setTheme({ ...defaultTheme, ...parsedTheme })
      } catch (error) {
        console.error('Error parsing saved theme:', error)
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      applyTheme(theme)
      localStorage.setItem('site-theme', JSON.stringify(theme))
    }
  }, [theme, isLoading])

  const applyTheme = (newTheme: ThemeSettings) => {
    const root = document.documentElement
    
    // Apply theme mode
    if (newTheme.mode === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (newTheme.mode === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      // System mode - use system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
    }

    // Apply custom colors
    root.style.setProperty('--primary', newTheme.primaryColor)
    root.style.setProperty('--secondary', newTheme.secondaryColor)
    root.style.setProperty('--accent', newTheme.accentColor)
  }

  const handleModeChange = (mode: 'light' | 'dark' | 'system') => {
    setTheme(prev => ({ ...prev, mode }))
  }

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', color: string) => {
    setTheme(prev => ({ ...prev, [colorType]: color }))
  }

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setTheme(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent
    }))
  }

  // Calculate contrast ratio between two colors
  const getContrastRatio = (color1: string, color2: string): number => {
    const getLuminance = (color: string): number => {
      // Convert hex to RGB
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255

      // Apply gamma correction
      const [rs, gs, bs] = [r, g, b].map(c => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      )

      // Calculate relative luminance
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }

    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }

  // Get contrast ratio status
  const getContrastStatus = (ratio: number): { status: string; color: string; description: string } => {
    if (ratio >= 7) {
      return { status: 'AAA', color: 'text-green-600', description: 'Excellent (AAA)' }
    } else if (ratio >= 4.5) {
      return { status: 'AA', color: 'text-blue-600', description: 'Good (AA)' }
    } else if (ratio >= 3) {
      return { status: 'A', color: 'text-yellow-600', description: 'Acceptable (A)' }
    } else {
      return { status: 'Fail', color: 'text-red-600', description: 'Poor (Fail)' }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-[family-name:var(--font-geist-sans)]" style={{ 
      backgroundImage: `
        linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px),
        linear-gradient(rgba(115, 115, 115, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(115, 115, 115, 0.06) 1px, transparent 1px),
        repeating-linear-gradient(90deg, 
          rgba(0, 100, 255, 0.015) 0, 
          rgba(0, 100, 255, 0.015) calc((100% - 5 * var(--grid-major)) / 6), 
          transparent calc((100% - 5 * var(--grid-major)) / 6), 
          transparent calc((100% - 5 * var(--grid-major)) / 6 + var(--grid-major))
        )
      `,
      backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), 100% 100%',
      backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), 0 0'
    }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-geist-mono)]">
            Site Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Customize your site&apos;s appearance and theme
          </p>
        </div>

        <div className="space-y-8">
          {/* Theme Mode */}
          <div className="bg-background border border-border/20 rounded-lg p-6" style={{ 
            backgroundImage: `
              linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
            backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
          }}>
            <h2 className="text-xl font-semibold text-foreground mb-4 font-[family-name:var(--font-geist-mono)]">
              Theme Mode
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleModeChange('light')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme.mode === 'light' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border/20 hover:border-border/40'
                }`}
              >
                <SunIcon className="h-8 w-8 mx-auto mb-2 text-foreground" />
                <div className="text-sm font-medium text-foreground">Light</div>
                <div className="text-xs text-muted-foreground">Always light mode</div>
              </button>
              
              <button
                onClick={() => handleModeChange('dark')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme.mode === 'dark' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border/20 hover:border-border/40'
                }`}
              >
                <MoonIcon className="h-8 w-8 mx-auto mb-2 text-foreground" />
                <div className="text-sm font-medium text-foreground">Dark</div>
                <div className="text-xs text-muted-foreground">Always dark mode</div>
              </button>
              
              <button
                onClick={() => handleModeChange('system')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme.mode === 'system' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border/20 hover:border-border/40'
                }`}
              >
                <SwatchIcon className="h-8 w-8 mx-auto mb-2 text-foreground" />
                <div className="text-sm font-medium text-foreground">System</div>
                <div className="text-xs text-muted-foreground">Follow system preference</div>
              </button>
            </div>
          </div>

          {/* Color Presets */}
          <div className="bg-background border border-border/20 rounded-lg p-6" style={{ 
            backgroundImage: `
              linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
            backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
          }}>
            <h2 className="text-xl font-semibold text-foreground mb-4 font-[family-name:var(--font-geist-mono)]">
              Color Presets
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="p-4 rounded-lg border border-border/20 hover:border-border/40 transition-all group"
                >
                  <div className="flex space-x-1 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: preset.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                  <div className="text-sm font-medium text-foreground">{preset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="bg-background border border-border/20 rounded-lg p-6" style={{ 
            backgroundImage: `
              linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
            backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
          }}>
            <h2 className="text-xl font-semibold text-foreground mb-4 font-[family-name:var(--font-geist-mono)]">
              Custom Colors
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-border/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="flex-1 px-3 py-2 border border-border/20 rounded-md bg-background text-foreground"
                    placeholder="#C614E1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-border/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="flex-1 px-3 py-2 border border-border/20 rounded-md bg-background text-foreground"
                    placeholder="#ec4899"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Accent Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-border/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="flex-1 px-3 py-2 border border-border/20 rounded-md bg-background text-foreground"
                    placeholder="#0891b2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-background border border-border/20 rounded-lg p-6" style={{ 
            backgroundImage: `
              linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
            backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
          }}>
            <h2 className="text-xl font-semibold text-foreground mb-4 font-[family-name:var(--font-geist-mono)]">
              Preview & Contrast Analysis
            </h2>
            <div className="space-y-6">
              {/* Button Preview */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Button Preview</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium">
                    Primary Button
                  </button>
                  <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium">
                    Secondary Button
                  </button>
                  <button className="px-4 py-2 bg-accent text-accent-foreground rounded-md font-medium">
                    Accent Button
                  </button>
                </div>
              </div>

              {/* Contrast Ratio Analysis */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Contrast Ratio Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Primary Button Contrast */}
                  <div className="p-3 bg-muted/50 rounded-lg border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">Primary Button</div>
                    <div className="text-sm font-medium text-foreground mb-2">
                      {theme.primaryColor} on {theme.primaryColor === '#C614E1' ? '#ffffff' : '#ffffff'}
                    </div>
                    {(() => {
                      const ratio = getContrastRatio(theme.primaryColor, '#ffffff')
                      const status = getContrastStatus(ratio)
                      return (
                        <div className="space-y-1">
                          <div className={`text-sm font-medium ${status.color}`}>
                            {status.status} - {ratio.toFixed(2)}:1
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {status.description}
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Secondary Button Contrast */}
                  <div className="p-3 bg-muted/50 rounded-lg border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">Secondary Button</div>
                    <div className="text-sm font-medium text-foreground mb-2">
                      {theme.secondaryColor} on {theme.secondaryColor === '#ec4899' ? '#ffffff' : '#ffffff'}
                    </div>
                    {(() => {
                      const ratio = getContrastRatio(theme.secondaryColor, '#ffffff')
                      const status = getContrastStatus(ratio)
                      return (
                        <div className="space-y-1">
                          <div className={`text-sm font-medium ${status.color}`}>
                            {status.status} - {ratio.toFixed(2)}:1
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {status.description}
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Accent Button Contrast */}
                  <div className="p-3 bg-muted/50 rounded-lg border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">Accent Button</div>
                    <div className="text-sm font-medium text-foreground mb-2">
                      {theme.accentColor} on {theme.accentColor === '#0891b2' ? '#ffffff' : '#ffffff'}
                    </div>
                    {(() => {
                      const ratio = getContrastRatio(theme.accentColor, '#ffffff')
                      const status = getContrastStatus(ratio)
                      return (
                        <div className="space-y-1">
                          <div className={`text-sm font-medium ${status.color}`}>
                            {status.status} - {ratio.toFixed(2)}:1
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {status.description}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Accessibility Guidelines */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border/20">
                <h3 className="text-sm font-medium text-foreground mb-2">Accessibility Guidelines</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• <strong>AAA:</strong> 7:1 or higher (excellent for all users)</div>
                  <div>• <strong>AA:</strong> 4.5:1 or higher (good for most users)</div>
                  <div>• <strong>A:</strong> 3:1 or higher (acceptable for large text)</div>
                  <div>• <strong>Fail:</strong> Below 3:1 (poor accessibility)</div>
                </div>
              </div>

              {/* Sample Content */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="text-foreground font-medium mb-2">Sample Content</h3>
                <p className="text-muted-foreground text-sm">
                  This is how your content will look with the current theme settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
