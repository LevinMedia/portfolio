'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from './Button'
import Drawer from './Drawer'
import ViewportDebug from './ViewportDebug'
import LevinMediaLogo from './LevinMediaLogo'
import Tooltip from './Tooltip'
import { 
  Bars3Icon,
  CommandLineIcon, 
  BriefcaseIcon, 
  QuestionMarkCircleIcon, 
  ChartBarSquareIcon, 
  PencilSquareIcon, 
  CogIcon 
} from "@heroicons/react/24/outline"

interface NavigationItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

export function NavigationItem({ icon, label, onClick }: NavigationItemProps) {
  return (
    <Button
      style="ghost"
      color="primary"
      size="small"
      iconLeft={icon}
      onClick={onClick}
      className="flex-shrink-0"
    >
      {label}
    </Button>
  )
}

export default function Navigation() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // All navigation handlers
  const handleLogoClick = () => {
    router.push('/')
  }

  const handleSelectedWorksOpen = () => {
    router.push('/?selected-works=true')
  }

  const handleWorkHistoryOpen = () => {
    router.push('/?work-history=true')
  }

  const handleAboutOpen = () => {
    router.push('/?about=true')
  }

  const handleStatsOpen = () => {
    router.push('/?stats=true')
  }

  const handleGuestbookOpen = () => {
    router.push('/?guestbook=true')
  }

  const handleSiteSettingsOpen = () => {
    router.push('/?site-settings=true')
  }

  const handleMobileMenuOpen = () => {
    setIsMobileMenuOpen(true)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  // Navigation items array
  const navigationItems = [
    {
      icon: <CommandLineIcon className="w-5 h-5" />,
      label: "Selected works",
      onClick: handleSelectedWorksOpen
    },
    {
      icon: <BriefcaseIcon className="w-5 h-5" />,
      label: "Work history", 
      onClick: handleWorkHistoryOpen
    },
    {
      icon: <QuestionMarkCircleIcon className="w-5 h-5" />,
      label: "About",
      onClick: handleAboutOpen
    },
    {
      icon: <ChartBarSquareIcon className="w-5 h-5" />,
      label: "Stats",
      onClick: handleStatsOpen
    },
    {
      icon: <PencilSquareIcon className="w-5 h-5" />,
      label: "Guestbook",
      onClick: handleGuestbookOpen
    },
    {
      icon: <CogIcon className="w-5 h-5" />,
      label: "Site settings",
      onClick: handleSiteSettingsOpen
    }
  ]

  // Mobile navigation items with menu close
  const mobileNavigationItems = navigationItems.map(item => ({
    ...item,
    onClick: () => {
      setIsMobileMenuOpen(false)
      item.onClick()
    }
  }))

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] z-50">
      <Tooltip 
        codeGenerator={() => {
          return `<Navigation>
  <LevinMediaLogo size={32} onClick={() => window.location.href = '/'} />
  <NavigationItem icon={<CommandLineIcon />} label="Selected works" onClick={handleSelectedWorksOpen} />
  <NavigationItem icon={<BriefcaseIcon />} label="Work history" onClick={handleWorkHistoryOpen} />
  <NavigationItem icon={<QuestionMarkCircleIcon />} label="About" onClick={handleAboutOpen} />
  <NavigationItem icon={<ChartBarSquareIcon />} label="Stats" onClick={handleStatsOpen} />
  <NavigationItem icon={<PencilSquareIcon />} label="Guestbook" onClick={handleGuestbookOpen} />
  <NavigationItem icon={<CogIcon />} label="Site settings" onClick={handleSiteSettingsOpen} />
</Navigation>`
        }} 
        borderRadius={0}
        showBorder={true}
        borderColor="stroke-accent"
        fullWidth={true}
      >
        <>
          <nav className="flex items-center justify-between bg-background border border-blue-200/15 rounded-none w-full" style={{ 
            gap: 'var(--grid-major)', 
            padding: 'var(--grid-major)', 
            height: '64px'
          }}>
            {/* Logo - always visible */}
            <LevinMediaLogo size={32} onClick={handleLogoClick} />
            
            {/* Navigation items - hidden on lg and below, visible on xl+ */}
            <div className="hidden xl:flex items-center" style={{ gap: 'var(--grid-major)' }}>
              <ViewportDebug />
              {navigationItems.map((item, index) => (
                <NavigationItem key={index} {...item} />
              ))}
            </div>
            
            {/* Mobile navigation - visible on lg and below, hidden on xl+ */}
            <div className="xl:hidden flex items-center" style={{ gap: 'var(--grid-major)' }}>
              <ViewportDebug />
              <Button
                style="ghost"
                color="primary"
                size="small"
                iconLeft={<Bars3Icon className="w-5 h-5" />}
                className="flex-shrink-0"
                onClick={handleMobileMenuOpen}
              >
                Menu
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Drawer */}
          <Drawer
            isOpen={isMobileMenuOpen}
            onClose={handleMobileMenuClose}
            title="Menu"
            icon={<Bars3Icon className="w-6 h-6" />}
            contentPadding="p-4"
          >
            <div className="space-y-4">
              {mobileNavigationItems.map((item, index) => (
                <div key={index} className="w-full">
                  <NavigationItem {...item} />
                </div>
              ))}
            </div>
          </Drawer>
        </>
      </Tooltip>
    </div>
  )
} 