'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

export interface TaskbarWindow {
  id: string;
  title: string;
  isActive: boolean;
  isMinimized: boolean;
}

interface WindowManagerContextType {
  windows: TaskbarWindow[];
  registerWindow: (id: string, title: string) => void;
  unregisterWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  updateWindowTitle: (id: string, title: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<TaskbarWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const windowsRef = useRef<TaskbarWindow[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

  const registerWindow = useCallback((id: string, title: string) => {
    setWindows(prev => {
      // Check if already registered
      if (prev.some(w => w.id === id)) return prev;
      return [...prev, { id, title, isActive: false, isMinimized: false }];
    });
    setActiveWindowId(id);
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    setActiveWindowId(null);
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false } : w));
    setActiveWindowId(id);
  }, []);

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

  const setActiveWindow = useCallback((id: string) => {
    setActiveWindowId(id);
  }, []);

  const updateWindowTitle = useCallback((id: string, title: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, title } : w));
  }, []);

  // Compute windows with active state
  const windowsWithActiveState = windows.map(w => ({
    ...w,
    isActive: w.id === activeWindowId
  }));

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

