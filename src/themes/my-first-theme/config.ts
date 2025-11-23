import type { ThemeDefinition } from '@/lib/themes/types';

const themeCssHref = new URL('./styles/theme.css', import.meta.url).toString();

const myFirstTheme: ThemeDefinition = {
  id: 'my-first-theme',
  name: 'My First Theme',
  description: 'The current LevinMedia experience.',
  version: '1.0.0',
  cssPath: themeCssHref,
  components: {
    navigation: () => import('./components/Navigation'),
    howdy: () => import('./components/Howdy')
  },
  tags: ['default', 'particles'],
  layoutConfig: {
    particleBackground: true,
    gridPattern: true
  }
};

export default myFirstTheme;

