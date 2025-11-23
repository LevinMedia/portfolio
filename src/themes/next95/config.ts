import type { ThemeDefinition } from '@/lib/themes/types';

const cssPath = new URL('./styles/theme.css', import.meta.url).toString();

const next95Theme: ThemeDefinition = {
  id: 'next95',
  name: 'Next95',
  description: 'Windows 95-inspired UI with beveled chrome and retro charm.',
  version: '0.1.0',
  cssPath,
  components: {
    navigation: () => import('./components/Navigation'),
    howdy: () => import('./components/Howdy')
  },
  tags: ['retro', 'windows-95', 'experimental'],
  layoutConfig: {
    particleBackground: false,
    gridPattern: false,
    fullWidth: true
  }
};

export default next95Theme;

