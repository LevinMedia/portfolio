import type { ComponentType } from 'react';

export type ThemeId = string;

export type ThemeComponentKey = 'layout' | 'navigation' | 'howdy';

export type ThemeComponentLoader<TProps = Record<string, unknown>> = () => Promise<{
  default: ComponentType<TProps>;
}>;

export type ThemeComponentMap = Partial<Record<ThemeComponentKey, ThemeComponentLoader>>;

export interface ThemeLayoutConfig {
  particleBackground?: boolean;
  gridPattern?: boolean;
  fullWidth?: boolean; // Remove max-width wrapper and padding
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description?: string;
  version?: string;
  previewImage?: string;
  cssPath: string;
  components: ThemeComponentMap;
  tags?: string[];
  layoutConfig?: ThemeLayoutConfig;
}

export interface ThemeSummary {
  id: ThemeId;
  name: string;
  description?: string;
  previewImage?: string;
}


