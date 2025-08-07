import type { Meta, StoryObj } from '@storybook/nextjs';

const meta: Meta = {
  title: 'Foundations/Typography',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const textSizes = [
  { class: 'text-xs', size: '12px', rem: '0.75rem' },
  { class: 'text-sm', size: '14px', rem: '0.875rem' },
  { class: 'text-base', size: '16px', rem: '1rem', default: true },
  { class: 'text-lg', size: '18px', rem: '1.125rem' },
  { class: 'text-xl', size: '20px', rem: '1.25rem' },
  { class: 'text-2xl', size: '24px', rem: '1.5rem' },
  { class: 'text-3xl', size: '30px', rem: '1.875rem' },
  { class: 'text-4xl', size: '36px', rem: '2.25rem' },
  { class: 'text-5xl', size: '48px', rem: '3rem' },
  { class: 'text-6xl', size: '60px', rem: '3.75rem' },
  { class: 'text-7xl', size: '72px', rem: '4.5rem' },
  { class: 'text-8xl', size: '96px', rem: '6rem' },
  { class: 'text-9xl', size: '128px', rem: '8rem' },
];

const fontWeights = [
  { class: 'font-thin', weight: '100', name: 'Thin' },
  { class: 'font-extralight', weight: '200', name: 'Extra Light' },
  { class: 'font-light', weight: '300', name: 'Light' },
  { class: 'font-normal', weight: '400', name: 'Normal', default: true },
  { class: 'font-medium', weight: '500', name: 'Medium' },
  { class: 'font-semibold', weight: '600', name: 'Semi Bold' },
  { class: 'font-bold', weight: '700', name: 'Bold' },
  { class: 'font-extrabold', weight: '800', name: 'Extra Bold' },
  { class: 'font-black', weight: '900', name: 'Black' },
];

const lineHeights = [
  { class: 'leading-none', value: '1', name: 'None' },
  { class: 'leading-tight', value: '1.25', name: 'Tight' },
  { class: 'leading-snug', value: '1.375', name: 'Snug' },
  { class: 'leading-normal', value: '1.5', name: 'Normal', default: true },
  { class: 'leading-relaxed', value: '1.625', name: 'Relaxed' },
  { class: 'leading-loose', value: '2', name: 'Loose' },
];

const letterSpacing = [
  { class: 'tracking-tighter', value: '-0.05em', name: 'Tighter' },
  { class: 'tracking-tight', value: '-0.025em', name: 'Tight' },
  { class: 'tracking-normal', value: '0em', name: 'Normal', default: true },
  { class: 'tracking-wide', value: '0.025em', name: 'Wide' },
  { class: 'tracking-wider', value: '0.05em', name: 'Wider' },
  { class: 'tracking-widest', value: '0.1em', name: 'Widest' },
];

const TextSizeExample = ({ item }: { item: typeof textSizes[0] }) => {
  const getFontSize = (className: string) => {
    const sizeMap: Record<string, string> = {
      'text-xs': '0.75rem',
      'text-sm': '0.875rem', 
      'text-base': '1rem',
      'text-lg': '1.125rem',
      'text-xl': '1.25rem',
      'text-2xl': '1.5rem',
      'text-3xl': '1.875rem',
      'text-4xl': '2.25rem',
      'text-5xl': '3rem',
      'text-6xl': '3.75rem',
      'text-7xl': '4.5rem',
      'text-8xl': '6rem',
      'text-9xl': '8rem',
    };
    return sizeMap[className] || '1rem';
  };

  return (
    <div className="mb-6 p-6 bg-muted border border-border rounded-lg">
      <div className="flex justify-between items-baseline mb-4">
        <span className="text-sm font-mono text-muted-foreground">{item.class}</span>
        <span className="text-xs text-muted-foreground">{item.size} / {item.rem}</span>
        {item.default && <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">default</span>}
      </div>
      <div style={{ fontSize: getFontSize(item.class) }}>
        The quick brown fox jumps over the lazy dog
      </div>
    </div>
  );
};

const FontWeightExample = ({ item }: { item: typeof fontWeights[0] }) => {
  const getFontWeight = (className: string) => {
    const weightMap: Record<string, string> = {
      'font-thin': '100',
      'font-extralight': '200',
      'font-light': '300',
      'font-normal': '400',
      'font-medium': '500',
      'font-semibold': '600',
      'font-bold': '700',
      'font-extrabold': '800',
      'font-black': '900',
    };
    return weightMap[className] || '400';
  };

  return (
    <div className="mb-6 p-6 bg-muted border border-border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-mono text-muted-foreground">{item.class}</span>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground">{item.weight}</span>
          {item.default && <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">default</span>}
        </div>
      </div>
      <div className="text-xl" style={{ fontWeight: getFontWeight(item.class) }}>
        {item.name} — The quick brown fox jumps over the lazy dog
      </div>
    </div>
  );
};

const LineHeightExample = ({ item }: { item: typeof lineHeights[0] }) => {
  const getLineHeight = (className: string) => {
    const lineHeightMap: Record<string, string> = {
      'leading-none': '1',
      'leading-tight': '1.25',
      'leading-snug': '1.375',
      'leading-normal': '1.5',
      'leading-relaxed': '1.625',
      'leading-loose': '2',
    };
    return lineHeightMap[className] || '1.5';
  };

  return (
    <div className="mb-6 p-6 bg-muted border border-border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-mono text-muted-foreground">{item.class}</span>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground">{item.value}</span>
          {item.default && <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">default</span>}
        </div>
      </div>
      <div className="text-base" style={{ lineHeight: getLineHeight(item.class) }}>
        {item.name} line height. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
      </div>
    </div>
  );
};

const LetterSpacingExample = ({ item }: { item: typeof letterSpacing[0] }) => {
  const getLetterSpacing = (className: string) => {
    const spacingMap: Record<string, string> = {
      'tracking-tighter': '-0.05em',
      'tracking-tight': '-0.025em',
      'tracking-normal': '0em',
      'tracking-wide': '0.025em',
      'tracking-wider': '0.05em',
      'tracking-widest': '0.1em',
    };
    return spacingMap[className] || '0em';
  };

  return (
    <div className="mb-6 p-6 bg-muted border border-border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-mono text-muted-foreground">{item.class}</span>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground">{item.value}</span>
          {item.default && <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">default</span>}
        </div>
      </div>
      <div className="text-lg" style={{ letterSpacing: getLetterSpacing(item.class) }}>
        {item.name.toUpperCase()} LETTER SPACING
      </div>
    </div>
  );
};

export const AllTypography: Story = {
  render: () => (
    <div className="p-8 bg-background text-foreground min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Typography System</h1>
          <p className="text-muted-foreground text-lg">
            Complete Tailwind CSS typography scale with sizes, weights, and spacing options.
          </p>
        </div>

        {/* Text Sizes */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8">Text Sizes</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {textSizes.map((item) => (
              <TextSizeExample key={item.class} item={item} />
            ))}
          </div>
        </section>

        {/* Font Weights */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8">Font Weights</h2>
          <div className="space-y-6">
            {fontWeights.map((item) => (
              <FontWeightExample key={item.class} item={item} />
            ))}
          </div>
        </section>

        {/* Line Heights */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8">Line Heights</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {lineHeights.map((item) => (
              <LineHeightExample key={item.class} item={item} />
            ))}
          </div>
        </section>

        {/* Letter Spacing */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8">Letter Spacing</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {letterSpacing.map((item) => (
              <LetterSpacingExample key={item.class} item={item} />
            ))}
          </div>
        </section>

        {/* Usage Examples */}
        <section>
          <h2 className="text-2xl font-semibold mb-8">Common Combinations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 bg-muted border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-6">Headings</h3>
              <div className="space-y-4">
                <div style={{ fontSize: '2.25rem', fontWeight: '700' }}>Heading 1</div>
                <div style={{ fontSize: '1.875rem', fontWeight: '600' }}>Heading 2</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>Heading 3</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '500' }}>Heading 4</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '500' }}>Heading 5</div>
                <div style={{ fontSize: '1rem', fontWeight: '500' }}>Heading 6</div>
              </div>
            </div>

            <div className="p-8 bg-muted border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-6">Body Text</h3>
              <div className="space-y-6">
                <div style={{ fontSize: '1.125rem', lineHeight: '1.625' }}>Large body text with relaxed line height for comfortable reading.</div>
                <div style={{ fontSize: '1rem', lineHeight: '1.5' }}>Regular body text with normal line height for standard content.</div>
                <div className="text-muted-foreground" style={{ fontSize: '0.875rem', lineHeight: '1.25' }}>Small text with tight line height for captions and metadata.</div>
              </div>
            </div>

            <div className="p-8 bg-muted border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-6">UI Elements</h3>
              <div className="space-y-4">
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded border border-border hover:bg-accent" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Button Text</button>
                <div className="font-mono text-muted-foreground" style={{ fontSize: '0.75rem', letterSpacing: '0.025em' }}>CODE_SNIPPET_STYLE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', letterSpacing: '0.025em' }}>LABEL_STYLE</div>
              </div>
            </div>

            <div className="p-8 bg-muted border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-6">Display Text</h3>
              <div className="space-y-4">
                <div style={{ fontSize: '3.75rem', fontWeight: '700' }}>Hero</div>
                <div style={{ fontSize: '2.25rem', fontWeight: '600' }}>Display</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '500', letterSpacing: '-0.025em' }}>Feature</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  ),
}; 