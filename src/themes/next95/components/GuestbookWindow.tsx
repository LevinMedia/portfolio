'use client';

import Window from './Window';
import { useWindowManager } from '../context/WindowManagerContext';
import Guestbook from './Guestbook';

interface GuestbookWindowProps {
  onClose: () => void;
}

export default function GuestbookWindow({ onClose }: GuestbookWindowProps) {
  const { windows } = useWindowManager();

  // Calculate cascaded position based on number of open windows
  const windowWidth = 700;
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
      id="guestbook"
      title="Guestbook"
      defaultWidth={windowWidth}
      defaultHeight={windowHeight}
      defaultX={defaultX}
      defaultY={defaultY}
      onClose={onClose}
      draggable={true}
      resizable={true}
    >
      <div className="h-full overflow-y-auto overflow-x-hidden bg-[#c0c0c0] @container">
        <div className="p-4 flex justify-center">
          <div className="w-full max-w-[600px]">
            <Guestbook />
          </div>
        </div>
      </div>
    </Window>
  );
}

