import type { Meta, StoryObj } from '@storybook/react'
import Navigation, { NavigationItem } from '../../app/components/Navigation'
import { 
  BriefcaseIcon, 
  QuestionMarkCircleIcon, 
  ChartBarSquareIcon, 
  PencilSquareIcon,
  HomeIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const meta: Meta<typeof Navigation> = {
  title: 'Organisms/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A navigation component that displays a fixed bottom navigation bar with navigation items as ghost buttons.'
      }
    }
  },
  argTypes: {
    children: {
      control: false,
      description: 'NavigationItem components to render'
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Page Content</h1>
        <p className="text-foreground/80">
          This is the main page content. The navigation will appear at the bottom.
        </p>
      </div>
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
    </div>
  )
}

export const WithOnClickHandlers: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Interactive Navigation</h1>
        <p className="text-foreground/80">
          Navigation items with onClick handlers that log to console.
        </p>
      </div>
      <Navigation>
        <NavigationItem 
          icon={<HomeIcon className="w-5 h-5" />}
          label="Home"
          onClick={() => console.log('Home clicked')}
        />
        <NavigationItem 
          icon={<UserIcon className="w-5 h-5" />}
          label="Profile"
          onClick={() => console.log('Profile clicked')}
        />
        <NavigationItem 
          icon={<CogIcon className="w-5 h-5" />}
          label="Settings"
          onClick={() => console.log('Settings clicked')}
        />
      </Navigation>
    </div>
  )
}

export const SingleItem: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Single Navigation Item</h1>
        <p className="text-foreground/80">
          Navigation with just one item.
        </p>
      </div>
      <Navigation>
        <NavigationItem 
          icon={<BriefcaseIcon className="w-5 h-5" />}
          label="Work history"
          href="/work-history"
        />
      </Navigation>
    </div>
  )
}

export const ManyItems: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Many Navigation Items</h1>
        <p className="text-foreground/80">
          Navigation with many items that will wrap to multiple lines.
        </p>
      </div>
      <Navigation>
        <NavigationItem 
          icon={<HomeIcon className="w-5 h-5" />}
          label="Home"
        />
        <NavigationItem 
          icon={<BriefcaseIcon className="w-5 h-5" />}
          label="Work history"
        />
        <NavigationItem 
          icon={<UserIcon className="w-5 h-5" />}
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
        <NavigationItem 
          icon={<CogIcon className="w-5 h-5" />}
          label="Settings"
        />
        <NavigationItem 
          icon={<QuestionMarkCircleIcon className="w-5 h-5" />}
          label="Help"
        />
      </Navigation>
    </div>
  )
}

export const NavigationItemStandalone: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">NavigationItem Component</h1>
      <p className="text-foreground/80 mb-8">
        Individual NavigationItem components can be used standalone.
      </p>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">With href:</h2>
          <NavigationItem 
            icon={<BriefcaseIcon className="w-5 h-5" />}
            label="Work history"
            href="/work-history"
          />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">With onClick:</h2>
          <NavigationItem 
            icon={<QuestionMarkCircleIcon className="w-5 h-5" />}
            label="About David"
            onClick={() => alert('About David clicked!')}
          />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">No action:</h2>
          <NavigationItem 
            icon={<ChartBarSquareIcon className="w-5 h-5" />}
            label="Stats"
          />
        </div>
      </div>
    </div>
  )
} 