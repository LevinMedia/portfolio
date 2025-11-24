'use client';

import { useState } from 'react';
import Window from './Window';
import { useWindowManager } from '../context/WindowManagerContext';
import StatsContent from './StatsContent';
import Image from 'next/image';

interface StatsWindowProps {
  onClose: () => void;
}

export default function StatsWindow({ onClose }: StatsWindowProps) {
  const { windows } = useWindowManager();

  // Calculate cascaded position based on number of open windows
  const windowWidth = 900;
  const windowHeight = 600;
  const cascadeOffset = 40;
  
  const windowCount = windows.length;
  const cascadeLevel = windowCount > 0 ? windowCount - 1 : 0;
  
  const baseX = typeof window !== 'undefined' ? (window.innerWidth - windowWidth) / 2 : 100;
  const baseY = typeof window !== 'undefined' ? (window.innerHeight - windowHeight) / 2 : 100;
  
  const defaultX = baseX + (cascadeLevel * cascadeOffset);
  const defaultY = baseY + (cascadeLevel * cascadeOffset);

  return (
    <Window
      id="stats"
      title="System Stats"
      icon={<Image src="/Stats.png" alt="Stats" width={16} height={16} />}
      defaultWidth={windowWidth}
      defaultHeight={windowHeight}
      defaultX={defaultX}
      defaultY={defaultY}
      onClose={onClose}
      draggable={true}
      resizable={true}
    >
      <div 
        className="h-full overflow-y-auto overflow-x-hidden @container"
        style={{ backgroundColor: 'var(--win95-button-face, #c0c0c0)' }}
      >
        <div className="px-4 pb-4">
          <StatsContent />
        </div>
      </div>
    </Window>
  );
}

