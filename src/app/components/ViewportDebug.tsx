'use client';

import { useState, useEffect } from 'react';

const ViewportDebug = () => {
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Set initial size
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
    return 'xs';
  };

  const breakpoint = getBreakpoint(windowSize.width);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-purple-400 px-3 py-2 rounded-md font-mono text-xs z-50 border border-purple-500/30 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
        <span className="text-white">{windowSize.width} × {windowSize.height}</span>
        <span className="text-purple-300">•</span>
        <span className="text-purple-400 font-bold">{breakpoint}</span>
      </div>
    </div>
  );
};

export default ViewportDebug;
