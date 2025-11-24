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

  // Calculate cascaded position based on number of open windows
  const cascade = windows.length * 30
  const defaultX = 100 + cascade
  const defaultY = 80 + cascade

  const tabs = [
    { id: 'desktop' as const, label: 'Desktop & Screen Saver' },
    { id: 'appearance' as const, label: 'Appearance' }
  ]

  return (
    <Window
      title="System Settings"
      icon={<Image src="/System-settings.png" alt="System Settings" width={16} height={16} />}
      defaultWidth={820}
      defaultHeight={560}
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

