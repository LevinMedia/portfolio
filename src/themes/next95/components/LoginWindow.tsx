'use client';

import React from 'react';
import Window from './Window';
import LoginContent from './LoginContent';

interface LoginWindowProps {
  onClose: () => void;
}

export default function LoginWindow({ onClose }: LoginWindowProps) {
  return (
    <Window
      id="login"
      title="Log in"
      slug="login"
      defaultWidth={400}
      defaultHeight={250}
      resizable={false}
      onClose={onClose}
    >
      <LoginContent 
        onLoginSuccess={() => {
          // Dispatch event to update auth state in other components
          window.dispatchEvent(new Event('storage'));
          onClose();
        }}
        onCancel={onClose}
      />
    </Window>
  );
}

