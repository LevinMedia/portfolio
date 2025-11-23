'use client';

import Window from './Window';
import { useWindowManager } from '../context/WindowManagerContext';
import WorkHistoryContent from './WorkHistoryContent';

interface WorkHistoryWindowProps {
  onClose: () => void;
}

export default function WorkHistoryWindow({ onClose }: WorkHistoryWindowProps) {
  const { windows } = useWindowManager();

  // Calculate cascaded position based on number of open windows
  const windowWidth = 700;
  const windowHeight = 500;
  const cascadeOffset = 40;
  
  const windowCount = windows.length;
  const cascadeLevel = windowCount > 0 ? windowCount - 1 : 0;
  
  const baseX = typeof window !== 'undefined' ? (window.innerWidth - windowWidth) / 2 : 100;
  const baseY = typeof window !== 'undefined' ? (window.innerHeight - windowHeight) / 2 : 100;
  
  const defaultX = baseX + (cascadeLevel * cascadeOffset);
  const defaultY = baseY + (cascadeLevel * cascadeOffset);

  return (
    <Window
      id="work-history"
      title="Work History"
      defaultWidth={windowWidth}
      defaultHeight={windowHeight}
      defaultX={defaultX}
      defaultY={defaultY}
      onClose={onClose}
      draggable={true}
      resizable={true}
    >
      <div className="h-full overflow-y-auto overflow-x-hidden bg-[#c0c0c0] @container">
        {/* Menu Bar - Sticky */}
        <div className="sticky top-0 z-10 bg-[#c0c0c0] border-b-2 border-[#808080]">
          <div className="flex items-center px-2 py-1">
            <a
              href="https://www.linkedin.com/in/levinmedia/details/experience/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-sm text-[#000] hover:bg-[#000080] hover:text-white transition-colors"
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

