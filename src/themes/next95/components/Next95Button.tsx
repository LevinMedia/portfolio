'use client';

import React, { useState } from 'react';
import { Button } from '@headlessui/react';

interface Next95ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
}

export default function Next95Button({
  children,
  onClick,
  className = '',
  isActive = false
}: Next95ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const highlight = 'var(--win95-bevel-light, rgba(255, 255, 255, 0.35))';
  const shadow = 'var(--win95-bevel-dark, rgba(0, 0, 0, 0.35))';
  const isDown = isActive || isPressed;

  return (
    <Button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseEnter={(e) => {
        if (!isPressed) {
          e.currentTarget.style.filter = 'brightness(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'brightness(1)';
        setIsPressed(false);
      }}
      className={`px-4 py-2 text-sm transition-all ${className}`}
      style={{
        background: isPressed
          ? 'var(--win95-button-pressed, #959595)'
          : 'var(--win95-taskbar-bg, #9F9F9F)',
        color: 'var(--win95-text, #000)',
        borderTop: `4px solid ${isDown ? shadow : highlight}`,
        borderLeft: `4px solid ${isDown ? shadow : highlight}`,
        borderRight: `4px solid ${isDown ? highlight : shadow}`,
        borderBottom: `4px solid ${isDown ? highlight : shadow}`,
        borderRadius: '0',
        boxShadow: 'none'
      }}
    >
      {children}
    </Button>
  );
}

