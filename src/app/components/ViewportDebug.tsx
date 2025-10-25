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

  return (
    <div className="flex items-center gap-2 font-mono text-xs text-foreground">
      <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
      <span>{windowSize.width} × {windowSize.height}</span>
      <span className="text-primary/70">•</span>
      <span className="text-primary font-bold">{breakpoint}</span>
    </div>
  );
};

export default ViewportDebug;
