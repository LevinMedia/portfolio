import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Foundations/Themes',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Theme color definitions with their purposes
const themeColors = {
  light: [
    { name: 'Background', value: '#ffffff', usage: 'Main page background, card backgrounds' },
    { name: 'Foreground', value: '#1a1a1a', usage: 'Primary text color, headings' },
    { name: 'Muted', value: '#f1f5f9', usage: 'Secondary backgrounds, subtle sections' },
    { name: 'Muted Foreground', value: '#64748b', usage: 'Secondary text, placeholders, captions' },
    { name: 'Border', value: '#e2e8f0', usage: 'Dividers, input borders, card outlines' },
    { name: 'Primary', value: '#c026d3', usage: 'Main brand color, primary buttons, links' },
    { name: 'Secondary', value: '#ec4899', usage: 'Secondary buttons, highlights, badges' },
    { name: 'Accent', value: '#0891b2', usage: 'Success states, positive actions, progress' },
    { name: 'Destructive', value: '#dc2626', usage: 'Error states, delete actions, warnings' },
    { name: 'Ring', value: '#c026d3', usage: 'Focus indicators, selection outlines' },
  ],
  dark: [
    { name: 'Background', value: '#242427', usage: 'Main page background, card backgrounds' },
    { name: 'Foreground', value: '#f4f4f5', usage: 'Primary text color, headings' },
    { name: 'Muted', value: '#36363b', usage: 'Secondary backgrounds, subtle sections' },
    { name: 'Muted Foreground', value: '#a1a1aa', usage: 'Secondary text, placeholders, captions' },
    { name: 'Border', value: '#52525b', usage: 'Dividers, input borders, card outlines' },
    { name: 'Primary', value: '#d946ef', usage: 'Main brand color, primary buttons, links' },
    { name: 'Secondary', value: '#f471b5', usage: 'Secondary buttons, highlights, badges' },
    { name: 'Accent', value: '#67e8f9', usage: 'Success states, positive actions, progress' },
    { name: 'Destructive', value: '#f87171', usage: 'Error states, delete actions, warnings' },
    { name: 'Ring', value: '#d946ef', usage: 'Focus indicators, selection outlines' },
  ]
};

const ThemeSwatches = ({ theme }: { theme: 'light' | 'dark' }) => {
  const colors = themeColors[theme];
  const themeClass = theme === 'dark' ? 'dark' : '';
  
  return (
    <div className={`${themeClass} p-8 bg-background text-foreground`}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">
            {theme === 'light' ? '☀️' : '🌙'} {theme.charAt(0).toUpperCase() + theme.slice(1)} Theme Colors
          </h1>
        </div>

        {/* Color Swatches */}
        <div className="grid gap-6 md:grid-cols-2">
          {colors.map((color) => (
            <div
              key={color.name}
              className="border border-border rounded-lg p-6 bg-muted/50"
            >
              <div className="flex items-start gap-4">
                {/* Color Swatch */}
                <div
                  className="w-16 h-16 rounded-lg border border-border flex-shrink-0"
                  style={{ backgroundColor: color.value }}
                />
                
                {/* Color Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">
                    {color.name}
                  </h3>
                  <p className="text-sm font-mono text-muted-foreground mb-3">
                    {color.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {color.usage}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Usage Examples */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Examples</h2>
          <div className="flex flex-wrap gap-3">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium">
              Primary Button
            </span>
            <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded text-sm font-medium">
              Secondary Badge
            </span>
            <span className="bg-accent text-accent-foreground px-3 py-1 rounded text-sm font-medium">
              Accent Highlight
            </span>
            <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded text-sm font-medium">
              Error State
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export const LightTheme: Story = {
  render: () => <ThemeSwatches theme="light" />,
  name: 'Light Theme',
  parameters: {
    layout: 'fullscreen',
  },
};

export const DarkTheme: Story = {
  render: () => <ThemeSwatches theme="dark" />,
  name: 'Dark Theme', 
  parameters: {
    layout: 'fullscreen',
  },
};

export const SideBySide: Story = {
  render: () => (
    <div className="grid lg:grid-cols-2 min-h-screen">
      <ThemeSwatches theme="light" />
      <ThemeSwatches theme="dark" />
    </div>
  ),
  name: 'Side by Side Comparison',
  parameters: {
    layout: 'fullscreen',
  },
}; 