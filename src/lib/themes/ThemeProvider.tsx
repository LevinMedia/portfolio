'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { defaultThemeId, getThemeDefinition, listThemes } from './registry';
import type { ThemeDefinition, ThemeId, ThemeSummary } from './types';
import { ensureThemeStyles } from './css-loader';

interface ThemeProviderProps {
  initialThemeId?: ThemeId;
  children: ReactNode;
}

interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeDefinition;
  themes: ThemeSummary[];
  isSwitching: boolean;
  setThemeId: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(themeId?: ThemeId): ThemeDefinition {
  const requested = themeId ? getThemeDefinition(themeId) : undefined;
  const fallback = getThemeDefinition(defaultThemeId);

  if (!requested && !fallback) {
    throw new Error('No themes registered. Ensure theme registry is configured.');
  }

  return requested ?? (fallback as ThemeDefinition);
}

export function ThemeProvider({ initialThemeId, children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeDefinition>(() => resolveTheme(initialThemeId));
  const [requestedThemeId, setRequestedThemeId] = useState<ThemeId>(theme.id);
  const [isSwitching, setIsSwitching] = useState(false);
  const availableThemes = useMemo(() => listThemes(), []);

  useEffect(() => {
    setRequestedThemeId(initialThemeId ?? theme.id);
  }, [initialThemeId, theme.id]);

  useEffect(() => {
    let cancelled = false;

    const loadTheme = async (nextId: ThemeId, force = false) => {
      const nextTheme = resolveTheme(nextId);
      if (!force && nextTheme.id === theme.id) {
        await ensureThemeStyles(nextTheme);
        return;
      }

      setIsSwitching(true);
      try {
        await ensureThemeStyles(nextTheme);
        if (!cancelled) {
          setTheme(nextTheme);
        }
      } catch (error) {
        console.error('Failed to load theme styles', error);
      } finally {
        if (!cancelled) {
          setIsSwitching(false);
        }
      }
    };

    void loadTheme(requestedThemeId, requestedThemeId === theme.id);

    return () => {
      cancelled = true;
    };
  }, [requestedThemeId, theme]);

  const setThemeId = (nextId: ThemeId) => {
    setRequestedThemeId((current) => (current === nextId ? current : nextId));
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId: theme.id,
      theme,
      themes: availableThemes,
      isSwitching,
      setThemeId
    }),
    [theme, availableThemes, isSwitching]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

