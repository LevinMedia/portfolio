'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Window from './Window';

interface HowdyData {
  image_src: string;
  image_alt: string;
  greeting: string;
  li_1: string | null;
  li_2: string | null;
}

interface HowdyProps {
  onSelectedWorksClick?: () => void;
  onSiteSettingsClick?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

function Win95Button({
  children,
  onClick,
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 text-sm border-2 border-[#ffffff] border-b-[#000000] border-r-[#000000] bg-[#c0c0c0] text-[#000] shadow-[inset_1px_1px_0_#dfdfdf,inset_-1px_-1px_0_#808080] hover:shadow-[inset_-1px_-1px_0_#dfdfdf,inset_1px_1px_0_#808080] active:shadow-[inset_-1px_-1px_0_#ffffff,inset_1px_1px_0_#000000] active:bg-[#c0c0c0] min-w-[120px] ${className}`}
    >
      {children}
    </button>
  );
}

export default function Howdy({
  onSelectedWorksClick,
  onSiteSettingsClick,
  isOpen = true,
  onClose: onCloseParent
}: HowdyProps) {
  const [remoteData, setRemoteData] = useState<HowdyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWindowClosed, setIsWindowClosed] = useState(!isOpen);

  // Fetch howdy data once on mount
  useEffect(() => {
    let cancelled = false;

    const fetchHowdy = async () => {
      try {
        const response = await fetch('/api/howdy', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Unable to load howdy content');
        }
        const payload = (await response.json()) as HowdyData;
        if (!cancelled) {
          setRemoteData(payload);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load content');
        }
      }
    };

    void fetchHowdy();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle reopening from external control (desktop icon click)
  useEffect(() => {
    if (isOpen && isWindowClosed) {
      setIsWindowClosed(false);
    }
  }, [isOpen]); // Only depend on isOpen, not isWindowClosed

  if (!remoteData || isWindowClosed) {
    return null;
  }

  const content = remoteData;
  const listItems = [content.li_1, content.li_2].filter(Boolean);

  // Center the window on screen
  const windowWidth = 520;
  const defaultX = typeof window !== 'undefined' ? (window.innerWidth - windowWidth) / 2 : 100;
  const defaultY = typeof window !== 'undefined' ? (window.innerHeight - 300) / 2 : 100;

  const handleClose = () => {
    setIsWindowClosed(true);
    if (onCloseParent) {
      onCloseParent();
    }
  };

  return (
    <Window
      id="welcome"
      title="Howdy"
      defaultWidth={windowWidth}
      defaultX={defaultX}
      defaultY={defaultY}
      onClose={handleClose}
      draggable={true}
      resizable={true}
    >
      <div className="h-full flex flex-col">
        {/* Content Area - scrollable if overflows */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 @[350px]:p-4 @[600px]:p-6 @[800px]:p-8">
          <div className="flex flex-col gap-3 @[500px]:gap-4 @[700px]:gap-6 min-h-full @[450px]:flex-row @[450px]:items-center">
            {/* Photo - square and full width when vertical, portrait when horizontal */}
            <div className="flex-shrink-0">
              <div className="relative w-full aspect-square @[450px]:w-32 @[450px]:h-44 @[450px]:aspect-auto @[600px]:w-40 @[600px]:h-56 @[700px]:w-48 @[700px]:h-64 @[800px]:w-56 @[800px]:h-72 @[900px]:w-64 @[900px]:h-80 @[1000px]:w-72 @[1000px]:h-96 @[1100px]:w-80 @[1100px]:h-[26rem] @[1200px]:w-96 @[1200px]:h-[32rem] border-2 border-[#000] bg-[#ffe45c] overflow-hidden">
                <Image 
                  src={content.image_src} 
                  alt={content.image_alt} 
                  fill 
                  className="object-cover" 
                  sizes="(max-width: 449px) 100vw, (max-width: 600px) 128px, (max-width: 700px) 160px, (max-width: 800px) 192px, (max-width: 900px) 224px, (max-width: 1000px) 256px, (max-width: 1100px) 288px, 384px" 
                  priority 
                />
              </div>
            </div>
            
            {/* Text Content - left aligned when stacked, scales with both width and height */}
            <div className="flex-1 space-y-1 @[500px]:space-y-2 @[700px]:space-y-3 @[900px]:space-y-4">
              <p className="text-lg @[400px]:text-xl @[600px]:text-2xl @[700px]:text-3xl @[800px]:text-4xl @[900px]:text-5xl @[1000px]:text-5xl @[1200px]:text-6xl font-bold text-[#111] leading-tight text-left">
                {content.greeting}
              </p>
              {error && <p className="text-xs text-destructive">{error}</p>}
              {listItems.length > 0 && (
                <ul className="list-none space-y-1 @[500px]:space-y-1.5 @[700px]:space-y-2 @[900px]:space-y-3 text-sm @[400px]:text-base @[600px]:text-lg @[700px]:text-xl @[800px]:text-2xl @[900px]:text-3xl @[1000px]:text-3xl @[1200px]:text-4xl text-[#111]">
                  {listItems.map((item, index) => {
                    const [emoji, ...rest] = item.split(' ');
                    return (
                      <li key={`${item}-${index}`} className="flex items-start gap-2 @[600px]:gap-3 @[800px]:gap-4">
                        <span className="text-xl @[400px]:text-2xl @[600px]:text-3xl @[700px]:text-4xl @[800px]:text-5xl @[900px]:text-6xl @[1000px]:text-6xl @[1200px]:text-7xl leading-none flex-shrink-0">
                          {emoji || '•'}
                        </span>
                        <span className="leading-snug text-left">{rest.join(' ')}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Buttons - fixed at bottom */}
        <div className="flex-shrink-0 border-t border-[#808080] bg-[#c0c0c0] p-3 @[350px]:p-4 @[600px]:p-6 @[800px]:p-8">
          <div className="flex flex-col @[450px]:flex-row gap-2 @[600px]:gap-3 @[800px]:gap-4">
            <div className="flex-1">
              <Win95Button 
                onClick={onSelectedWorksClick} 
                className="w-full text-sm @[400px]:text-base @[600px]:text-lg @[800px]:text-xl @/h-[600px]:text-xl @[450px]/h-[700px]:text-2xl py-2 @[600px]:py-3 @[800px]:py-4 @/h-[500px]:py-4 @/h-[600px]:py-5 @[450px]/h-[700px]:py-6"
              >
                Selected Works
              </Win95Button>
            </div>
            <div className="flex-1">
              <Win95Button 
                onClick={onSiteSettingsClick} 
                className="w-full text-sm @[400px]:text-base @[600px]:text-lg @[800px]:text-xl @/h-[600px]:text-xl @[450px]/h-[700px]:text-2xl py-2 @[600px]:py-3 @[800px]:py-4 @/h-[500px]:py-4 @/h-[600px]:py-5 @[450px]/h-[700px]:py-6"
              >
                System Settings
              </Win95Button>
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
}

