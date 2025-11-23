import myFirstTheme from '@/themes/my-first-theme/config';
import next95Theme from '@/themes/next95/config';
import type { ThemeDefinition, ThemeId, ThemeSummary } from './types';

const registryArray = [myFirstTheme, next95Theme] as const;

export const themeRegistry = registryArray.reduce<Record<ThemeId, ThemeDefinition>>(
  (acc, theme) => {
    acc[theme.id] = theme;
    return acc;
  },
  {}
);

export type RegisteredThemeId = keyof typeof themeRegistry;

export const defaultThemeId: ThemeId = 'my-first-theme';

export function getThemeDefinition(themeId: ThemeId): ThemeDefinition | undefined {
  return themeRegistry[themeId];
}

export function listThemes(): ThemeSummary[] {
  return registryArray.map(({ id, name, description, previewImage }) => ({
    id,
    name,
    description,
    previewImage
  }));
}

