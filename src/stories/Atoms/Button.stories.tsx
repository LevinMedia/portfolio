import type { Meta, StoryObj } from '@storybook/nextjs'
import Button from '../../app/components/Button'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible button component built on Headless UI with separate style and color props.'
      }
    }
  },
  argTypes: {
    style: {
      control: { type: 'select' },
      options: ['solid', 'outline', 'ghost'],
      description: 'The visual treatment of the button'
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'accent', 'destructive'],
      description: 'The semantic color of the button'
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'The size of the button'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled'
    },
    children: {
      control: 'text',
      description: 'The content of the button'
    },
    onClick: {
      action: 'clicked'
    }
  },
  args: {
    style: 'solid',
    color: 'primary',
    size: 'medium',
    disabled: false,
    children: 'Button'
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const ColorMatrix: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Solid Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <Button style="solid" color="primary">Primary</Button>
          <Button style="solid" color="secondary">Secondary</Button>
          <Button style="solid" color="accent">Accent</Button>
          <Button style="solid" color="destructive">Destructive</Button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Outline Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <Button style="outline" color="primary">Primary</Button>
          <Button style="outline" color="secondary">Secondary</Button>
          <Button style="outline" color="accent">Accent</Button>
          <Button style="outline" color="destructive">Destructive</Button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Ghost Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <Button style="ghost" color="primary">Primary</Button>
          <Button style="ghost" color="secondary">Secondary</Button>
          <Button style="ghost" color="accent">Accent</Button>
          <Button style="ghost" color="destructive">Destructive</Button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Sizes</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual reference for all color, style, and size combinations.'
      }
    }
  }
} 