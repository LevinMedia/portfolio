'use client';

import Window from './Window';
import Image from 'next/image';

interface NotFoundWindowProps {
  attemptedPath: string;
  onClose: () => void;
}

export default function NotFoundWindow({ attemptedPath, onClose }: NotFoundWindowProps) {
  return (
    <Window
      id="not-found"
      slug="404"
      title="Window Not Found"
      icon={
        <Image
          src="/System-settings.png"
          alt="Warning"
          width={16}
          height={16}
        />
      }
      defaultWidth={400}
      defaultHeight={240}
      defaultX={140}
      defaultY={120}
      onClose={onClose}
      draggable
      resizable={false}
    >
      <div
        className="h-full p-4 flex flex-col gap-4 text-sm"
        style={{
          backgroundColor: 'var(--win95-content-bg, #ffffff)',
          color: 'var(--win95-content-text, #000000)'
        }}
      >
        <div className="font-bold text-base">This window doesn&apos;t exist.</div>
        <p>
          We couldn&apos;t find anything for <span className="font-mono">{attemptedPath || '/'}</span>.
          Check the link and try again, or pick a window from the desktop.
        </p>
        <button
          onClick={onClose}
          className="self-end px-4 py-2 text-sm border-2"
          style={{
            borderColor: 'var(--win95-border-mid, #808080)',
            backgroundColor: 'var(--win95-button-face, #c0c0c0)',
            boxShadow: 'inset -2px -2px 0 0 var(--win95-bevel-light, rgba(255,255,255,0.35)), inset 2px 2px 0 0 var(--win95-bevel-dark, rgba(0,0,0,0.35))'
          }}
        >
          Close
        </button>
      </div>
    </Window>
  );
}

