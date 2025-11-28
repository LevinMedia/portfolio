'use client';

import Window from './Window';
import { useWindowManager } from '../context/WindowManagerContext';
import WorkHistoryContent from './WorkHistoryContent';
import Image from 'next/image';

interface WorkHistoryWindowProps {
  onClose: () => void;
}

export default function WorkHistoryWindow({ onClose }: WorkHistoryWindowProps) {
  const { windows } = useWindowManager();

  const cascadeOffset = 40;
  const cascadeLevel = windows.length > 0 ? windows.length - 1 : 0;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const taskbarHeight = 56;
  const verticalPadding = 40;

  const windowWidth = Math.min(800, viewportWidth - 40);
  const windowHeight = viewportHeight - taskbarHeight - verticalPadding;

  const baseX = typeof window !== 'undefined' ? Math.max(20, (viewportWidth - windowWidth) / 2) : 100;
  const baseY = 20;

  const defaultX = baseX + cascadeLevel * cascadeOffset;
  const defaultY = baseY + cascadeLevel * cascadeOffset;

  return (
    <Window
      id="work-history"
      slug="work-history"
      title="Work History"
      icon={<Image src="/work-history.png" alt="Work History" width={16} height={16} />}
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
        {/* Menu Bar - Sticky */}
        <div 
          className="sticky top-0 z-10 border-b-2"
          style={{
            backgroundColor: 'var(--win95-button-face, #c0c0c0)',
            borderColor: 'var(--win95-border-mid, #808080)'
          }}
        >
          <div className="flex items-center px-2 py-1">
            <a
              href="https://www.linkedin.com/in/levinmedia/details/experience/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-sm transition-colors"
              style={{
                color: 'var(--win95-text, #000)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = getComputedStyle(document.documentElement).getPropertyValue('--next95-primary').trim() || '#0000ff'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--win95-text').trim() || '#000'
              }}
            >
              View on LinkedIn
            </a>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 flex justify-center">
          <div className="w-full max-w-[600px]">
            <WorkHistoryContent />
          </div>
        </div>
      </div>
    </Window>
  );
}

