import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import Tooltip from '../../app/components/Tooltip'
import Button from '../../app/components/Button'
import Navigation, { NavigationItem } from '../../app/components/Navigation'
import { CommandLineIcon, HeartIcon, StarIcon, BriefcaseIcon, QuestionMarkCircleIcon, ChartBarSquareIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

// Custom code generator for NavigationItem
function getNavigationItemCode(props: Record<string, unknown>) {
  const propOrder = [
    'icon', 'label', 'href', 'onClick'
  ];
  const entries = Object.entries(props)
    .filter(([key, value]) =>
      value !== undefined &&
      key !== 'children' &&
      key !== 'ref' &&
      key !== 'forwardedAs' &&
      typeof value !== 'function'
    )
    .sort(([a], [b]) => propOrder.indexOf(a) - propOrder.indexOf(b));
  const propString = entries
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      } else if (typeof value === 'boolean') {
        return value ? key : '';
      } else if (React.isValidElement(value)) {
        return `${key}={<... />}`;
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
  return `<NavigationItem${propString ? ' ' + propString : ''}>`;
}

const meta: Meta<typeof Tooltip> = {
  title: 'Atoms/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A generic tooltip component that can wrap any component and show animated code or text tooltips on hover.'
      }
    }
  },
  argTypes: {
    children: {
      control: false,
      description: 'The component to wrap with tooltip functionality'
    },
    codeGenerator: {
      control: false,
      description: 'Custom function to generate code from component props'
    },
    borderRadius: {
      control: { type: 'number', min: 0, max: 20 },
      description: 'Border radius for the animated border'
    },
    showBorder: {
      control: { type: 'boolean' },
      description: 'Whether to show the animated border on hover'
    },
    borderColor: {
      control: { type: 'text' },
      description: 'Tailwind CSS class for border color (e.g., stroke-primary, stroke-red-500)'
    },
    tooltipContent: {
      control: { type: 'text' },
      description: 'Custom tooltip content (overrides code generation)'
    },
    tooltipType: {
      control: { type: 'select' },
      options: ['code', 'text'],
      description: 'Type of tooltip content to display'
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="space-y-4">
      <Tooltip 
        borderColor="stroke-primary"
        borderRadius={6}
        showBorder={true}
        tooltipType="code"
      >
        <Button style="solid" color="primary" size="medium">
          Hover me
        </Button>
      </Tooltip>
    </div>
  )
}

export const WithCustomCodeGenerator: Story = {
  render: () => {
    const customCodeGenerator = (props: Record<string, unknown>) => {
      return `<CustomButton style="${props.style}" color="${props.color}" />`
    }

    return (
      <div className="space-y-4">
        <Tooltip codeGenerator={customCodeGenerator}>
          <Button style="outline" color="secondary" size="large">
            Custom Code
          </Button>
        </Tooltip>
      </div>
    )
  }
}

export const TextTooltip: Story = {
  render: () => (
    <div className="space-y-4">
      <Tooltip tooltipType="text" tooltipContent="This is a custom text tooltip!">
        <Button style="ghost" color="accent" size="medium">
          Text Tooltip
        </Button>
      </Tooltip>
    </div>
  )
}

export const NoBorder: Story = {
  render: () => (
    <div className="space-y-4">
      <Tooltip showBorder={false}>
        <Button style="solid" color="destructive" size="medium">
          No Border
        </Button>
      </Tooltip>
    </div>
  )
}

export const CustomBorderRadius: Story = {
  render: () => (
    <div className="space-y-4">
      <Tooltip borderRadius={12}>
        <Button style="outline" color="primary" size="medium">
          Rounded Border
        </Button>
      </Tooltip>
    </div>
  )
}

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <Tooltip>
        <Button 
          style="solid" 
          color="primary" 
          size="medium"
          iconLeft={<CommandLineIcon className="w-5 h-5" />}
        >
          With Icon
        </Button>
      </Tooltip>
    </div>
  )
}

export const MultipleComponents: Story = {
  render: () => (
    <div className="space-y-4 flex gap-4">
      <Tooltip>
        <Button style="solid" color="primary" size="medium">
          Button 1
        </Button>
      </Tooltip>
      
      <Tooltip tooltipType="text" tooltipContent="Heart this!">
        <Button 
          style="ghost" 
          color="destructive" 
          size="medium"
          iconLeft={<HeartIcon className="w-5 h-5" />}
        >
          Like
        </Button>
      </Tooltip>
      
      <Tooltip>
        <Button 
          style="outline" 
          color="accent" 
          size="medium"
          iconLeft={<StarIcon className="w-5 h-5" />}
        >
          Star
        </Button>
      </Tooltip>
    </div>
  )
}

export const DisabledButton: Story = {
  render: () => (
    <div className="space-y-4">
      <Tooltip>
        <Button style="solid" color="primary" size="medium" disabled>
          Disabled Button
        </Button>
      </Tooltip>
    </div>
  )
}

export const LargeButton: Story = {
  render: () => (
    <div className="space-y-4">
      <Tooltip>
        <Button style="solid" color="primary" size="large">
          Large Button
        </Button>
      </Tooltip>
    </div>
  )
}

export const CustomBorderColors: Story = {
  render: () => (
    <div className="space-y-4 flex gap-4">
      <Tooltip borderColor="stroke-primary">
        <Button style="solid" color="primary" size="medium">
          Primary Border
        </Button>
      </Tooltip>
      
      <Tooltip borderColor="stroke-secondary">
        <Button style="outline" color="secondary" size="medium">
          Secondary Border
        </Button>
      </Tooltip>
      
      <Tooltip borderColor="stroke-accent">
        <Button style="ghost" color="accent" size="medium">
          Accent Border
        </Button>
      </Tooltip>
      
      <Tooltip borderColor="stroke-destructive">
        <Button style="solid" color="destructive" size="medium">
          Destructive Border
        </Button>
      </Tooltip>
    </div>
  )
}

export const CustomTailwindColors: Story = {
  render: () => (
    <div className="space-y-4 flex gap-4">
      <Tooltip borderColor="stroke-blue-500">
        <Button style="solid" color="primary" size="medium">
          Blue Border
        </Button>
      </Tooltip>
      
      <Tooltip borderColor="stroke-green-500">
        <Button style="outline" color="secondary" size="medium">
          Green Border
        </Button>
      </Tooltip>
      
      <Tooltip borderColor="stroke-purple-500">
        <Button style="ghost" color="accent" size="medium">
          Purple Border
        </Button>
      </Tooltip>
      
      <Tooltip borderColor="stroke-orange-500">
        <Button style="solid" color="destructive" size="medium">
          Orange Border
        </Button>
      </Tooltip>
    </div>
  )
}

export const AllPropsExample: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">All Tooltip Props</h3>
        <div className="space-y-4">
          <Tooltip 
            borderColor="stroke-primary"
            borderRadius={8}
            showBorder={true}
            tooltipType="code"
            tooltipContent="Custom tooltip content"
          >
            <Button style="solid" color="primary" size="medium">
              All Props Set
            </Button>
          </Tooltip>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Minimal Props (Defaults)</h3>
        <div className="space-y-4">
          <Tooltip>
            <Button style="outline" color="secondary" size="medium">
              Default Props
            </Button>
          </Tooltip>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Text Tooltip</h3>
        <div className="space-y-4">
          <Tooltip 
            tooltipType="text"
            tooltipContent="This is a custom text tooltip!"
            borderColor="stroke-accent"
            showBorder={true}
          >
            <Button style="ghost" color="accent" size="medium">
              Text Tooltip
            </Button>
          </Tooltip>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">No Border</h3>
        <div className="space-y-4">
          <Tooltip 
            showBorder={false}
            tooltipType="code"
          >
            <Button style="solid" color="destructive" size="medium">
              No Border
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export const WithNavigation: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Navigation with Tooltips</h1>
        <p className="text-foreground/80 mb-8">
          Each NavigationItem is wrapped with a Tooltip to show its code structure.
        </p>
      </div>
      
      <Navigation>
        <Tooltip codeGenerator={getNavigationItemCode}>
          <NavigationItem 
            icon={<BriefcaseIcon className="w-5 h-5" />}
            label="Work history"
            href="/work-history"
          />
        </Tooltip>
        
        <Tooltip codeGenerator={getNavigationItemCode}>
          <NavigationItem 
            icon={<QuestionMarkCircleIcon className="w-5 h-5" />}
            label="About David"
          />
        </Tooltip>
        
        <Tooltip codeGenerator={getNavigationItemCode}>
          <NavigationItem 
            icon={<ChartBarSquareIcon className="w-5 h-5" />}
            label="Stats"
          />
        </Tooltip>
        
        <Tooltip codeGenerator={getNavigationItemCode}>
          <NavigationItem 
            icon={<PencilSquareIcon className="w-5 h-5" />}
            label="Sign the guest book"
          />
        </Tooltip>
      </Navigation>
    </div>
  ),
  parameters: {
    layout: 'fullscreen'
  }
}

export const NavigationWithCustomTooltips: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Navigation with Custom Tooltips</h1>
        <p className="text-foreground/80 mb-8">
          NavigationItems with custom tooltip content and different configurations.
        </p>
      </div>
      
      <Navigation>
        <Tooltip tooltipType="text" tooltipContent="View your professional experience">
          <NavigationItem 
            icon={<BriefcaseIcon className="w-5 h-5" />}
            label="Work history"
            href="/work-history"
          />
        </Tooltip>
        
        <Tooltip tooltipType="text" tooltipContent="Learn more about David">
          <NavigationItem 
            icon={<QuestionMarkCircleIcon className="w-5 h-5" />}
            label="About David"
          />
        </Tooltip>
        
        <Tooltip showBorder={false} codeGenerator={getNavigationItemCode}>
          <NavigationItem 
            icon={<ChartBarSquareIcon className="w-5 h-5" />}
            label="Stats"
          />
        </Tooltip>
        
        <Tooltip borderRadius={8} codeGenerator={getNavigationItemCode}>
          <NavigationItem 
            icon={<PencilSquareIcon className="w-5 h-5" />}
            label="Sign the guest book"
          />
        </Tooltip>
      </Navigation>
    </div>
  ),
  parameters: {
    layout: 'fullscreen'
  }
}

export const NavigationItemStandalone: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">NavigationItem with Tooltip</h1>
      <p className="text-foreground/80 mb-8">
        Individual NavigationItem components wrapped with Tooltip.
      </p>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Default Tooltip:</h2>
          <Tooltip codeGenerator={getNavigationItemCode}>
            <NavigationItem 
              icon={<BriefcaseIcon className="w-5 h-5" />}
              label="Work history"
              href="/work-history"
            />
          </Tooltip>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Text Tooltip:</h2>
          <Tooltip tooltipType="text" tooltipContent="Navigate to work history page">
            <NavigationItem 
              icon={<QuestionMarkCircleIcon className="w-5 h-5" />}
              label="About David"
            />
          </Tooltip>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">No Border:</h2>
          <Tooltip showBorder={false} codeGenerator={getNavigationItemCode}>
            <NavigationItem 
              icon={<ChartBarSquareIcon className="w-5 h-5" />}
              label="Stats"
            />
          </Tooltip>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Custom Border Radius:</h2>
          <Tooltip borderRadius={12} codeGenerator={getNavigationItemCode}>
            <NavigationItem 
              icon={<PencilSquareIcon className="w-5 h-5" />}
              label="Sign the guest book"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

// Custom code generator for Navigation
function getNavigationCode() {
  // Navigation component currently only takes children, so no props to display
  return `<Navigation>`;
}

export const WithNavigationWrapper: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Navigation Component with Tooltip</h1>
        <p className="text-foreground/80 mb-8">
          The entire Navigation component is wrapped with a Tooltip. Hover over the navigation bar to see the tooltip.
        </p>
      </div>
      
      <Tooltip codeGenerator={getNavigationCode}>
        <Navigation>
          <NavigationItem 
            icon={<BriefcaseIcon className="w-5 h-5" />}
            label="Work history"
            href="/work-history"
          />
          <NavigationItem 
            icon={<QuestionMarkCircleIcon className="w-5 h-5" />}
            label="About David"
          />
          <NavigationItem 
            icon={<ChartBarSquareIcon className="w-5 h-5" />}
            label="Stats"
          />
          <NavigationItem 
            icon={<PencilSquareIcon className="w-5 h-5" />}
            label="Sign the guest book"
          />
        </Navigation>
      </Tooltip>
    </div>
  ),
  parameters: {
    layout: 'fullscreen'
  }
} 