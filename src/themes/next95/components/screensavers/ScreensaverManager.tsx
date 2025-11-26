'use client'

import { useState, useEffect, useCallback } from 'react'
import Starfield from './Starfield'
import Pipes from './Pipes'

type ScreensaverId = 'none' | 'pipes' | 'stars'

export default function ScreensaverManager() {
  const [activeScreensaver, setActiveScreensaver] = useState<ScreensaverId | null>(null)

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
    </div>
  )
}

