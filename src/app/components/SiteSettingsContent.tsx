'use client'

import { useState, useEffect } from 'react'
import { SunIcon, MoonIcon, SwatchIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import Button from './Button'

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

export default function SiteSettingsContent() {
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

  const isPresetSelected = (preset: typeof colorPresets[0]) => {
    return theme.primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
           theme.secondaryColor.toLowerCase() === preset.secondary.toLowerCase() &&
           theme.accentColor.toLowerCase() === preset.accent.toLowerCase()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Theme Mode */}
      <div className="bg-background border border-border/20 rounded-lg p-4" style={{ 
        backgroundImage: `
          linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
        backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
      }}>
        <h3 className="text-lg font-semibold text-foreground mb-3 font-[family-name:var(--font-geist-mono)]">
          Theme Mode
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleModeChange('light')}
            className={`p-3 rounded-lg border-2 transition-all ${
              theme.mode === 'light' 
                ? 'border-primary bg-primary/10' 
                : 'border-border/20 hover:border-border/40'
            }`}
          >
            <SunIcon className="h-6 w-6 mx-auto mb-2 text-foreground" />
            <div className="text-sm font-medium text-foreground">Light</div>
            <div className="text-xs text-muted-foreground">Always light mode</div>
          </button>
          
          <button
            onClick={() => handleModeChange('dark')}
            className={`p-3 rounded-lg border-2 transition-all ${
              theme.mode === 'dark' 
                ? 'border-primary bg-primary/10' 
                : 'border-border/20 hover:border-border/40'
            }`}
          >
            <MoonIcon className="h-6 w-6 mx-auto mb-2 text-foreground" />
            <div className="text-sm font-medium text-foreground">Dark</div>
            <div className="text-xs text-muted-foreground">Always dark mode</div>
          </button>
          
          <button
            onClick={() => handleModeChange('system')}
            className={`p-3 rounded-lg border-2 transition-all ${
              theme.mode === 'system' 
                ? 'border-primary bg-primary/10' 
                : 'border-border/20 hover:border-border/40'
            }`}
          >
            <SwatchIcon className="h-6 w-6 mx-auto mb-2 text-foreground" />
            <div className="text-sm font-medium text-foreground">System</div>
            <div className="text-xs text-muted-foreground">Follow system preference</div>
          </button>
        </div>
      </div>

      {/* Color Presets */}
      <div className="bg-background border border-border/20 rounded-lg p-4" style={{ 
        backgroundImage: `
          linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
        backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
      }}>
        <h3 className="text-lg font-semibold text-foreground mb-3 font-[family-name:var(--font-geist-mono)]">
          Color Presets
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {colorPresets.map((preset) => {
            const isSelected = isPresetSelected(preset)
            return (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`relative p-3 rounded-lg border-2 transition-all group ${
                  isSelected 
                    ? 'border-primary bg-primary/10 shadow-lg' 
                    : 'border-border/20 hover:border-border/40'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-primary rounded-full p-0.5">
                    <CheckCircleIcon className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
                <div className="flex space-x-1 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: preset.secondary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: preset.accent }}
                  />
                </div>
                <div className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {preset.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="bg-background border border-border/20 rounded-lg p-4" style={{ 
        backgroundImage: `
          linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
        backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
      }}>
        <h3 className="text-lg font-semibold text-foreground mb-3 font-[family-name:var(--font-geist-mono)]">
          Custom Colors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="w-10 h-10 rounded-lg border border-border/20 cursor-pointer"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="flex-1 px-2 py-1 border border-border/20 rounded-md bg-background text-foreground text-sm"
                placeholder="#C614E1"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Secondary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={theme.secondaryColor}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="w-10 h-10 rounded-lg border border-border/20 cursor-pointer"
              />
              <input
                type="text"
                value={theme.secondaryColor}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="flex-1 px-2 py-1 border border-border/20 rounded-md bg-background text-foreground text-sm"
                placeholder="#ec4899"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Accent Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="w-10 h-10 rounded-lg border border-border/20 cursor-pointer"
              />
              <input
                type="text"
                value={theme.accentColor}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="flex-1 px-2 py-1 border border-border/20 rounded-md bg-background text-foreground text-sm"
                placeholder="#0891b2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview & Contrast Analysis */}
      <div className="bg-background border border-border/20 rounded-lg p-4" style={{ 
        backgroundImage: `
          linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)',
        backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major)'
      }}>
        <h3 className="text-lg font-semibold text-foreground mb-3 font-[family-name:var(--font-geist-mono)]">
          Button Preview
        </h3>
        <div className="space-y-3">
              {/* Solid Buttons */}
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Solid</div>
                <div className="grid grid-cols-3 gap-2">
                  <Button style="solid" color="primary" size="small" fullWidth>Primary</Button>
                  <Button style="solid" color="secondary" size="small" fullWidth>Secondary</Button>
                  <Button style="solid" color="accent" size="small" fullWidth>Accent</Button>
                </div>
              </div>
              
              {/* Outline Buttons */}
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Outline</div>
                <div className="grid grid-cols-3 gap-2">
                  <Button style="outline" color="primary" size="small" fullWidth>Primary</Button>
                  <Button style="outline" color="secondary" size="small" fullWidth>Secondary</Button>
                  <Button style="outline" color="accent" size="small" fullWidth>Accent</Button>
                </div>
              </div>
              
              {/* Ghost Buttons */}
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Ghost</div>
                <div className="grid grid-cols-3 gap-2">
                  <Button style="ghost" color="primary" size="small" fullWidth>Primary</Button>
                  <Button style="ghost" color="secondary" size="small" fullWidth>Secondary</Button>
                  <Button style="ghost" color="accent" size="small" fullWidth>Accent</Button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}
