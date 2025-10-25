'use client'

import { useState, useEffect } from 'react'
import { SunIcon, MoonIcon, SwatchIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import Button from './Button'
import chroma from 'chroma-js'

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

const defaultTheme: ThemeSettings = {
  mode: 'system',
  primaryColor: '#C614E1',
  secondaryColor: '#cc3f84',
  accentColor: '#087d9a'
}

const colorPresets = [
  { name: 'Party', primary: '#c614e1', secondary: '#cc3f84', accent: '#087d9a' },
  { name: 'Cosmos', primary: '#3370d5', secondary: '#8458ea', accent: '#9e670a' },
  { name: 'Forest', primary: '#0a845d', secondary: '#087d9a', accent: '#dc2626' },
  { name: 'United', primary: '#d23e10', secondary: '#dc2626', accent: '#3370d5' },
  { name: 'Rose', primary: '#cf3b3b', secondary: '#cc3f84', accent: '#0a845d' }
]

export default function SiteSettingsContent() {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme)
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>('Party')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('site-theme')
    const savedPreset = localStorage.getItem('selected-preset')
    
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme)
        setTheme({ ...defaultTheme, ...parsedTheme })
      } catch (error) {
        console.error('Error parsing saved theme:', error)
      }
    }
    
    if (savedPreset) {
      setSelectedPreset(savedPreset)
    }
    
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      applyTheme(theme)
      localStorage.setItem('site-theme', JSON.stringify(theme))
    }
  }, [theme, isLoading])

  useEffect(() => {
    // Detect dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    
    checkDarkMode()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

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
    setSelectedPreset('Custom') // Automatically switch to Custom when manually changing colors
    
    const newTheme = { 
      ...theme, 
      [`${colorType}Color`]: color 
    }
    setTheme(newTheme)
    
    // Apply immediately to the site
    const root = document.documentElement
    root.style.setProperty(`--${colorType}`, color)
    
    // Save to localStorage immediately
    localStorage.setItem('site-theme', JSON.stringify(newTheme))
    localStorage.setItem('selected-preset', 'Custom')
  }

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setSelectedPreset(preset.name)
    setTheme(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent
    }))
    localStorage.setItem('selected-preset', preset.name)
  }

  const handleCustom = () => {
    // Switch to custom mode, keeping current colors
    setSelectedPreset('Custom')
    localStorage.setItem('selected-preset', 'Custom')
  }

  const isPresetSelected = (presetName: string) => {
    return selectedPreset === presetName
  }

  const getContrastRatio = (foreground: string, background: string): number => {
    try {
      return chroma.contrast(foreground, background)
    } catch {
      return 0
    }
  }

  const getA11yLevel = (ratio: number): { level: string; color: string } => {
    if (ratio >= 7) {
      return { level: 'AAA', color: 'text-green-600 dark:text-green-400' }
    } else if (ratio >= 4.5) {
      return { level: 'AA', color: 'text-blue-600 dark:text-blue-400' }
    } else if (ratio >= 3) {
      return { level: 'A', color: 'text-yellow-600 dark:text-yellow-400' }
    } else {
      return { level: 'FAIL', color: 'text-red-600 dark:text-red-400' }
    }
  }

  const adjustForDarkMode = (color: string): string => {
    // In dark mode, outline/ghost buttons get brightness-125 filter
    if (isDarkMode) {
      try {
        return chroma(color).brighten(0.25).hex()
      } catch {
        return color
      }
    }
    return color
  }

  const getButtonTextColor = (bgColor: string): string => {
    try {
      const whiteContrast = chroma.contrast(bgColor, '#ffffff')
      const darkContrast = chroma.contrast(bgColor, '#09090b')
      // Use dark text if it has better contrast than white
      return darkContrast > whiteContrast ? '#09090b' : '#ffffff'
    } catch {
      return '#ffffff'
    }
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
            const isSelected = isPresetSelected(preset.name)
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
          
          {/* Custom Preset */}
          <button
            onClick={handleCustom}
            className={`relative p-3 rounded-lg border-2 transition-all group ${
              isPresetSelected('Custom')
                ? 'border-primary bg-primary/10 shadow-lg' 
                : 'border-border/20 hover:border-border/40'
            }`}
          >
            {isPresetSelected('Custom') && (
              <div className="absolute -top-2 -right-2 bg-primary rounded-full p-0.5">
                <CheckCircleIcon className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div className="flex space-x-1 mb-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: theme.primaryColor }}
              />
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: theme.secondaryColor }}
              />
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: theme.accentColor }}
              />
            </div>
            <div className={`text-sm font-medium ${isPresetSelected('Custom') ? 'text-primary' : 'text-foreground'}`}>
              Custom
            </div>
          </button>
        </div>
      </div>

      {/* Custom Colors - Only show when Custom preset is selected */}
      {isPresetSelected('Custom') && (
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
      )}

      {/* Button Preview */}
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
                  <div>
                    <Button key={theme.primaryColor} style="solid" color="primary" size="small" fullWidth>Primary</Button>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center font-mono">
                      {(() => {
                        const textColor = getButtonTextColor(theme.primaryColor)
                        const ratio = getContrastRatio(textColor, theme.primaryColor)
                        const a11y = getA11yLevel(ratio)
                        return (
                          <>
                            {textColor} / {theme.primaryColor} · {ratio.toFixed(2)}:1 <span className={a11y.color}>{a11y.level}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div>
                    <Button key={theme.secondaryColor} style="solid" color="secondary" size="small" fullWidth>Secondary</Button>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center font-mono">
                      {(() => {
                        const textColor = getButtonTextColor(theme.secondaryColor)
                        const ratio = getContrastRatio(textColor, theme.secondaryColor)
                        const a11y = getA11yLevel(ratio)
                        return (
                          <>
                            {textColor} / {theme.secondaryColor} · {ratio.toFixed(2)}:1 <span className={a11y.color}>{a11y.level}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div>
                    <Button key={theme.accentColor} style="solid" color="accent" size="small" fullWidth>Accent</Button>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center font-mono">
                      {(() => {
                        const textColor = getButtonTextColor(theme.accentColor)
                        const ratio = getContrastRatio(textColor, theme.accentColor)
                        const a11y = getA11yLevel(ratio)
                        return (
                          <>
                            {textColor} / {theme.accentColor} · {ratio.toFixed(2)}:1 <span className={a11y.color}>{a11y.level}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Outline Buttons */}
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Outline</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Button key={`outline-${theme.primaryColor}`} style="outline" color="primary" size="small" fullWidth>Primary</Button>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center font-mono">
                      {(() => {
                        const bg = isDarkMode ? '#09090b' : '#ffffff'
                        const color = adjustForDarkMode(theme.primaryColor)
                        const ratio = getContrastRatio(color, bg)
                        const a11y = getA11yLevel(ratio)
                        return (
                          <>
                            {theme.primaryColor} / {bg} · {ratio.toFixed(2)}:1 <span className={a11y.color}>{a11y.level}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div>
                    <Button key={`outline-${theme.secondaryColor}`} style="outline" color="secondary" size="small" fullWidth>Secondary</Button>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center font-mono">
                      {(() => {
                        const bg = isDarkMode ? '#09090b' : '#ffffff'
                        const color = adjustForDarkMode(theme.secondaryColor)
                        const ratio = getContrastRatio(color, bg)
                        const a11y = getA11yLevel(ratio)
                        return (
                          <>
                            {theme.secondaryColor} / {bg} · {ratio.toFixed(2)}:1 <span className={a11y.color}>{a11y.level}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div>
                    <Button key={`outline-${theme.accentColor}`} style="outline" color="accent" size="small" fullWidth>Accent</Button>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center font-mono">
                      {(() => {
                        const bg = isDarkMode ? '#09090b' : '#ffffff'
                        const color = adjustForDarkMode(theme.accentColor)
                        const ratio = getContrastRatio(color, bg)
                        const a11y = getA11yLevel(ratio)
                        return (
                          <>
                            {theme.accentColor} / {bg} · {ratio.toFixed(2)}:1 <span className={a11y.color}>{a11y.level}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Ghost Buttons */}
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Ghost</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Button key={`ghost-${theme.primaryColor}`} style="ghost" color="primary" size="small" fullWidth>Primary</Button>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center font-mono">
                      {(() => {
                        const bg = isDarkMode ? '#09090b' : '#ffffff'
                        const color = adjustForDarkMode(theme.primaryColor)
                        const ratio = getContrastRatio(color, bg)
                        const a11y = getA11yLevel(ratio)
                        return (
                          <>
                            {theme.primaryColor} / {bg} · {ratio.toFixed(2)}:1 <span className={a11y.color}>{a11y.level}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div>
                    <Button key={`ghost-${theme.secondaryColor}`} style="ghost" color="secondary" size="small" fullWidth>Secondary</Button>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center font-mono">
                      {(() => {
                        const bg = isDarkMode ? '#09090b' : '#ffffff'
                        const color = adjustForDarkMode(theme.secondaryColor)
                        const ratio = getContrastRatio(color, bg)
                        const a11y = getA11yLevel(ratio)
                        return (
                          <>
                            {theme.secondaryColor} / {bg} · {ratio.toFixed(2)}:1 <span className={a11y.color}>{a11y.level}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div>
                    <Button key={`ghost-${theme.accentColor}`} style="ghost" color="accent" size="small" fullWidth>Accent</Button>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center font-mono">
                      {(() => {
                        const bg = isDarkMode ? '#09090b' : '#ffffff'
                        const color = adjustForDarkMode(theme.accentColor)
                        const ratio = getContrastRatio(color, bg)
                        const a11y = getA11yLevel(ratio)
                        return (
                          <>
                            {theme.accentColor} / {bg} · {ratio.toFixed(2)}:1 <span className={a11y.color}>{a11y.level}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
        </div>
      </div>
    </div>
  )
}
