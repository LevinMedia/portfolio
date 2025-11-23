'use client';

import { useState, useEffect } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';

export default function Navigation() {
  const { windows, setActiveWindow, restoreWindow } = useWindowManager();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      setCurrentTime(timeString);
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Windows 95 Taskbar */}
      <div className="bg-[#9F9F9F] border-t-2 border-t-[#dfdfdf] h-[56px] flex items-center justify-between px-[4px] shadow-[inset_0_4px_0_#ffffff]">
        {/* Start Button */}
        <button
          onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
          className={`
            flex items-center gap-2 px-3 py-1 text-base font-bold 
            text-[#000]
            h-[44px] min-w-[80px]
            transition-all
          `}
          style={{
            background: '#A7A7A7',
            boxShadow: isStartMenuOpen 
              ? '-4px -4px 0 0 rgba(255, 255, 255, 0.50) inset, 4px 4px 0 0 rgba(0, 0, 0, 0.50) inset'
              : '-4px -4px 0 0 rgba(0, 0, 0, 0.50) inset, 4px 4px 0 0 rgba(255, 255, 255, 0.50) inset'
          }}
          onMouseEnter={(e) => {
            if (!isStartMenuOpen) {
              e.currentTarget.style.background = '#B1B1B1';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#A7A7A7';
          }}
        >
          <div className="w-5 h-5 border border-[#000] rounded-full flex items-center justify-center bg-[#ffffff] flex-shrink-0">
            <span className="text-[10px] font-bold font-[family-name:var(--font-geist-mono)] leading-none">LM</span>
          </div>
          <span className="leading-none">Start</span>
        </button>

        {/* Task Area */}
        <div className="flex-1 mx-2 h-full flex items-center gap-1">
          {/* Running applications */}
          <div className="flex-1 flex items-center gap-[4px] overflow-x-auto">
            {windows.map((window) => (
              <button
                key={window.id}
                data-window-id={window.id}
                onClick={() => {
                  if (window.isMinimized) {
                    restoreWindow(window.id);
                  } else {
                    setActiveWindow(window.id);
                  }
                }}
                className={`px-4 py-2 text-sm h-[44px] max-w-[180px] truncate transition-all ${window.isActive && !window.isMinimized ? 'text-[#000]' : 'text-[#000]'}`}
                style={{
                  background: '#A7A7A7',
                  boxShadow: (window.isActive && !window.isMinimized)
                    ? '-4px -4px 0 0 rgba(255, 255, 255, 0.50) inset, 4px 4px 0 0 rgba(0, 0, 0, 0.50) inset'
                    : '-4px -4px 0 0 rgba(0, 0, 0, 0.50) inset, 4px 4px 0 0 rgba(255, 255, 255, 0.50) inset'
                }}
                onMouseEnter={(e) => {
                  if (!window.isActive) {
                    e.currentTarget.style.background = '#B1B1B1';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#A7A7A7';
                }}
                title={window.title}
              >
                {window.title}
              </button>
            ))}
          </div>
        </div>

        {/* System Tray with Clock */}
        <div className="flex items-center h-full">
          <div className="w-[3px] h-[80%] border-l-2 border-l-[#808080] border-r-2 border-r-[#ffffff]" />
          <div 
            className="px-4 py-2 min-w-[80px] text-center h-[44px] flex items-center justify-center"
            style={{
              background: '#A7A7A7',
              boxShadow: '-4px -4px 0 0 rgba(255, 255, 255, 0.50) inset, 4px 4px 0 0 rgba(0, 0, 0, 0.50) inset'
            }}
          >
            <span className="text-sm text-[#000] font-['MS_Sans_Serif',system-ui,sans-serif]">
              {currentTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

