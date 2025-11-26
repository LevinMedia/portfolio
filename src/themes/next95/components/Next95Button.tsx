'use client';

import React, { useState, forwardRef } from 'react';
import { Button } from '@headlessui/react';

interface Next95ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: any;
}

const Next95Button = forwardRef<HTMLButtonElement, Next95ButtonProps>(({
  children,
  onClick,
  className = '',
  isActive = false,
  disabled = false,
  type = 'button',
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);

  const highlight = 'var(--win95-bevel-light, rgba(255, 255, 255, 0.35))';
  const shadow = 'var(--win95-bevel-dark, rgba(0, 0, 0, 0.35))';
  const isDown = isActive || isPressed;

  return (
    <Button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => !disabled && setIsPressed(false)}
      onMouseEnter={(e) => {
        if (!isPressed && !disabled) {
          e.currentTarget.style.filter = 'brightness(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'brightness(1)';
        setIsPressed(false);
      }}
      className={`px-4 py-2 text-sm transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
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
      {...props}
    >
      {children}
    </Button>
  );
});

Next95Button.displayName = 'Next95Button';

export default Next95Button;

