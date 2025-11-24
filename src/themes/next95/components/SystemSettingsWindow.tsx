'use client'

import { useState } from 'react'
import Window from './Window'
import { useWindowManager } from '../context/WindowManagerContext'
import SystemSettingsContent from './SystemSettingsContent'
import Image from 'next/image'
import Next95Button from './Next95Button'

interface SystemSettingsWindowProps {
  onClose: () => void
}

export default function SystemSettingsWindow({ onClose }: SystemSettingsWindowProps) {
  const { windows } = useWindowManager()
  const [activeTab, setActiveTab] = useState<'desktop' | 'appearance'>('appearance')

  const cascadeOffset = 40
  const cascadeLevel = windows.length > 0 ? windows.length - 1 : 0

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
  const taskbarHeight = 56
  const verticalPadding = 40

  const windowWidth = Math.min(960, viewportWidth - 40)
  const windowHeight = viewportHeight - taskbarHeight - verticalPadding

  const baseX = typeof window !== 'undefined' ? Math.max(20, (viewportWidth - windowWidth) / 2) : 100
  const baseY = 20

  const defaultX = baseX + cascadeLevel * cascadeOffset
  const defaultY = baseY + cascadeLevel * cascadeOffset

  const tabs = [
    { id: 'desktop' as const, label: 'Desktop & Screen Saver' },
    { id: 'appearance' as const, label: 'Appearance' }
  ]

  return (
    <Window
      id="system-settings"
      slug="system-settings"
      title="System Settings"
      icon={<Image src="/System-settings.png" alt="System Settings" width={16} height={16} />}
      defaultWidth={windowWidth}
      defaultHeight={windowHeight}
      defaultX={defaultX}
      defaultY={defaultY}
      onClose={onClose}
    >
      <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--win95-button-face, #c0c0c0)' }}>
        <div
          className="border-b-2 px-4 pt-3 pb-2"
          style={{ borderColor: 'var(--win95-border-mid, #808080)' }}
        >
          <div className="flex gap-2 flex-wrap">
            {tabs.map((tab) => (
              <Next95Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                isActive={activeTab === tab.id}
                className="px-5 py-2 text-sm font-semibold min-w-[170px] text-left"
              >
                {tab.label}
              </Next95Button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <SystemSettingsContent activeTab={activeTab} />
        </div>
      </div>
    </Window>
  )
}

