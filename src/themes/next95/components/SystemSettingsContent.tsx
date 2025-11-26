'use client'

import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import Next95Button from './Next95Button'

type WallpaperId = 'teal' | 'sunset' | 'grid'
type ScreensaverId = 'none' | 'pipes' | 'stars'

interface Next95Settings {
  primaryColor: string
  secondaryColor: string
  windowHeaderType: 'solid' | 'gradient'
  windowHeaderSolid: string
  windowHeaderGradient: string
  colorMode: 'light' | 'dark' | 'system'
  desktopWallpaper: WallpaperId
  screensaverMode: ScreensaverId
  screensaverTimeout: number
}

const defaultSettings: Next95Settings = {
  primaryColor: '#0000ff',
  secondaryColor: '#ff00ff',
  windowHeaderType: 'gradient',
  windowHeaderSolid: '#000080',
  windowHeaderGradient: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
  colorMode: 'light',
  desktopWallpaper: 'teal',
  screensaverMode: 'none',
  screensaverTimeout: 10
}

const colorPresets = [
  { name: 'Classic', primary: '#0000ff', secondary: '#ff00ff' },
  { name: 'Forest', primary: '#008000', secondary: '#ff6600' },
  { name: 'Sunset', primary: '#ff6600', secondary: '#ff00ff' },
  { name: 'Ocean', primary: '#0080ff', secondary: '#00ff80' },
  { name: 'Fire', primary: '#ff0000', secondary: '#ff6600' },
  { name: 'Purple', primary: '#800080', secondary: '#ff00ff' }
]

const gradientPresets = [
  { name: 'Classic Blue', gradient: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)' },
  { name: 'Teal', gradient: 'linear-gradient(90deg, #008080 0%, #20b2aa 100%)' },
  { name: 'Purple', gradient: 'linear-gradient(90deg, #800080 0%, #da70d6 100%)' },
  { name: 'Green', gradient: 'linear-gradient(90deg, #006400 0%, #32cd32 100%)' },
  { name: 'Red', gradient: 'linear-gradient(90deg, #8b0000 0%, #ff6347 100%)' },
  { name: 'Orange', gradient: 'linear-gradient(90deg, #ff8c00 0%, #ffa500 100%)' }
]

const wallpaperOptions: Array<{
  id: WallpaperId
  label: string
  description: string
  previewStyle: CSSProperties
}> = [
  {
    id: 'teal',
    label: 'Classic Teal',
    description: 'Original Next95 desktop',
    previewStyle: {
      backgroundColor: '#008080'
    }
  },
  {
    id: 'sunset',
    label: 'Sunset Glow',
    description: 'Win95 Plus! inspired gradient',
    previewStyle: {
      backgroundImage: 'linear-gradient(135deg, #d16ba5 0%, #86a8e7 50%, #5ffbf1 100%)'
    }
  },
  {
    id: 'grid',
    label: 'Retro Grid',
    description: 'Neon grid overlay',
    previewStyle: {
      backgroundColor: '#031b34',
      backgroundImage: `
        linear-gradient(90deg, rgba(0,255,255,0.25) 1px, transparent 1px),
        linear-gradient(rgba(0,255,255,0.25) 1px, transparent 1px),
        radial-gradient(circle at center, rgba(0,128,255,0.25), transparent 60%)
      `,
      backgroundSize: '40px 40px, 40px 40px, cover'
    }
  }
]

const screensaverOptions: Array<{ id: ScreensaverId; label: string; description: string }> = [
  { id: 'none', label: 'None', description: 'Disable screen saver' },
  { id: 'pipes', label: '3D Pipes', description: 'Classic maze of pipes' },
  { id: 'stars', label: 'Starfield', description: 'Fly through space forever' }
]

interface SystemSettingsContentProps {
  activeTab: 'desktop' | 'appearance'
}

export default function SystemSettingsContent({ activeTab }: SystemSettingsContentProps) {
  const [settings, setSettings] = useState<Next95Settings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState('Classic')
  const [selectedGradient, setSelectedGradient] = useState('Classic Blue')
  const [gradientStops, setGradientStops] = useState<Array<{ color: string; position: number }>>([
    { color: '#000080', position: 0 },
    { color: '#1084d0', position: 100 }
  ])

  const bevelLight = 'var(--win95-bevel-light, rgba(255, 255, 255, 0.35))'
  const bevelDark = 'var(--win95-bevel-dark, rgba(0, 0, 0, 0.35))'
  const insetSunken = `inset -2px -2px 0 0 ${bevelLight}, inset 2px 2px 0 0 ${bevelDark}`
  const insetRaised = `inset -2px -2px 0 0 ${bevelDark}, inset 2px 2px 0 0 ${bevelLight}`

  useEffect(() => {
    const savedSettings = localStorage.getItem('next95-settings')
    const savedPreset = localStorage.getItem('next95-preset')
    const savedGradient = localStorage.getItem('next95-gradient-preset')

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsedSettings })

        if (parsedSettings.windowHeaderGradient && parsedSettings.windowHeaderType === 'gradient') {
          const matches = parsedSettings.windowHeaderGradient.match(/#[0-9a-fA-F]{6}/g)
          const positions = parsedSettings.windowHeaderGradient.match(/(\d+)%/g)
          if (matches && positions) {
            setGradientStops(matches.map((color: string, i: number) => ({
              color,
              position: parseInt(positions[i])
            })))
          }
        }
      } catch (error) {
        console.error('Error parsing saved settings:', error)
      }
    } else {
      applySettings(defaultSettings)
    }

    setSelectedPreset(savedPreset ?? 'Classic')
    setSelectedGradient(savedGradient ?? 'Classic Blue')
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      applySettings(settings)
      localStorage.setItem('next95-settings', JSON.stringify(settings))
    }
  }, [settings, isLoading])

  const applyWallpaper = (wallpaperId: WallpaperId) => {
    const wallpaper = wallpaperOptions.find((option) => option.id === wallpaperId) ?? wallpaperOptions[0]
    const root = document.documentElement
    const fallbackColor = (wallpaper.previewStyle.backgroundColor as string) ?? '#008080'
    root.style.setProperty('--background', fallbackColor)
    document.body.style.backgroundColor = fallbackColor
    if (wallpaper.previewStyle.backgroundImage) {
      document.body.style.backgroundImage = wallpaper.previewStyle.backgroundImage as string
      const bgSize = wallpaper.previewStyle.backgroundSize
      document.body.style.backgroundSize = typeof bgSize === 'string' ? bgSize : 'cover'
    } else {
      document.body.style.backgroundImage = 'none'
    }
  }

  const applySettings = (newSettings: Next95Settings) => {
    const root = document.documentElement
    root.style.setProperty('--next95-primary', newSettings.primaryColor)
    root.style.setProperty('--next95-secondary', newSettings.secondaryColor)

    if (newSettings.windowHeaderType === 'solid') {
      root.style.setProperty('--next95-window-header', newSettings.windowHeaderSolid)
      root.style.setProperty('--next95-window-header-text', getTextColorForBackground(newSettings.windowHeaderSolid))
    } else {
      root.style.setProperty('--next95-window-header', newSettings.windowHeaderGradient)
      root.style.setProperty('--next95-window-header-text', '#ffffff')
    }

    if (newSettings.colorMode === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (newSettings.colorMode === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
    }

    applyWallpaper(newSettings.desktopWallpaper)
  }

  const getTextColorForBackground = (bgColor: string) => {
    const hex = bgColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  const handleColorChange = (colorType: 'primary' | 'secondary', color: string) => {
    setSelectedPreset('Custom')
    const newSettings = { ...settings, [`${colorType}Color`]: color }
    setSettings(newSettings)
    document.documentElement.style.setProperty(`--next95-${colorType}`, color)
    localStorage.setItem('next95-preset', 'Custom')
  }

  const handleWindowHeaderTypeChange = (type: 'solid' | 'gradient') => {
    setSettings((prev) => ({ ...prev, windowHeaderType: type }))
  }

  const handleColorModeChange = (mode: 'light' | 'dark' | 'system') => {
    const newSettings = { ...settings, colorMode: mode }
    setSettings(newSettings)
    localStorage.setItem('next95-settings', JSON.stringify(newSettings))
    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (mode === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
    }
  }

  const handleWindowHeaderSolidChange = (color: string) => {
    setSettings((prev) => ({ ...prev, windowHeaderSolid: color, windowHeaderType: 'solid' }))
    setSelectedGradient('Custom')
  }

  const applyGradientPreset = (preset: typeof gradientPresets[number]) => {
    setSelectedGradient(preset.name)
    setSettings((prev) => ({ ...prev, windowHeaderGradient: preset.gradient, windowHeaderType: 'gradient' }))
    localStorage.setItem('next95-gradient-preset', preset.name)
    const matches = preset.gradient.match(/#[0-9a-fA-F]{6}/g)
    const positions = preset.gradient.match(/(\d+)%/g)
    if (matches && positions) {
      setGradientStops(matches.map((color, i) => ({ color, position: parseInt(positions[i]) })))
    }
  }

  const handleGradientStopChange = (index: number, field: 'color' | 'position', value: string | number) => {
    const newStops = [...gradientStops]
    newStops[index] = { ...newStops[index], [field]: value }
    newStops.sort((a, b) => a.position - b.position)
    setGradientStops(newStops)
    const gradientString = `linear-gradient(90deg, ${newStops.map((stop) => `${stop.color} ${stop.position}%`).join(', ')})`
    setSettings((prev) => ({ ...prev, windowHeaderGradient: gradientString, windowHeaderType: 'gradient' }))
    setSelectedGradient('Custom')
    localStorage.setItem('next95-gradient-preset', 'Custom')
  }

  const addGradientStop = () => {
    const sortedStops = [...gradientStops].sort((a, b) => a.position - b.position)
    let maxGap = 0
    let maxGapIndex = 0
    for (let i = 0; i < sortedStops.length - 1; i++) {
      const gap = sortedStops[i + 1].position - sortedStops[i].position
      if (gap > maxGap) {
        maxGap = gap
        maxGapIndex = i
      }
    }
    const newPosition = Math.round((sortedStops[maxGapIndex].position + sortedStops[maxGapIndex + 1].position) / 2)
    const newColor = sortedStops[maxGapIndex].color
    const newStops = [...gradientStops, { color: newColor, position: newPosition }].sort((a, b) => a.position - b.position)
    setGradientStops(newStops)
    const gradientString = `linear-gradient(90deg, ${newStops.map((stop) => `${stop.color} ${stop.position}%`).join(', ')})`
    setSettings((prev) => ({ ...prev, windowHeaderGradient: gradientString, windowHeaderType: 'gradient' }))
    setSelectedGradient('Custom')
    localStorage.setItem('next95-gradient-preset', 'Custom')
  }

  const removeGradientStop = (index: number) => {
    if (gradientStops.length <= 2) return
    const newStops = gradientStops.filter((_, i) => i !== index).sort((a, b) => a.position - b.position)
    setGradientStops(newStops)
    const gradientString = `linear-gradient(90deg, ${newStops.map((stop) => `${stop.color} ${stop.position}%`).join(', ')})`
    setSettings((prev) => ({ ...prev, windowHeaderGradient: gradientString, windowHeaderType: 'gradient' }))
    setSelectedGradient('Custom')
    localStorage.setItem('next95-gradient-preset', 'Custom')
  }

  const applyPreset = (preset: typeof colorPresets[number]) => {
    setSelectedPreset(preset.name)
    setSettings((prev) => ({ ...prev, primaryColor: preset.primary, secondaryColor: preset.secondary }))
    localStorage.setItem('next95-preset', preset.name)
  }

  const handleCustom = () => {
    setSelectedPreset('Custom')
    localStorage.setItem('next95-preset', 'Custom')
  }

  const isPresetSelected = (presetName: string) => selectedPreset === presetName

  const handleDesktopWallpaperChange = (wallpaperId: WallpaperId) => {
    setSettings((prev) => ({ ...prev, desktopWallpaper: wallpaperId }))
    applyWallpaper(wallpaperId)
  }

  const handleScreensaverModeChange = (mode: ScreensaverId) => {
    setSettings((prev) => ({ ...prev, screensaverMode: mode }))
  }

  const handleScreensaverTimeoutChange = (timeout: number) => {
    setSettings((prev) => ({ ...prev, screensaverTimeout: Math.max(1, timeout) }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ backgroundColor: 'var(--win95-button-face, #c0c0c0)' }}>
        <div className="text-sm">Loading...</div>
      </div>
    )
  }

  const renderDesktopTab = () => (
    <>
        <div className="border-2 p-3 space-y-3" style={{ backgroundColor: 'var(--win95-content-bg, #ffffff)', borderColor: 'var(--win95-border-mid, #808080)' }}>
        <div className="text-sm font-bold" style={{ color: 'var(--win95-content-text, #000000)' }}>Desktop Background</div>
        <div className="grid grid-cols-1 @[600px]:grid-cols-3 gap-2">
          {wallpaperOptions.map((option) => {
            const isActive = settings.desktopWallpaper === option.id
            return (
              <button
                key={option.id}
                onClick={() => handleDesktopWallpaperChange(option.id)}
                className="p-2 text-left border-2"
                style={{
                  borderColor: isActive ? 'var(--next95-primary, #000080)' : 'var(--win95-border-mid, #808080)',
                  backgroundColor: 'var(--win95-content-bg, #ffffff)',
                  color: 'var(--win95-content-text, #000000)',
                  boxShadow: isActive ? insetSunken : insetRaised
                }}
              >
                <div className="h-20 border mb-2" style={{ ...option.previewStyle, borderColor: 'var(--win95-border-dark, #000)' }} />
                <div className="font-bold text-sm">{option.label}</div>
                <div className="text-xs" style={{ color: 'var(--win95-content-text, #666)' }}>{option.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-2 p-3 space-y-3" style={{ backgroundColor: 'var(--win95-content-bg, #ffffff)', borderColor: 'var(--win95-border-mid, #808080)' }}>
        <div className="text-sm font-bold" style={{ color: 'var(--win95-content-text, #000000)' }}>Screen Saver</div>
        <div className="grid grid-cols-1 @[500px]:grid-cols-3 gap-2">
          {screensaverOptions.map((option) => {
            const isActive = settings.screensaverMode === option.id
            return (
              <button
                key={option.id}
                onClick={() => handleScreensaverModeChange(option.id)}
                className="p-2 text-left border-2"
                style={{
                  borderColor: isActive ? 'var(--next95-primary, #000080)' : 'var(--win95-border-mid, #808080)',
                  backgroundColor: 'var(--win95-content-bg, #ffffff)',
                  color: 'var(--win95-content-text, #000000)',
                  boxShadow: isActive ? insetSunken : insetRaised
                }}
              >
                <div className="font-bold text-sm mb-1">{option.label}</div>
                <div className="text-xs" style={{ color: 'var(--win95-content-text, #666)' }}>{option.description}</div>
              </button>
            )
          })}
        </div>

        <div className="p-3 flex items-end gap-4" style={{ backgroundColor: 'var(--win95-content-bg, #ffffff)', color: 'var(--win95-content-text, #000000)' }}>
          <div>
            <div className="text-sm font-bold mb-2" style={{ color: 'var(--win95-content-text, #000000)' }}>Wait Time (minutes)</div>
            <input
              type="number"
              min={1}
              value={settings.screensaverTimeout}
              onChange={(e) => handleScreensaverTimeoutChange(parseInt(e.target.value, 10) || 1)}
              className="w-24 px-2 py-1 border-2 text-sm"
              style={{
                borderColor: 'var(--win95-border-mid, #808080)',
                color: 'var(--win95-content-text, #000000)',
                backgroundColor: 'var(--win95-content-bg, #ffffff)',
                boxShadow: insetSunken
              }}
            />
          </div>
          <Next95Button
            onClick={() => {
              if (settings.screensaverMode !== 'none') {
                document.dispatchEvent(new CustomEvent('next95-preview-screensaver', { detail: settings.screensaverMode }))
              }
            }}
            disabled={settings.screensaverMode === 'none'}
            className="px-6 py-1 text-sm font-bold"
          >
            Preview
          </Next95Button>
        </div>
      </div>
    </>
  )

  const renderAppearanceTab = () => (
    <>
      <div 
        className="border-2 p-3"
        style={{
          backgroundColor: 'var(--win95-content-bg, #ffffff)',
          color: 'var(--win95-content-text, #000000)',
          borderColor: 'var(--win95-border-mid, #808080)'
        }}
      >
        <div className="text-sm font-bold mb-3">Color Mode</div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="colorMode"
              checked={settings.colorMode === 'light'}
              onChange={() => handleColorModeChange('light')}
              className="w-4 h-4"
            />
            <span className="text-sm">Light</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="colorMode"
              checked={settings.colorMode === 'dark'}
              onChange={() => handleColorModeChange('dark')}
              className="w-4 h-4"
            />
            <span className="text-sm">Dark</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="colorMode"
              checked={settings.colorMode === 'system'}
              onChange={() => handleColorModeChange('system')}
              className="w-4 h-4"
            />
            <span className="text-sm">System</span>
          </label>
        </div>
      </div>

      <div 
        className="border-2 p-3"
        style={{
          backgroundColor: 'var(--win95-content-bg, #ffffff)',
          color: 'var(--win95-content-text, #000000)',
          borderColor: 'var(--win95-border-mid, #808080)'
        }}
      >
        <div className="text-sm font-bold mb-3">Window Headers</div>
        <div className="space-y-2">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="headerType"
                checked={settings.windowHeaderType === 'solid'}
                onChange={() => handleWindowHeaderTypeChange('solid')}
                className="w-4 h-4"
              />
              <span className="text-sm">Solid Color</span>
            </label>

            {settings.windowHeaderType === 'solid' && (
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Header Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.windowHeaderSolid}
                    onChange={(e) => handleWindowHeaderSolidChange(e.target.value)}
                    className="w-12 h-8 border-2 cursor-pointer"
                    style={{ boxShadow: insetSunken, borderColor: 'var(--win95-border-mid, #808080)' }}
                  />
                  <input
                    type="text"
                    value={settings.windowHeaderSolid}
                    onChange={(e) => handleWindowHeaderSolidChange(e.target.value)}
                    className="flex-1 px-2 py-1 border-2 text-sm"
                    style={{ boxShadow: insetSunken, borderColor: 'var(--win95-border-mid, #808080)', color: 'var(--win95-content-text, #000000)', backgroundColor: 'var(--win95-content-bg, #ffffff)' }}
                    placeholder="#000080"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="headerType"
                checked={settings.windowHeaderType === 'gradient'}
                onChange={() => handleWindowHeaderTypeChange('gradient')}
                className="w-4 h-4"
              />
              <span className="text-sm">Gradient</span>
            </label>

            {settings.windowHeaderType === 'gradient' && (
              <div className="mt-2 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Presets</label>
                  <div className="grid grid-cols-2 @[500px]:grid-cols-3 @[700px]:grid-cols-4 gap-2">
                    {gradientPresets.map((preset) => {
                      const isSelected = selectedGradient === preset.name
                      return (
                        <button
                          key={preset.name}
                          onClick={() => applyGradientPreset(preset)}
                          className={`p-2 border-2 text-sm text-left ${
                            isSelected ? '' : 'hover:border-[#000]'
                          }`}
                          style={{
                            borderColor: isSelected ? 'var(--next95-primary, #000080)' : 'var(--win95-border-mid, #808080)',
                            backgroundColor: isSelected ? 'rgba(0, 0, 128, 0.1)' : 'transparent',
                          color: 'var(--win95-content-text, #000000)',
                          boxShadow: isSelected ? insetSunken : insetRaised
                          }}
                        >
                          <div className="mb-1">
                            <div className="h-6 border" style={{ background: preset.gradient, borderColor: 'var(--win95-border-dark, #000000)' }} />
                          </div>
                          <div className="font-medium">{preset.name}</div>
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setSelectedGradient('Custom')}
                      className={`p-2 border-2 text-sm text-left ${
                        selectedGradient === 'Custom' ? '' : 'hover:border-[#000]'
                      }`}
                      style={{
                        borderColor: selectedGradient === 'Custom' ? 'var(--next95-primary, #000080)' : 'var(--win95-border-mid, #808080)',
                        backgroundColor: selectedGradient === 'Custom' ? 'rgba(0, 0, 128, 0.1)' : 'transparent',
                        boxShadow: selectedGradient === 'Custom' ? insetSunken : insetRaised
                      }}
                    >
                      <div className="mb-1">
                        <div className="h-6 border" style={{ background: settings.windowHeaderGradient, borderColor: 'var(--win95-border-dark, #000000)' }} />
                      </div>
                      <div className="font-medium">Custom</div>
                    </button>
                  </div>
                </div>

                {selectedGradient === 'Custom' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Gradient Stops</label>
                    <div className="space-y-2">
                      {gradientStops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={stop.color}
                            onChange={(e) => handleGradientStopChange(index, 'color', e.target.value)}
                            className="w-8 h-8 border-2 cursor-pointer"
                            style={{ boxShadow: insetSunken, borderColor: 'var(--win95-border-mid, #808080)' }}
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={stop.position}
                            onChange={(e) => handleGradientStopChange(index, 'position', parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border-2 text-xs"
                            style={{ boxShadow: insetSunken, borderColor: 'var(--win95-border-mid, #808080)', color: 'var(--win95-content-text, #000000)', backgroundColor: 'var(--win95-content-bg, #ffffff)' }}
                          />
                          <span className="text-xs">%</span>
                          {gradientStops.length > 2 && (
                        <button
                              onClick={() => removeGradientStop(index)}
                              className="px-2 py-1 text-xs border-2"
                          style={{ boxShadow: insetRaised, borderColor: 'var(--win95-border-mid, #808080)', color: 'var(--win95-content-text, #000000)', backgroundColor: 'var(--win95-button-face, #c0c0c0)' }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      {gradientStops.length < 5 && (
                    <button
                          onClick={addGradientStop}
                          className="w-full px-2 py-1 text-xs border-2"
                      style={{ boxShadow: insetRaised, borderColor: 'var(--win95-border-mid, #808080)', color: 'var(--win95-content-text, #000000)', backgroundColor: 'var(--win95-button-face, #c0c0c0)' }}
                        >
                          Add Stop
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        className="border-2 p-3"
        style={{
          backgroundColor: 'var(--win95-content-bg, #ffffff)',
          color: 'var(--win95-content-text, #000000)',
          borderColor: 'var(--win95-border-mid, #808080)'
        }}
      >
        <div className="text-sm font-bold mb-3">Accent Colors</div>
        <div className="grid grid-cols-2 @[500px]:grid-cols-3 @[700px]:grid-cols-4 gap-2">
          {colorPresets.map((preset) => {
            const isSelected = isPresetSelected(preset.name)
            return (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`p-2 border-2 text-sm text-left ${
                  isSelected ? '' : 'hover:border-[#000]'
                }`}
                style={{
                  borderColor: isSelected ? 'var(--next95-primary, #000080)' : 'var(--win95-border-mid, #808080)',
                  backgroundColor: isSelected ? 'rgba(0, 0, 128, 0.1)' : 'transparent',
                  color: 'var(--win95-content-text, #000000)',
                  boxShadow: isSelected ? insetSunken : insetRaised
                }}
              >
                <div className="flex gap-1 mb-1">
                  <div className="w-6 h-6 border" style={{ backgroundColor: preset.primary, borderColor: 'var(--win95-border-dark, #000000)' }} />
                  <div className="w-6 h-6 border" style={{ backgroundColor: preset.secondary, borderColor: 'var(--win95-border-dark, #000000)' }} />
                </div>
                <div className="font-medium">{preset.name}</div>
              </button>
            )
          })}

          <button
            onClick={handleCustom}
            className={`p-2 border-2 text-sm text-left ${
              isPresetSelected('Custom') ? '' : 'hover:border-[#000]'
            }`}
            style={{
              borderColor: isPresetSelected('Custom') ? 'var(--next95-primary, #000080)' : 'var(--win95-border-mid, #808080)',
              backgroundColor: isPresetSelected('Custom') ? 'rgba(0, 0, 128, 0.1)' : 'transparent',
              color: 'var(--win95-content-text, #000000)',
              boxShadow: isPresetSelected('Custom') ? insetSunken : insetRaised
            }}
          >
            <div className="flex gap-1 mb-1">
              <div className="w-6 h-6 border" style={{ backgroundColor: settings.primaryColor, borderColor: 'var(--win95-border-dark, #000000)' }} />
              <div className="w-6 h-6 border" style={{ backgroundColor: settings.secondaryColor, borderColor: 'var(--win95-border-dark, #000000)' }} />
            </div>
            <div className="font-medium">Custom</div>
          </button>
        </div>

        {isPresetSelected('Custom') && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Primary Color</label>
              <div className="text-xs mb-2" style={{ color: 'var(--win95-content-text, #666)' }}>
                Used for links, borders, chart views, and map markers
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                className="w-12 h-8 border-2 cursor-pointer"
                style={{ boxShadow: insetSunken, borderColor: 'var(--win95-border-mid, #808080)' }}
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                className="flex-1 px-2 py-1 border-2 text-sm"
                style={{ boxShadow: insetSunken, borderColor: 'var(--win95-border-mid, #808080)', color: 'var(--win95-content-text, #000000)', backgroundColor: 'var(--win95-content-bg, #ffffff)' }}
                  placeholder="#0000ff"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Secondary Color</label>
              <div className="text-xs mb-2" style={{ color: 'var(--win95-content-text, #666)' }}>
                Used for chart visitors and accents
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="w-12 h-8 border-2 cursor-pointer"
                style={{ boxShadow: insetSunken, borderColor: 'var(--win95-border-mid, #808080)' }}
                />
                <input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="flex-1 px-2 py-1 border-2 text-sm"
                style={{ boxShadow: insetSunken, borderColor: 'var(--win95-border-mid, #808080)', color: 'var(--win95-content-text, #000000)', backgroundColor: 'var(--win95-content-bg, #ffffff)' }}
                  placeholder="#ff00ff"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className="p-4 space-y-4 overflow-auto h-full" style={{ backgroundColor: 'var(--win95-button-face, #c0c0c0)' }}>
      <style jsx>{`
        input[type='radio']:checked {
          accent-color: var(--next95-primary, #0000ff);
        }
      `}</style>

      {activeTab === 'desktop' ? renderDesktopTab() : renderAppearanceTab()}
    </div>
  )
}
