import type { Meta, StoryObj } from '@storybook/nextjs'
import Navigation, { NavigationItem } from '../../app/components/Navigation'
import { 
  BriefcaseIcon, 
  QuestionMarkCircleIcon, 
  ChartBarSquareIcon, 
  PencilSquareIcon,
  HomeIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const meta: Meta<typeof Navigation> = {
  title: 'Organisms/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A self-contained navigation component that displays a fixed bottom navigation bar with all navigation items and handlers built-in.'
      }
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
          This is the main page content. The navigation will appear at the bottom with all items and functionality built-in.
        </p>
      </div>
      {/* Navigation component is now self-contained */}
      <Navigation />
    </div>
  )
}

export const WithPageContent: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Interactive Navigation</h1>
        <p className="text-foreground/80 mb-4">
          The navigation component includes all navigation items with built-in routing functionality.
        </p>
        <p className="text-foreground/80 mb-4">
          Click any navigation item to see the routing in action. The component handles:
        </p>
        <ul className="list-disc list-inside text-foreground/80 space-y-2">
          <li>Selected works navigation</li>
          <li>Work history navigation</li>
          <li>About page navigation</li>
          <li>Stats page navigation</li>
          <li>Guestbook navigation</li>
          <li>Site settings navigation</li>
        </ul>
      </div>
      <Navigation />
    </div>
  )
}

export const StandaloneNavigationItems: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Standalone Navigation Items</h1>
        <p className="text-foreground/80 mb-8">
          Individual NavigationItem components for demonstration purposes.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <NavigationItem 
            icon={<BriefcaseIcon className="w-5 h-5" />}
            label="Work history"
            onClick={() => console.log('Work history clicked')}
          />
          <NavigationItem 
            icon={<QuestionMarkCircleIcon className="w-5 h-5" />}
            label="About David"
            onClick={() => console.log('About clicked')}
          />
          <NavigationItem 
            icon={<ChartBarSquareIcon className="w-5 h-5" />}
            label="Stats"
            onClick={() => console.log('Stats clicked')}
          />
          <NavigationItem 
            icon={<PencilSquareIcon className="w-5 h-5" />}
            label="Guestbook"
            onClick={() => console.log('Guestbook clicked')}
          />
          <NavigationItem 
            icon={<CogIcon className="w-5 h-5" />}
            label="Settings"
            onClick={() => console.log('Settings clicked')}
          />
          <NavigationItem 
            icon={<HomeIcon className="w-5 h-5" />}
            label="Home"
            onClick={() => console.log('Home clicked')}
          />
        </div>
      </div>
      
      {/* Full navigation at bottom */}
      <Navigation />
    </div>
  )
}

export const ResponsiveDemo: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Responsive Navigation</h1>
        <p className="text-foreground/80 mb-4">
          The navigation component is fully responsive:
        </p>
        <ul className="list-disc list-inside text-foreground/80 space-y-2 mb-8">
          <li><strong>Desktop (xl+):</strong> Shows all navigation items in a horizontal bar</li>
          <li><strong>Mobile (lg and below):</strong> Shows a hamburger menu that opens a drawer</li>
          <li><strong>ViewportDebug:</strong> Always visible to show current breakpoint</li>
        </ul>
        <p className="text-foreground/80">
          Resize your browser window to see the responsive behavior in action.
        </p>
      </div>
      <Navigation />
    </div>
  )
}