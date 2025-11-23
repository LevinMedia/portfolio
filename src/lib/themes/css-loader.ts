import type { ThemeDefinition, ThemeId } from './types';

const THEME_STYLE_ATTR = 'data-theme-style';
const THEME_ID_ATTR = 'data-theme-id';

const pendingLoads = new Map<string, Promise<void>>();
const CSS_PATH_ATTR = 'data-css-path';

function createThemeLink(href: string, themeId: ThemeId) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute(THEME_STYLE_ATTR, 'true');
  link.setAttribute(THEME_ID_ATTR, themeId);
  link.setAttribute(CSS_PATH_ATTR, href);
  return link;
}

export async function ensureThemeStyles(theme: ThemeDefinition) {
  if (typeof document === 'undefined') return;
  const cssHref = theme.cssPath;

  const current = document.head.querySelector<HTMLLinkElement>(`link[${THEME_STYLE_ATTR}]`);
  if (current && current.getAttribute(CSS_PATH_ATTR) === cssHref) {
    return;
  }

  if (pendingLoads.has(cssHref)) {
    return pendingLoads.get(cssHref);
  }

  const link = createThemeLink(cssHref, theme.id);

  const loadPromise = new Promise<void>((resolve, reject) => {
    link.onload = () => {
      pendingLoads.delete(cssHref);
      if (current) current.remove();
      resolve();
    };
    link.onerror = (error) => {
      pendingLoads.delete(cssHref);
      link.remove();
      reject(error);
    };
  });

  pendingLoads.set(cssHref, loadPromise);
  document.head.appendChild(link);

  return loadPromise;
}

export function getActiveThemeLink() {
  if (typeof document === 'undefined') return null;
  return document.head.querySelector<HTMLLinkElement>(`link[${THEME_STYLE_ATTR}]`);
}

export function unloadThemeStyles(themeId?: ThemeId) {
  if (typeof document === 'undefined') return;
  const current = getActiveThemeLink();
  if (!current) return;
  if (themeId && current.getAttribute(THEME_ID_ATTR) !== themeId) {
    return;
  }
  current.remove();
}

