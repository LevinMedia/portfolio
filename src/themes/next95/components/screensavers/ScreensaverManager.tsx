'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Starfield from './Starfield'
import Pipes from './Pipes'
import Mystify from './Mystify'

type ScreensaverId = 'none' | 'pipes' | 'stars' | 'mystify'

interface ScreensaverConfig {
  screensaverMode: ScreensaverId
  screensaverTimeout: number // minutes
}

export default function ScreensaverManager() {
  const [activeScreensaver, setActiveScreensaver] = useState<ScreensaverId | null>(null)
  const [config, setConfig] = useState<ScreensaverConfig>({ screensaverMode: 'none', screensaverTimeout: 10 })
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load settings and listen for changes
  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('next95-settings')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setConfig({
            screensaverMode: parsed.screensaverMode || 'none',
            screensaverTimeout: parsed.screensaverTimeout || 10
          })
        } catch (e) {
          console.error('Failed to load screensaver settings', e)
        }
      }
    }

    loadSettings()

    const handleSettingsChange = (e: Event) => {
      const customEvent = e as CustomEvent<any>
      if (customEvent.detail) {
        setConfig({
          screensaverMode: customEvent.detail.screensaverMode || 'none',
          screensaverTimeout: customEvent.detail.screensaverTimeout || 10
        })
      }
    }

    document.addEventListener('next95-settings-changed', handleSettingsChange)
    return () => {
      document.removeEventListener('next95-settings-changed', handleSettingsChange)
    }
  }, [])

  // Idle timer logic
  useEffect(() => {
    if (config.screensaverMode === 'none' || activeScreensaver) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      return
    }

    const resetTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      if (activeScreensaver) return // Don't start timer if already active (handled by exit logic)

      idleTimerRef.current = setTimeout(() => {
        setActiveScreensaver(config.screensaverMode)
      }, config.screensaverTimeout * 60 * 1000)
    }

    // Initial start
    resetTimer()

    const handleActivity = () => resetTimer()

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('touchstart', handleActivity)

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [config, activeScreensaver])

  // Preview event listener
  useEffect(() => {
    const handlePreview = (e: Event) => {
      const customEvent = e as CustomEvent<ScreensaverId>
      setActiveScreensaver(customEvent.detail)
    }

    document.addEventListener('next95-preview-screensaver', handlePreview)
    return () => {
      document.removeEventListener('next95-preview-screensaver', handlePreview)
    }
  }, [])

  const handleExit = useCallback(() => {
    if (activeScreensaver) {
      setActiveScreensaver(null)
    }
  }, [activeScreensaver])

  // Exit on interaction when active
  useEffect(() => {
    if (activeScreensaver) {
      const handleInteraction = () => handleExit()
      
      // Small delay to prevent immediate exit from the click that opened it
      const timer = setTimeout(() => {
        window.addEventListener('mousemove', handleInteraction)
        window.addEventListener('keydown', handleInteraction)
        window.addEventListener('click', handleInteraction)
        window.addEventListener('touchstart', handleInteraction)
      }, 500)
      
      return () => {
        clearTimeout(timer)
        window.removeEventListener('mousemove', handleInteraction)
        window.removeEventListener('keydown', handleInteraction)
        window.removeEventListener('click', handleInteraction)
        window.removeEventListener('touchstart', handleInteraction)
      }
    }
  }, [activeScreensaver, handleExit])

  if (!activeScreensaver || activeScreensaver === 'none') return null

  return (
    <div className="fixed inset-0 z-[9999] cursor-none bg-black">
      {activeScreensaver === 'stars' && <Starfield />}
      {activeScreensaver === 'pipes' && <Pipes />}
      {activeScreensaver === 'mystify' && <Mystify />}
    </div>
  )
}
