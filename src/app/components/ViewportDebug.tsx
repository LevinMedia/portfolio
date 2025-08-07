'use client';

import { useState, useEffect } from 'react';

const ViewportDebug = () => {
  const [mounted, setMounted] = useState(false);
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Set mounted to true after component mounts on client
    setMounted(true);
    
    // Check localStorage first, then fall back to system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    console.log('Initialization - savedTheme:', savedTheme);
    console.log('Initialization - systemPrefersDark:', systemPrefersDark);
    
    let initialTheme: 'light' | 'dark';
    if (savedTheme) {
      // User has manually set a preference
      initialTheme = savedTheme;
    } else {
      // Use system preference
      initialTheme = systemPrefersDark ? 'dark' : 'light';
    }
    
    console.log('Initialization - initialTheme:', initialTheme);
    setTheme(initialTheme);
    
    // Apply theme to HTML element
    const html = document.documentElement;
    console.log('Initialization - HTML classes before:', html.classList.toString());
    if (initialTheme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
    console.log('Initialization - HTML classes after:', html.classList.toString());
  }, []);

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBreakpoint = (width: number): string => {
    if (width >= 1536) return '2xl';
    if (width >= 1280) return 'xl';
    if (width >= 1024) return 'lg';
    if (width >= 768) return 'md';
    if (width >= 640) return 'sm';
    if (width >= 384) return 'xs';
    return 'xxs';
  };

  const breakpoint = getBreakpoint(windowSize.width);

  const handleToggle = () => {
    console.log('Toggle clicked! Current theme:', theme);
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('New theme will be:', newTheme);
    setTheme(newTheme);
    
    // Update localStorage and HTML class
    localStorage.setItem('theme', newTheme);
    const html = document.documentElement;
    console.log('HTML classes before:', html.classList.toString());
    if (newTheme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
    console.log('HTML classes after:', html.classList.toString());
  };

  return (
    <div className="fixed bottom-4 right-4 bg-background text-primary px-3 py-2 rounded-md font-mono text-xs z-50 border border-primary/30 shadow-lg backdrop-blur-sm flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
        <span className="text-foreground">{windowSize.width} × {windowSize.height}</span>
        <span className="text-primary/70">•</span>
        <span className="text-primary font-bold">{breakpoint}</span>
      </div>
      <button
        aria-label="Toggle light/dark mode"
        onClick={handleToggle}
        className="ml-2 p-1 rounded hover:bg-primary/20 transition-colors text-lg"
        style={{ lineHeight: 1 }}
      >
        {mounted ? (theme === 'dark' ? '🌙' : '☀️') : '•'}
      </button>
    </div>
  );
};

export default ViewportDebug;
