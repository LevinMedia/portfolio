'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

interface RegisteredWindow {
  id: string;
  title: string;
  isMinimized: boolean;
  slug?: string;
  zIndex: number;
}

export interface TaskbarWindow extends RegisteredWindow {
  isActive: boolean;
}

interface WindowManagerContextType {
  windows: TaskbarWindow[];
  registerWindow: (id: string, title: string, slug?: string) => void;
  unregisterWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  updateWindowTitle: (id: string, title: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<RegisteredWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const windowsRef = useRef<RegisteredWindow[]>([]);
  const nextZIndexRef = useRef(1);

  // Keep ref in sync with state
  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

  const registerWindow = useCallback((id: string, title: string, slug?: string) => {
    setWindows(prev => {
      // Check if already registered
      const existing = prev.find(w => w.id === id);
      if (existing) {
        return prev.map(w => w.id === id ? { ...w, title, slug } : w);
      }
      const newZIndex = nextZIndexRef.current++;
      return [...prev, { id, title, slug, isMinimized: false, zIndex: newZIndex }];
    });
    setActiveWindowId(id);
  }, []);

  const setActiveWindow = useCallback((id: string) => {
    const newZIndex = nextZIndexRef.current++;
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: newZIndex } : w));
    setActiveWindowId(id);
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    setActiveWindowId(null);
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false } : w));
    setActiveWindow(id);
  }, [setActiveWindow]);

  const unregisterWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    
    setActiveWindowId(prev => {
      // If we're closing the active window, activate the next one
      if (prev === id) {
        const remaining = windowsRef.current.filter(w => w.id !== id && !w.isMinimized);
        // Activate the last non-minimized window in the list
        return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      }
      return prev;
    });
  }, []);

  const updateWindowTitle = useCallback((id: string, title: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, title } : w));
  }, []);

  // Compute windows with active state
  const windowsWithActiveState: TaskbarWindow[] = windows
    .map(w => ({
      ...w,
      isActive: w.id === activeWindowId
    }))
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <WindowManagerContext.Provider value={{
      windows: windowsWithActiveState,
      registerWindow,
      unregisterWindow,
      setActiveWindow,
      updateWindowTitle,
      minimizeWindow,
      restoreWindow
    }}>
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager() {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within WindowManagerProvider');
  }
  return context;
}

