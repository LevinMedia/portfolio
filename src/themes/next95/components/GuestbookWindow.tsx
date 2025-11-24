'use client';

import Window from './Window';
import { useWindowManager } from '../context/WindowManagerContext';
import Guestbook from './Guestbook';
import Image from 'next/image';

interface GuestbookWindowProps {
  onClose: () => void;
}

export default function GuestbookWindow({ onClose }: GuestbookWindowProps) {
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
      id="guestbook"
      slug="guestbook"
      title="Guestbook"
      icon={<Image src="/guestbook-icon.png" alt="Guestbook" width={16} height={16} />}
      defaultWidth={windowWidth}
      defaultHeight={windowHeight}
      defaultX={defaultX}
      defaultY={defaultY}
      onClose={onClose}
      draggable={true}
      resizable={true}
    >
      <div 
        className="h-full overflow-y-auto overflow-x-hidden @container p-4"
        style={{ backgroundColor: 'var(--win95-button-face, #c0c0c0)' }}
      >
        <div className="flex justify-center">
          <div className="w-full max-w-[600px]">
            <Guestbook />
          </div>
        </div>
      </div>
    </Window>
  );
}

