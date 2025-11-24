'use client'

import { useState, useEffect } from 'react'

interface Next95Settings {
  primaryColor: string // Used for: links, borders, chart views, map markers
  secondaryColor: string // Used for: chart visitors
  windowHeaderType: 'solid' | 'gradient'
  windowHeaderSolid: string
  windowHeaderGradient: string // CSS gradient string
  colorMode: 'light' | 'dark' | 'system'
}

const defaultSettings: Next95Settings = {
  primaryColor: '#0000ff', // Blue
  secondaryColor: '#ff00ff', // Magenta
  windowHeaderType: 'gradient',
  windowHeaderSolid: '#000080',
  windowHeaderGradient: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)', // Default blue gradient
  colorMode: 'system'
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

export default function SystemSettingsContent() {
  const [settings, setSettings] = useState<Next95Settings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState<string>('Classic')
  const [selectedGradient, setSelectedGradient] = useState<string>('')
  const [gradientStops, setGradientStops] = useState<Array<{ color: string; position: number }>>([
    { color: '#000080', position: 0 },
    { color: '#1084d0', position: 100 }
  ])

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('next95-settings')
    const savedPreset = localStorage.getItem('next95-preset')
    const savedGradient = localStorage.getItem('next95-gradient-preset')
    
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsedSettings })
        
        // Parse gradient stops if it's a custom gradient
        if (parsedSettings.windowHeaderGradient && parsedSettings.windowHeaderType === 'gradient') {
          const matches = parsedSettings.windowHeaderGradient.match(/#[0-9a-fA-F]{6}/g)
          const positions = parsedSettings.windowHeaderGradient.match(/(\d+)%/g)
          if (matches && positions) {
            setGradientStops(matches.map((color, i) => ({
              color,
              position: parseInt(positions[i])
            })))
          }
        }
      } catch (error) {
        console.error('Error parsing saved settings:', error)
      }
    } else {
      // Initialize with defaults
      applySettings(defaultSettings)
    }
    
    if (savedPreset) {
      setSelectedPreset(savedPreset)
    }
    
    if (savedGradient) {
      setSelectedGradient(savedGradient)
    } else {
      // Default to Classic Blue if nothing saved
      setSelectedGradient('Classic Blue')
    }
    
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      applySettings(settings)
      localStorage.setItem('next95-settings', JSON.stringify(settings))
    }
  }, [settings, isLoading])

  const applySettings = (newSettings: Next95Settings) => {
    const root = document.documentElement
    
    // Apply custom colors as CSS variables
    root.style.setProperty('--next95-primary', newSettings.primaryColor)
    root.style.setProperty('--next95-secondary', newSettings.secondaryColor)
    
    // Apply window header settings
    if (newSettings.windowHeaderType === 'solid') {
      root.style.setProperty('--next95-window-header', newSettings.windowHeaderSolid)
      root.style.setProperty('--next95-window-header-text', getTextColorForBackground(newSettings.windowHeaderSolid))
    } else {
      root.style.setProperty('--next95-window-header', newSettings.windowHeaderGradient)
      root.style.setProperty('--next95-window-header-text', '#ffffff') // White text for gradients
    }
    
    // Apply color mode
    if (newSettings.colorMode === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (newSettings.colorMode === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      // System mode
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
    }
    
    console.log('Next95 settings applied:', {
      primary: newSettings.primaryColor,
      secondary: newSettings.secondaryColor,
      windowHeaderType: newSettings.windowHeaderType,
      windowHeader: newSettings.windowHeaderType === 'solid' ? newSettings.windowHeaderSolid : newSettings.windowHeaderGradient,
      colorMode: newSettings.colorMode
    })
  }

  // Helper function to determine text color based on background
  const getTextColorForBackground = (bgColor: string): string => {
    // Convert hex to RGB
    const hex = bgColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  const handleColorChange = (colorType: 'primary' | 'secondary', color: string) => {
    setSelectedPreset('Custom')
    
    const newSettings = { 
      ...settings, 
      [`${colorType}Color`]: color 
    }
    setSettings(newSettings)
    
    const root = document.documentElement
    root.style.setProperty(`--next95-${colorType}`, color)
    
    localStorage.setItem('next95-settings', JSON.stringify(newSettings))
    localStorage.setItem('next95-preset', 'Custom')
  }

  const handleWindowHeaderTypeChange = (type: 'solid' | 'gradient') => {
    const newSettings = {
      ...settings,
      windowHeaderType: type
    }
    setSettings(newSettings)
  }

  const handleColorModeChange = (mode: 'light' | 'dark' | 'system') => {
    const newSettings = {
      ...settings,
      colorMode: mode
    }
    setSettings(newSettings)
    
    // Save to localStorage
    localStorage.setItem('next95-settings', JSON.stringify(newSettings))
    
    // Apply the color mode immediately
    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (mode === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      // System mode
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
    const newSettings = {
      ...settings,
      windowHeaderSolid: color,
      windowHeaderType: 'solid' as const
    }
    setSettings(newSettings)
    setSelectedGradient('Custom')
  }

  const applyGradientPreset = (preset: typeof gradientPresets[0]) => {
    setSelectedGradient(preset.name)
    const newSettings = {
      ...settings,
      windowHeaderGradient: preset.gradient,
      windowHeaderType: 'gradient' as const
    }
    setSettings(newSettings)
    localStorage.setItem('next95-gradient-preset', preset.name)
    
    // Parse gradient to update stops
    const matches = preset.gradient.match(/#[0-9a-fA-F]{6}/g)
    const positions = preset.gradient.match(/(\d+)%/g)
    if (matches && positions) {
      setGradientStops(matches.map((color, i) => ({
        color,
        position: parseInt(positions[i])
      })))
    }
  }

  const handleGradientStopChange = (index: number, field: 'color' | 'position', value: string | number) => {
    const newStops = [...gradientStops]
    newStops[index] = {
      ...newStops[index],
      [field]: value
    }
    
    // Sort by position
    newStops.sort((a, b) => a.position - b.position)
    setGradientStops(newStops)
    
    // Build gradient string
    const gradientString = `linear-gradient(90deg, ${newStops.map(stop => `${stop.color} ${stop.position}%`).join(', ')})`
    
    const newSettings = {
      ...settings,
      windowHeaderGradient: gradientString,
      windowHeaderType: 'gradient' as const
    }
    setSettings(newSettings)
    setSelectedGradient('Custom')
    localStorage.setItem('next95-gradient-preset', 'Custom')
  }

  const addGradientStop = () => {
    // Find a good position for the new stop (midpoint of largest gap)
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
    const newColor = sortedStops[maxGapIndex].color // Use color from left side
    
    const newStops = [...gradientStops, { color: newColor, position: newPosition }].sort((a, b) => a.position - b.position)
    setGradientStops(newStops)
    
    // Build and apply gradient
    const gradientString = `linear-gradient(90deg, ${newStops.map(stop => `${stop.color} ${stop.position}%`).join(', ')})`
    const newSettings = {
      ...settings,
      windowHeaderGradient: gradientString,
      windowHeaderType: 'gradient' as const
    }
    setSettings(newSettings)
    setSelectedGradient('Custom')
    localStorage.setItem('next95-gradient-preset', 'Custom')
  }

  const removeGradientStop = (index: number) => {
    if (gradientStops.length > 2) {
      const newStops = gradientStops.filter((_, i) => i !== index).sort((a, b) => a.position - b.position)
      setGradientStops(newStops)
      
      const gradientString = `linear-gradient(90deg, ${newStops.map(stop => `${stop.color} ${stop.position}%`).join(', ')})`
      const newSettings = {
        ...settings,
        windowHeaderGradient: gradientString,
        windowHeaderType: 'gradient' as const
      }
      setSettings(newSettings)
      setSelectedGradient('Custom')
      localStorage.setItem('next95-gradient-preset', 'Custom')
    }
  }

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setSelectedPreset(preset.name)
    setSettings(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary
    }))
    localStorage.setItem('next95-preset', preset.name)
  }

  const handleCustom = () => {
    setSelectedPreset('Custom')
    localStorage.setItem('next95-preset', 'Custom')
  }

  const isPresetSelected = (presetName: string) => {
    return selectedPreset === presetName
  }

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center h-64"
        style={{ backgroundColor: 'var(--win95-button-face, #c0c0c0)' }}
      >
        <div className="text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div 
      className="p-4 space-y-4 overflow-auto"
      style={{ 
        backgroundColor: 'var(--win95-button-face, #c0c0c0)',
        maxHeight: 'calc(100vh - 200px)'
      }}
    >
      <style jsx>{`
        input[type="radio"]:checked {
          accent-color: var(--next95-primary, #0000ff);
        }
      `}</style>
      
      {/* Color Mode Section */}
      <div 
        className="border-2 p-3"
        style={{
          backgroundColor: 'var(--win95-content-bg, #ffffff)',
          color: 'var(--win95-content-text, #000000)',
          borderColor: 'var(--win95-border-mid, #808080)'
        }}
      >
        <div className="text-sm font-bold mb-3">
          Color Mode
        </div>
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
      
      {/* Window Header Section */}
      <div 
        className="border-2 p-3"
        style={{
          backgroundColor: 'var(--win95-content-bg, #ffffff)',
          color: 'var(--win95-content-text, #000000)',
          borderColor: 'var(--win95-border-mid, #808080)'
        }}
      >
        <div className="text-sm font-bold mb-3">
          Window Headers
        </div>
        
        {/* Type Selection */}
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
            
            {/* Solid Color Picker */}
            {settings.windowHeaderType === 'solid' && (
              <div className="mt-2 ml-6">
                <label className="block text-sm font-medium mb-1">
                  Header Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.windowHeaderSolid}
                    onChange={(e) => handleWindowHeaderSolidChange(e.target.value)}
                    className="w-12 h-8 border-2 border-[#808080] cursor-pointer"
                    style={{ boxShadow: 'inset -2px -2px 0 0 #fff, inset 2px 2px 0 0 #000' }}
                  />
                  <input
                    type="text"
                    value={settings.windowHeaderSolid}
                    onChange={(e) => handleWindowHeaderSolidChange(e.target.value)}
                    className="flex-1 px-2 py-1 border-2 border-[#808080] text-sm"
                    style={{ boxShadow: 'inset -2px -2px 0 0 #fff, inset 2px 2px 0 0 #000' }}
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
            
            {/* Gradient Options */}
            {settings.windowHeaderType === 'gradient' && (
              <div className="mt-2 ml-6 space-y-3">
            {/* Gradient Presets */}
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
                        isSelected 
                          ? '' 
                          : 'hover:border-[#000]'
                      }`}
                      style={{
                        borderColor: isSelected ? 'var(--next95-primary, #000080)' : 'var(--win95-border-mid, #808080)',
                        backgroundColor: isSelected ? 'rgba(0, 0, 128, 0.1)' : 'transparent',
                        boxShadow: isSelected 
                          ? 'inset -2px -2px 0 0 var(--win95-border-light, #fff), inset 2px 2px 0 0 var(--win95-border-dark, #000)'
                          : 'inset -2px -2px 0 0 var(--win95-border-dark, #000), inset 2px 2px 0 0 var(--win95-border-light, #fff)'
                      }}
                    >
                      <div className="mb-1">
                        <div 
                          className="h-6 border border-black" 
                          style={{ background: preset.gradient }}
                        />
                      </div>
                      <div className="font-medium">{preset.name}</div>
                    </button>
                  )
                })}
                <button
                  onClick={() => setSelectedGradient('Custom')}
                  className={`p-2 border-2 text-sm text-left ${
                    selectedGradient === 'Custom'
                      ? '' 
                      : 'hover:border-[#000]'
                  }`}
                  style={{
                    borderColor: selectedGradient === 'Custom' ? 'var(--next95-primary, #000080)' : 'var(--win95-border-mid, #808080)',
                    backgroundColor: selectedGradient === 'Custom' ? 'rgba(0, 0, 128, 0.1)' : 'transparent',
                    boxShadow: selectedGradient === 'Custom'
                      ? 'inset -2px -2px 0 0 var(--win95-border-light, #fff), inset 2px 2px 0 0 var(--win95-border-dark, #000)'
                      : 'inset -2px -2px 0 0 var(--win95-border-dark, #000), inset 2px 2px 0 0 var(--win95-border-light, #fff)'
                  }}
                >
                  <div className="mb-1">
                    <div 
                      className="h-6 border border-black" 
                      style={{ background: settings.windowHeaderGradient }}
                    />
                  </div>
                  <div className="font-medium">Custom</div>
                </button>
              </div>
            </div>

            {/* Custom Gradient Stops */}
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
                        className="w-8 h-8 border-2 border-[#808080] cursor-pointer"
                        style={{ boxShadow: 'inset -2px -2px 0 0 #fff, inset 2px 2px 0 0 #000' }}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={stop.position}
                        onChange={(e) => handleGradientStopChange(index, 'position', parseInt(e.target.value))}
                        className="w-16 px-2 py-1 border-2 border-[#808080] text-xs"
                        style={{ boxShadow: 'inset -2px -2px 0 0 #fff, inset 2px 2px 0 0 #000' }}
                      />
                      <span className="text-xs">%</span>
                      {gradientStops.length > 2 && (
                        <button
                          onClick={() => removeGradientStop(index)}
                          className="px-2 py-1 text-xs border-2 border-[#808080]"
                          style={{ boxShadow: 'inset -2px -2px 0 0 #000, inset 2px 2px 0 0 #fff' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {gradientStops.length < 5 && (
                    <button
                      onClick={addGradientStop}
                      className="w-full px-2 py-1 text-xs border-2 border-[#808080]"
                      style={{ boxShadow: 'inset -2px -2px 0 0 #000, inset 2px 2px 0 0 #fff' }}
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

      {/* Color Presets Section */}
      <div 
        className="border-2 p-3"
        style={{
          backgroundColor: 'var(--win95-content-bg, #ffffff)',
          color: 'var(--win95-content-text, #000000)',
          borderColor: 'var(--win95-border-mid, #808080)'
        }}
      >
        <div className="text-sm font-bold mb-3">
          Accent Colors
        </div>
        <div className="grid grid-cols-2 @[500px]:grid-cols-3 @[700px]:grid-cols-4 gap-2">
          {colorPresets.map((preset) => {
            const isSelected = isPresetSelected(preset.name)
            return (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`p-2 border-2 text-sm text-left ${
                  isSelected 
                    ? '' 
                    : 'hover:border-[#000]'
                }`}
                style={{
                  borderColor: isSelected ? 'var(--next95-primary, #000080)' : 'var(--win95-border-mid, #808080)',
                  backgroundColor: isSelected ? 'rgba(0, 0, 128, 0.1)' : 'transparent',
                  boxShadow: isSelected 
                    ? 'inset -2px -2px 0 0 var(--win95-border-light, #fff), inset 2px 2px 0 0 var(--win95-border-dark, #000)'
                    : 'inset -2px -2px 0 0 var(--win95-border-dark, #000), inset 2px 2px 0 0 var(--win95-border-light, #fff)'
                }}
              >
                <div className="flex gap-1 mb-1">
                  <div 
                    className="w-6 h-6 border border-black" 
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div 
                    className="w-6 h-6 border border-black" 
                    style={{ backgroundColor: preset.secondary }}
                  />
                </div>
                <div className="font-medium">{preset.name}</div>
              </button>
            )
          })}
          
          {/* Custom Preset */}
          <button
            onClick={handleCustom}
            className={`p-2 border-2 text-sm text-left ${
              isPresetSelected('Custom')
                ? '' 
                : 'hover:border-[#000]'
            }`}
            style={{
              borderColor: isPresetSelected('Custom') ? 'var(--next95-primary, #000080)' : 'var(--win95-border-mid, #808080)',
              backgroundColor: isPresetSelected('Custom') ? 'rgba(0, 0, 128, 0.1)' : 'transparent',
              boxShadow: isPresetSelected('Custom')
                ? 'inset -2px -2px 0 0 var(--win95-border-light, #fff), inset 2px 2px 0 0 var(--win95-border-dark, #000)'
                : 'inset -2px -2px 0 0 var(--win95-border-dark, #000), inset 2px 2px 0 0 var(--win95-border-light, #fff)'
            }}
          >
            <div className="flex gap-1 mb-1">
              <div 
                className="w-6 h-6 border border-black" 
                style={{ backgroundColor: settings.primaryColor }}
              />
              <div 
                className="w-6 h-6 border border-black" 
                style={{ backgroundColor: settings.secondaryColor }}
              />
            </div>
            <div className="font-medium">Custom</div>
          </button>
        </div>

        {/* Custom Colors - Only show when Custom preset is selected */}
        {isPresetSelected('Custom') && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Primary Color
              </label>
              <div className="text-xs mb-2" style={{ color: 'var(--win95-content-text, #666)' }}>
                Used for links, borders, chart views, and map markers
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-12 h-8 border-2 border-[#808080] cursor-pointer"
                  style={{ boxShadow: 'inset -2px -2px 0 0 #fff, inset 2px 2px 0 0 #000' }}
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="flex-1 px-2 py-1 border-2 border-[#808080] text-sm"
                  style={{ boxShadow: 'inset -2px -2px 0 0 #fff, inset 2px 2px 0 0 #000' }}
                  placeholder="#0000ff"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Secondary Color
              </label>
              <div className="text-xs mb-2" style={{ color: 'var(--win95-content-text, #666)' }}>
                Used for chart visitors and accents
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-12 h-8 border-2 border-[#808080] cursor-pointer"
                  style={{ boxShadow: 'inset -2px -2px 0 0 #fff, inset 2px 2px 0 0 #000' }}
                />
                <input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="flex-1 px-2 py-1 border-2 border-[#808080] text-sm"
                  style={{ boxShadow: 'inset -2px -2px 0 0 #fff, inset 2px 2px 0 0 #000' }}
                  placeholder="#ff00ff"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

