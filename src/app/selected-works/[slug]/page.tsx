'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import SelectedWorkDetail from '@/app/components/SelectedWorkDetail'
import Drawer from '@/app/components/Drawer'
import Navigation, { NavigationItem } from '@/app/components/Navigation'
import Tooltip from '@/app/components/Tooltip'
import LevinMediaLogo from '@/app/components/LevinMediaLogo'
import { CommandLineIcon, BriefcaseIcon, QuestionMarkCircleIcon, ChartBarSquareIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

export default function SelectedWorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [workTitle, setWorkTitle] = useState<string>('')
  const [isTitleVisible, setIsTitleVisible] = useState(true)

  const handleClose = () => {
    router.push('/?selected-works=true')
  }

  // Navigation handlers
  const handleWorkHistoryOpen = () => {
    router.push('/?work-history=true')
  }

  const handleAboutOpen = () => {
    router.push('/?about=true')
  }

  const handleGuestbookOpen = () => {
    router.push('/?guestbook=true')
  }

  return (
    <div className="relative min-h-screen">
      <Drawer
        isOpen={true}
        onClose={handleClose}
        title={
          <>
            {/* Desktop: "Selected works / Title" pattern */}
            <span className="hidden md:inline">
              <span className="text-muted-foreground">Selected works</span>
              {workTitle && (
                <span 
                  className="transition-opacity duration-300 ease-in-out"
                  style={{ 
                    opacity: isTitleVisible ? 0 : 1,
                    display: 'inline'
                  }}
                >
                  <span className="mx-2 text-muted-foreground">/</span>
                  <span>{workTitle}</span>
                </span>
              )}
            </span>
            
            {/* Mobile: Replace "Selected works" with title when scrolled */}
            <span className="md:hidden">
              {!isTitleVisible && workTitle ? (
                <span className="transition-opacity duration-300 ease-in-out">
                  {workTitle}
                </span>
              ) : (
                <span className="text-muted-foreground transition-opacity duration-300 ease-in-out">
                  Selected works
                </span>
              )}
            </span>
          </>
        }
        icon={<CommandLineIcon className="w-6 h-6" />}
        contentPadding="p-0"
        maxWidth=""
      >
        <div className="px-4 pb-4">
          <SelectedWorkDetail 
            slug={slug} 
            onTitleLoad={setWorkTitle}
            onTitleVisibilityChange={setIsTitleVisible}
          />
        </div>
      </Drawer>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] z-50">
        <Tooltip 
          codeGenerator={() => {
            return `<Navigation>
  <LevinMediaLogo size={32} onClick={() => window.location.href = '/'} />
  <NavigationItem icon={<BriefcaseIcon />} label="Work history" onClick={handleWorkHistoryOpen} />
  <NavigationItem icon={<QuestionMarkCircleIcon />} label="About" onClick={handleAboutOpen} />
  <NavigationItem icon={<ChartBarSquareIcon />} label="Stats" />
  <NavigationItem icon={<PencilSquareIcon />} label="Guestbook" onClick={handleGuestbookOpen} />
</Navigation>`
          }} 
          borderRadius={0}
          showBorder={true}
          borderColor="stroke-accent"
          fullWidth={true}
        >
          <Navigation>
            <LevinMediaLogo size={32} onClick={() => router.push('/')} />
            <NavigationItem 
              icon={<BriefcaseIcon className="w-5 h-5" />}
              label="Work history"
              onClick={handleWorkHistoryOpen}
            />
            <NavigationItem 
              icon={<QuestionMarkCircleIcon className="w-5 h-5" />}
              label="About"
              onClick={handleAboutOpen}
            />
            <NavigationItem 
              icon={<ChartBarSquareIcon className="w-5 h-5" />}
              label="Stats"
            />
            <NavigationItem 
              icon={<PencilSquareIcon className="w-5 h-5" />}
              label="Guestbook"
              onClick={handleGuestbookOpen}
            />
          </Navigation>
        </Tooltip>
      </div>
    </div>
  )
}

