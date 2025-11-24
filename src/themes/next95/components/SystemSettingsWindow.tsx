'use client'

import Window from './Window'
import { useWindowManager } from '../context/WindowManagerContext'
import SystemSettingsContent from './SystemSettingsContent'
import Image from 'next/image'

interface SystemSettingsWindowProps {
  onClose: () => void
}

export default function SystemSettingsWindow({ onClose }: SystemSettingsWindowProps) {
  const { windows } = useWindowManager()

  // Calculate cascaded position based on number of open windows
  const cascade = windows.length * 30
  const defaultX = 100 + cascade
  const defaultY = 80 + cascade

  return (
    <Window
      title="System Settings"
      icon={<Image src="/System-settings.png" alt="System Settings" width={16} height={16} />}
      defaultWidth={640}
      defaultHeight={480}
      defaultX={defaultX}
      defaultY={defaultY}
      onClose={onClose}
    >
      <SystemSettingsContent />
    </Window>
  )
}

