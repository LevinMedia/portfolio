'use client';

import { useEffect, useRef, useState } from 'react';
import { ParticleEngine } from '@/lib/particle-engine';
import type { ParticleConfig } from '@/lib/particle-types';

// Base particle configuration (colors will be overridden by theme)
const BASE_CONFIG: Omit<ParticleConfig, 'peakColor' | 'troughColor'> = {
  size: 1,
  gridDensity: 143,
  waveAmplitude: 1,
  waveFrequency: 0.5,
  waveSpeed: 0.1,
  waveCount: 3,
  waveDirection: 220,
  cameraRoll: -8,
  cameraPitch: -72,
  cameraAltitude: 1000,
  colorMode: "gradient",
  particleColor: "#ff00ff",
  backgroundColor: "#0a0a0a",
  backgroundGradient: "#1a1a2e",
};

function getThemeColors(): { primary: string; secondary: string } {
  if (typeof window === 'undefined') {
    return { primary: '#C614E1', secondary: '#cc3f84' };
  }
  
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  const primary = computedStyle.getPropertyValue('--primary').trim() || '#C614E1';
  const secondary = computedStyle.getPropertyValue('--secondary').trim() || '#cc3f84';
  
  return { primary, secondary };
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [themeColors, setThemeColors] = useState({ primary: '#C614E1', secondary: '#cc3f84' });

  // Watch for theme color changes
  useEffect(() => {
    const updateColors = () => {
      const colors = getThemeColors();
      setThemeColors(colors);
    };

    // Initial color load
    updateColors();

    // Watch for theme changes via MutationObserver
    const observer = new MutationObserver(() => {
      updateColors();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // Also listen for storage events (when theme changes in another tab)
    window.addEventListener('storage', updateColors);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', updateColors);
    };
  }, []);

  // Update particle colors when theme changes
  useEffect(() => {
    if (engineRef.current) {
      const config: ParticleConfig = {
        ...BASE_CONFIG,
        peakColor: themeColors.primary,
        troughColor: themeColors.secondary,
      };
      engineRef.current.updateConfig(config);
    }
  }, [themeColors]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const displayWidth = Math.floor(rect.width);
      const displayHeight = Math.floor(rect.height);
      
      // Only update if size actually changed to avoid unnecessary redraws
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        // Set internal canvas size (actual pixels)
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        
        // Reset transform and scale context to match device pixel ratio
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        
        // Reinitialize grid with new canvas size
        if (engineRef.current) {
          engineRef.current.setGridMode(true);
        }
      }
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(canvas);

    if (!engineRef.current) {
      engineRef.current = new ParticleEngine(ctx, canvas);
    }

    const initialConfig: ParticleConfig = {
      ...BASE_CONFIG,
      peakColor: themeColors.primary,
      troughColor: themeColors.secondary,
    };
    engineRef.current.updateConfig(initialConfig);
    engineRef.current.setGridMode(true);

    const animate = () => {
      engineRef.current?.update();
      engineRef.current?.draw();
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [themeColors]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full absolute inset-0"
      style={{
        background: BASE_CONFIG.backgroundColor,
        pointerEvents: 'none',
      }}
    />
  );
}

