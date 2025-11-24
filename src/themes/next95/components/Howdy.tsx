'use client';

import React from 'react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Window from './Window';
import Next95Button from './Next95Button';

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
      slug="howdy"
      title="Howdy"
      icon={
        remoteData?.image_src ? (
          <Image src={remoteData.image_src} alt="" width={16} height={16} className="object-cover" />
        ) : undefined
      }
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
              <div 
                className="relative w-full aspect-square @[450px]:w-32 @[450px]:h-44 @[450px]:aspect-auto @[600px]:w-40 @[600px]:h-56 @[700px]:w-48 @[700px]:h-64 @[800px]:w-56 @[800px]:h-72 @[900px]:w-64 @[900px]:h-80 @[1000px]:w-72 @[1000px]:h-96 @[1100px]:w-80 @[1100px]:h-[26rem] @[1200px]:w-96 @[1200px]:h-[32rem] border-2 bg-[#ffe45c] overflow-hidden"
                style={{ borderColor: 'var(--win95-text, #000)' }}
              >
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
              <p className="text-lg @[400px]:text-xl @[600px]:text-2xl @[700px]:text-3xl @[800px]:text-4xl @[900px]:text-5xl @[1000px]:text-5xl @[1200px]:text-6xl font-bold leading-tight text-left" style={{ color: 'var(--win95-content-text, #111)' }}>
                {content.greeting}
              </p>
              {error && <p className="text-xs text-destructive">{error}</p>}
              {listItems.length > 0 && (
                <ul className="list-none space-y-1 @[500px]:space-y-1.5 @[700px]:space-y-2 @[900px]:space-y-3 text-sm @[400px]:text-base @[600px]:text-lg @[700px]:text-xl @[800px]:text-2xl @[900px]:text-3xl @[1000px]:text-3xl @[1200px]:text-4xl" style={{ color: 'var(--win95-content-text, #111)' }}>
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
        <div 
          className="flex-shrink-0 border-t p-3 @[350px]:p-4 @[600px]:p-6 @[800px]:p-8"
          style={{
            borderColor: 'var(--win95-border-mid, #808080)',
            backgroundColor: 'var(--win95-button-face, #c0c0c0)'
          }}
        >
          <div className="flex flex-col @[450px]:flex-row gap-2 @[600px]:gap-3 @[800px]:gap-4">
            <div className="flex-1">
              <Next95Button 
                onClick={onSelectedWorksClick} 
                className="w-full text-sm @[400px]:text-base @[600px]:text-lg @[800px]:text-xl @/h-[600px]:text-xl @[450px]/h-[700px]:text-2xl py-2 @[600px]:py-3 @[800px]:py-4 @/h-[500px]:py-4 @/h-[600px]:py-5 @[450px]/h-[700px]:py-6"
              >
                Selected Works
              </Next95Button>
            </div>
            <div className="flex-1">
              <Next95Button 
                onClick={onSiteSettingsClick} 
                className="w-full text-sm @[400px]:text-base @[600px]:text-lg @[800px]:text-xl @/h-[600px]:text-xl @[450px]/h-[700px]:text-2xl py-2 @[600px]:py-3 @[800px]:py-4 @/h-[500px]:py-4 @/h-[600px]:py-5 @[450px]/h-[700px]:py-6"
              >
                System Settings
              </Next95Button>
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
}

