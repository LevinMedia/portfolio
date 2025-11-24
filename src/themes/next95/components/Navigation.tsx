'use client';

import { useState, useEffect } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import Next95Button from './Next95Button';

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
      <div 
        className="border-t-2 h-[56px] flex items-center justify-between px-[4px]"
        style={{
          backgroundColor: 'var(--win95-taskbar-bg, #9F9F9F)',
          borderTopColor: 'var(--win95-border-light, #dfdfdf)',
          boxShadow: 'inset 0 4px 0 var(--win95-border-light, #ffffff)'
        }}
      >
        {/* Start Button */}
        <Next95Button
          onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
          isActive={isStartMenuOpen}
          className="flex items-center gap-2 px-3 py-1 text-base font-bold h-[44px] min-w-[80px]"
        >
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              border: '1px solid var(--win95-text, #000)',
              backgroundColor: 'var(--win95-content-bg, #ffffff)'
            }}
          >
            <span 
              className="text-[10px] font-bold font-[family-name:var(--font-geist-mono)] leading-none"
              style={{ color: 'var(--win95-text, #000)' }}
            >
              LM
            </span>
          </div>
          <span className="leading-none">Start</span>
        </Next95Button>

        {/* Task Area */}
        <div className="flex-1 mx-2 h-full flex items-center gap-1">
          {/* Running applications */}
          <div className="flex-1 flex items-center gap-[4px] overflow-x-auto">
            {windows.map((window) => (
              <Next95Button
                key={window.id}
                onClick={() => {
                  if (window.isMinimized) {
                    restoreWindow(window.id);
                  } else {
                    setActiveWindow(window.id);
                  }
                }}
                isActive={window.isActive && !window.isMinimized}
                className="px-4 py-2 text-sm h-[44px] max-w-[180px] truncate"
              >
                {window.title}
              </Next95Button>
            ))}
          </div>
        </div>

        {/* System Tray with Clock */}
        <div className="flex items-center h-full">
          <div 
            className="w-[3px] h-[80%]"
            style={{
              borderLeft: '2px solid var(--win95-border-mid, #808080)',
              borderRight: '2px solid var(--win95-border-light, #ffffff)'
            }}
          />
          <div 
            className="px-4 py-2 min-w-[80px] text-center h-[44px] flex items-center justify-center"
            style={{
              background: 'var(--win95-button-face, #A7A7A7)',
              boxShadow: '-4px -4px 0 0 var(--win95-border-light, rgba(255, 255, 255, 0.50)) inset, 4px 4px 0 0 var(--win95-border-dark, rgba(0, 0, 0, 0.50)) inset'
            }}
          >
            <span 
              className="text-sm font-['MS_Sans_Serif',system-ui,sans-serif]"
              style={{ color: 'var(--win95-text, #000)' }}
            >
              {currentTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

