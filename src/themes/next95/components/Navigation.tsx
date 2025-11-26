'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useWindowManager } from '../context/WindowManagerContext';
import Next95Button from './Next95Button';

interface StartMenuItem {
  label: string;
  icon?: string; // URL to the icon
  action?: () => void;
  children?: StartMenuItem[];
  disabled?: boolean;
}

export default function Navigation() {
  const { windows, setActiveWindow, restoreWindow } = useWindowManager();
  const [hoveredMenuPath, setHoveredMenuPath] = useState<string[]>([]);

  const startMenuItems = useMemo<StartMenuItem[]>(() => [
    {
      label: 'Programs',
      icon: '/folder.png',
      children: [
        {
          label: 'Accessories',
          icon: '/folder.png',
          children: [
            { label: 'Guestbook', icon: '/guestbook-icon.png', action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: 'guestbook' })) },
            { label: 'System Stats', icon: '/Stats.png', action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: 'stats' })) },
          ]
        },
        {
          label: 'LevinMedia',
          icon: '/folder.png',
          children: [
            { label: 'About', icon: '/about.png', action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: 'about' })) },
            { label: 'Howdy', icon: '/about.png', action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: 'howdy' })) },
            { label: 'Work History', icon: '/work-history.png', action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: 'work-history' })) },
            { label: 'Selected Works', icon: '/folder.png', action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: 'selected-works' })) },
          ]
        },
        {
          label: 'System Settings',
          icon: '/System-settings.png',
          action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: 'system-settings' }))
        }
      ]
    },
    {
      label: 'Documents',
      icon: '/folder.png',
      children: [
        { label: 'Featured Works', icon: '/folder.png', action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: 'selected-works' })) },
        { label: 'About.txt', icon: '/file.svg', action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: 'about' })) }
      ]
    },
    {
      label: 'Settings',
      icon: '/System-settings.png',
      children: [
        { 
          label: 'Desktop & Screen Saver', 
          icon: '/System-settings.png', 
          action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: { slug: 'system-settings', initialTab: 'desktop' } })) 
        },
        { 
          label: 'Appearance', 
          icon: '/System-settings.png', 
          action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: { slug: 'system-settings', initialTab: 'appearance' } })) 
        }
      ]
    },
    {
      label: 'Find',
      icon: '/find.png',
      children: [
        { label: 'Files or Folders...', icon: '/find.png', action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: 'selected-works' })) }
      ]
    },
    {
      label: 'Help',
      icon: '/about.png',
      action: () => document.dispatchEvent(new CustomEvent('next95-open-window', { detail: 'about' }))
    },
    {
      label: 'Run...',
      icon: '/run.png',
      action: () => alert('Not implemented')
    }
  ], []);

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
    <div className="fixed bottom-0 left-0 right-0 z-[9999]">
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
            className="w-5 h-5 flex items-center justify-center flex-shrink-0"
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
        <div className="flex-1 mx-2 h-full flex items-center gap-1 min-w-0">
          {/* Running applications */}
          <div 
            className="flex-1 flex items-center gap-[4px] overflow-x-auto"
            style={{
              // Custom scrollbar styling
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--win95-border-mid, #808080) var(--win95-button-face, #c0c0c0)'
            }}
          >
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
                className="px-4 py-2 text-sm h-[44px] min-w-[160px] max-w-[180px] truncate flex-shrink-0 text-left"
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
        {/* Start Menu */}
        {isStartMenuOpen && (
          <div className="absolute bottom-[56px] left-[4px] z-50 flex">
            <div 
              className="flex"
              style={{
                border: '1px solid var(--win95-border-dark,#000)',
                borderTop: '3px solid var(--win95-border-light,#fff)',
                borderLeft: '3px solid var(--win95-border-light,#fff)',
                borderBottom: '3px solid var(--win95-border-dark,#000)',
                borderRight: '3px solid var(--win95-border-dark,#000)',
                backgroundColor: 'var(--win95-button-face,#c0c0c0)'
              }}
            >
              <div 
                className="relative flex items-start justify-center pb-4"
                style={{
                  width: '40px',
                  borderRight: '2px solid var(--win95-border-dark,#000)',
                  overflow: 'hidden',
                  background: 'var(--win95-button-face,#c0c0c0)'
                }}
              >
                {/* Gradient Background - rotated 90 degrees */}
                <div
                  className="absolute"
                  style={{
                    width: '300vh',
                    height: '300vh',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(90deg)',
                    background: 'var(--next95-window-header, linear-gradient(90deg, #000080 0%, #1084d0 100%))',
                    transformOrigin: 'center',
                    pointerEvents: 'none'
                  }}
                />
                <span 
                  className="relative select-none whitespace-nowrap pt-4"
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
                    fontWeight: '900',
                    fontSize: '24px',
                    letterSpacing: '0',
                    color: 'var(--next95-window-header-text, #ffffff)',
                    WebkitTextStroke: '1px var(--next95-window-header-text, #ffffff)',
                    opacity: 0.5,
                    padding: '1rem 0' 
                  }}
                >
                  LevinMedia
                </span>
              </div>
              <div 
                className="flex flex-col py-2"
                style={{ minWidth: '240px' }}
                onMouseLeave={() => setHoveredMenuPath([])}
              >
                {startMenuItems.map((item, index) => (
                  <StartMenuItemRow
                    key={item.label}
                    item={item}
                    level={0}
                    menuPath={[index.toString()]}
                    hoveredPath={hoveredMenuPath}
                    setHoveredPath={setHoveredMenuPath}
                    closeMenu={() => setIsStartMenuOpen(false)}
                  />
                ))}
                <div className="border-t border-[var(--win95-border-mid,#808080)] my-2" />
                <StartMenuAuthRow closeMenu={() => setIsStartMenuOpen(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StartMenuItemRowProps {
  item: StartMenuItem;
  level: number;
  menuPath: string[];
  hoveredPath: string[];
  setHoveredPath: (path: string[]) => void;
  closeMenu: () => void;
}

function StartMenuItemRow({
  item,
  level,
  menuPath,
  hoveredPath,
  setHoveredPath,
  closeMenu
}: StartMenuItemRowProps) {
  const isHovered = hoveredPath.join('-').startsWith(menuPath.join('-'));
  const [shouldFlip, setShouldFlip] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Check for viewport overflow when opening submenu
  useEffect(() => {
    if (isHovered && item.children && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const submenuWidth = 224; // w-56 is 14rem = 224px
      const screenWidth = window.innerWidth;
      
      // Check if there's enough space on the right
      // We add a small buffer (20px)
      const overflowRight = rect.right + submenuWidth > screenWidth;
      
      setShouldFlip(overflowRight);
    }
  }, [isHovered, item.children]);

  const handleClick = () => {
    if (item.children && item.children.length > 0) {
      setHoveredPath(menuPath);
    } else if (item.action) {
      item.action();
      closeMenu();
    }
  };

  const iconSize = level === 0 ? 32 : 16;

  return (
    <div className="relative" ref={itemRef}>
      <button
        type="button"
        disabled={item.disabled}
        onMouseEnter={() => setHoveredPath(menuPath)}
        onClick={handleClick}
        className={`flex items-center w-full px-3 py-2 text-left text-sm gap-2 ${item.disabled ? 'text-gray-400' : ''}`}
        style={{
          backgroundColor: isHovered ? 'var(--next95-primary,#0000ff)' : 'transparent',
          color: isHovered ? '#ffffff' : 'var(--win95-text,#000)'
        }}
      >
        {/* Icon */}
        <div 
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
        >
          {item.icon && (
            <Image 
              src={item.icon} 
              alt="" 
              width={iconSize} 
              height={iconSize} 
              className="object-contain"
            />
          )}
        </div>

        <span className="flex-1">{item.label}</span>
        {item.children && <span className="ml-2">▶</span>}
      </button>
      {item.children && isHovered && (
        <div 
          className={`absolute top-0 w-56 bg-[var(--win95-button-face,#c0c0c0)] border border-[var(--win95-border-mid,#808080)] border-r-[var(--win95-border-dark)] border-b-[var(--win95-border-dark)] border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] shadow-lg p-[2px] z-[100]`}
          style={{
            left: shouldFlip ? 'auto' : '100%',
            right: shouldFlip ? '100%' : 'auto',
            // Adjust negative margin to overlap borders nicely if needed, or keep flush
            marginLeft: shouldFlip ? 0 : '-2px',
            marginRight: shouldFlip ? '-2px' : 0
          }}
        >
          {item.children.map((child, childIndex) => (
            <StartMenuItemRow
              key={child.label}
              item={child}
              level={level + 1}
              menuPath={[...menuPath, childIndex.toString()]}
              hoveredPath={hoveredPath}
              setHoveredPath={setHoveredPath}
              closeMenu={closeMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StartMenuAuthRow({ closeMenu }: { closeMenu: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem('next95-user-email');
    if (storedEmail) {
      setIsAuthenticated(true);
      setEmail(storedEmail);
    }
  }, []);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      localStorage.removeItem('next95-user-email');
      setIsAuthenticated(false);
      setEmail(null);
    } else {
      const mockEmail = 'guest@levin.media';
      localStorage.setItem('next95-user-email', mockEmail);
      setIsAuthenticated(true);
      setEmail(mockEmail);
    }
    closeMenu();
  };

  return (
    <button
      type="button"
      onClick={handleAuthClick}
      className="flex items-center w-full px-3 py-2 text-left text-sm gap-2 hover:bg-[var(--next95-primary,#0000ff)] hover:text-white group"
      style={{
        backgroundColor: 'transparent',
        color: 'var(--win95-text,#000)'
      }}
    >
        <div 
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '32px', height: '32px' }}
        >
            {/* Using window.svg as Shut Down icon for now */}
            <Image 
              src="/window.svg" 
              alt="" 
              width={32} 
              height={32} 
              className="object-contain"
            />
        </div>
      {isAuthenticated ? (
        <span>Log Off {email ?? 'User'}...</span>
      ) : (
        <span>Shut Down...</span>
      )}
    </button>
  );
}
