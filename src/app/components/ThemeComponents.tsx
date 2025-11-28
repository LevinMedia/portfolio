'use client';

import type { ComponentType } from 'react';
import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/themes/ThemeProvider';
import type { ThemeComponentKey, ThemeComponentLoader } from '@/lib/themes/types';

// Define explicit prop types for theme components
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface NavigationProps {}

interface HowdyData {
  image_src: string;
  image_alt: string;
  greeting: string;
  li_1: string | null;
  li_2: string | null;
}

interface HowdyProps {
  data?: HowdyData;
  onSelectedWorksClick?: () => void;
  onSiteSettingsClick?: () => void;
  // Extended props to support next95 theme
  isOpen?: boolean;
  onClose?: () => void;
}

const componentCache = new Map<string, ComponentType<unknown>>();

const defaultNavigationLoader: ThemeComponentLoader<NavigationProps> = () =>
  import('@/themes/my-first-theme/components/Navigation');
const defaultHowdyLoader: ThemeComponentLoader<HowdyProps> = () =>
  import('@/themes/my-first-theme/components/Howdy');

function useThemedComponent<Props>(
  key: ThemeComponentKey,
  fallbackLoader?: ThemeComponentLoader<Props>
) {
  const { theme } = useTheme();
  const loader = (theme.components[key] as ThemeComponentLoader<Props>) ?? fallbackLoader;
  const cacheKey = `${theme.id}:${key}`;

  const [Component, setComponent] = useState<ComponentType<Props> | null>(() => {
    return (componentCache.get(cacheKey) as ComponentType<Props>) ?? null;
  });

  useEffect(() => {
    let cancelled = false;

    if (!loader) {
      setComponent(null);
      return;
    }

    const loadComponent = async () => {
      try {
        const mod = await loader();
        const LoadedComponent = mod.default as ComponentType<Props>;
        componentCache.set(cacheKey, LoadedComponent as ComponentType<unknown>);
        if (!cancelled) {
          setComponent(() => LoadedComponent);
        }
      } catch (error) {
        console.error(`Failed to load themed component "${key}"`, error);
        if (!cancelled) {
          setComponent(null);
        }
      }
    };

    void loadComponent();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, loader, key]);

  return Component;
}

export function ThemeNavigation(props: NavigationProps) {
  const Component = useThemedComponent<NavigationProps>('navigation', defaultNavigationLoader);
  if (!Component) return null;
  return React.createElement(Component as ComponentType<NavigationProps>, props as NavigationProps);
}

export function ThemeHowdy(props: HowdyProps) {
  const Component = useThemedComponent<HowdyProps>('howdy', defaultHowdyLoader);
  if (!Component) return null;
  return React.createElement(Component as ComponentType<HowdyProps>, props as HowdyProps);
}

