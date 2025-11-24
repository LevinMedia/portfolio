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

  const cascadeOffset = 40;
  const cascadeLevel = windows.length > 0 ? windows.length - 1 : 0;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const taskbarHeight = 56;
  const verticalPadding = 40; // 20px top + 20px bottom

  const windowWidth = Math.min(1000, viewportWidth - 40);
  const windowHeight = viewportHeight - taskbarHeight - verticalPadding;

  const baseX = typeof window !== 'undefined' ? Math.max(20, (viewportWidth - windowWidth) / 2) : 100;
  const baseY = 20;

  const defaultX = baseX + cascadeLevel * cascadeOffset;
  const defaultY = baseY + cascadeLevel * cascadeOffset;

  return (
    <Window
      id="stats"
      slug="stats"
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

