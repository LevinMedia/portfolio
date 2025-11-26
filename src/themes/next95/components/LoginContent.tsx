'use client';

import React, { useState } from 'react';
import Next95Button from './Next95Button';

interface LoginContentProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export default function LoginContent({ onLoginSuccess, onCancel }: LoginContentProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate network request
    setTimeout(() => {
      if (email === 'guest@levin.media' && password === 'password') {
        localStorage.setItem('next95-user-email', email);
        onLoginSuccess();
      } else {
        setError('Invalid email or password.');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div 
      className="p-6 flex flex-col items-center justify-center h-full"
      style={{ backgroundColor: 'var(--win95-button-face, #c0c0c0)' }}
    >
      <div className="w-full max-w-sm space-y-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label 
              htmlFor="email" 
              className="block text-sm font-bold"
              style={{ color: 'var(--win95-text, #000)' }}
            >
              User name:
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-2 py-1 text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--win95-content-bg, #fff)',
                color: 'var(--win95-content-text, #000)',
                border: '2px solid var(--win95-border-mid, #808080)',
                boxShadow: 'inset 2px 2px 0 0 var(--win95-border-dark), inset -2px -2px 0 0 var(--win95-border-light)'
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label 
              htmlFor="password" 
              className="block text-sm font-bold"
              style={{ color: 'var(--win95-text, #000)' }}
            >
              Password:
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-2 py-1 text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--win95-content-bg, #fff)',
                color: 'var(--win95-content-text, #000)',
                border: '2px solid var(--win95-border-mid, #808080)',
                boxShadow: 'inset 2px 2px 0 0 var(--win95-border-dark), inset -2px -2px 0 0 var(--win95-border-light)'
              }}
            />
          </div>

          {error && (
            <div 
              className="text-sm p-2 text-center font-bold"
              style={{ color: 'red' }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6 pt-4">
            <Next95Button 
              type="submit" 
              disabled={isLoading}
              className="min-w-[80px]"
            >
              {isLoading ? 'Logging in...' : 'OK'}
            </Next95Button>
            <Next95Button 
              type="button" 
              onClick={onCancel}
              disabled={isLoading}
              className="min-w-[80px]"
            >
              Cancel
            </Next95Button>
          </div>
        </form>
      </div>
    </div>
  );
}

