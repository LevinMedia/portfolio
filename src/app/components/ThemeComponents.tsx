'use client';

import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/themes/ThemeProvider';
import type { ThemeComponentKey, ThemeComponentLoader } from '@/lib/themes/types';
import type NavigationDefault from '@/themes/my-first-theme/components/Navigation';
import type HowdyDefault from '@/themes/my-first-theme/components/Howdy';

type ExtractProps<T> = T extends (props: infer P) => unknown ? P : Record<string, never>;

type NavigationProps = ExtractProps<typeof NavigationDefault>;
type HowdyPropsBase = ExtractProps<typeof HowdyDefault>;

// Extended props to support both themes
interface HowdyProps extends HowdyPropsBase {
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
        const module = await loader();
        const LoadedComponent = module.default as ComponentType<Props>;
        componentCache.set(cacheKey, LoadedComponent);
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
  return <Component {...props} />;
}

export function ThemeHowdy(props: HowdyProps) {
  const Component = useThemedComponent<HowdyProps>('howdy', defaultHowdyLoader);
  if (!Component) return null;
  return <Component {...props} />;
}

