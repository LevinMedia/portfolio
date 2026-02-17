'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Drawer from './Drawer'
import WorkHistoryContent from './WorkHistoryContent'
import AboutContent from './AboutContent'
import SelectedWorksContent from './SelectedWorksContent'
import FieldNotesContent from './FieldNotesContent'
import SiteSettingsContent from './SiteSettingsContent'
import StatsContent from './StatsContent'
import Guestbook from './Guestbook'
import Howdy from './Howdy'
import Navigation from './Navigation'
import { NAV_HEIGHT } from './layoutConstants'
import { ParticleBackground } from './ParticleBackground'
import { usePageTitle } from '../hooks/usePageTitle'
import type { SelectedWorkServer } from '@/lib/selected-works-server'

import {
  CommandLineIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ChartBarSquareIcon,
  BriefcaseIcon,
  QuestionMarkCircleIcon,
  CogIcon,
} from '@heroicons/react/24/outline'

interface HomePageClientProps {
  initialSelectedWorks: SelectedWorkServer[]
}

export default function HomePageClient({ initialSelectedWorks }: HomePageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isWorkHistoryOpen, setIsWorkHistoryOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isSelectedWorksOpen, setIsSelectedWorksOpen] = useState(false)
  const [isFieldNotesOpen, setIsFieldNotesOpen] = useState(false)
  const [isSiteSettingsOpen, setIsSiteSettingsOpen] = useState(false)
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)

  const pageTitle = isWorkHistoryOpen ? 'Work History'
    : isAboutOpen ? 'About'
    : isSelectedWorksOpen ? 'Selected Works'
    : isFieldNotesOpen ? 'Field Notes'
    : isSiteSettingsOpen ? 'Site Settings'
    : isGuestbookOpen ? 'Guestbook'
    : isStatsOpen ? 'Stats'
    : null

  usePageTitle(pageTitle)

  useEffect(() => {
    const showWorkHistory = searchParams.get('work-history') === 'true'
    const showAbout = searchParams.get('about') === 'true'
    const showSelectedWorks = searchParams.get('selected-works') === 'true'
    const showFieldNotes = searchParams.get('field-notes') === 'true'
    const showGuestbook = searchParams.get('guestbook') === 'true'
    const showStats = searchParams.get('stats') === 'true'
    const showSiteSettings = searchParams.get('site-settings') === 'true'
    setIsWorkHistoryOpen(showWorkHistory)
    setIsAboutOpen(showAbout)
    setIsSelectedWorksOpen(showSelectedWorks)
    setIsFieldNotesOpen(showFieldNotes)
    setIsGuestbookOpen(showGuestbook)
    setIsStatsOpen(showStats)
    setIsSiteSettingsOpen(showSiteSettings)
  }, [searchParams])

  const handleWorkHistoryClose = () => {
    setIsWorkHistoryOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('work-history')
    router.push(params.toString() ? `?${params.toString()}` : '/', { scroll: false })
  }

  const handleAboutClose = () => {
    setIsAboutOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('about')
    router.push(params.toString() ? `?${params.toString()}` : '/', { scroll: false })
  }

  const handleSiteSettingsClose = () => {
    setIsSiteSettingsOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('site-settings')
    router.push(params.toString() ? `?${params.toString()}` : '/', { scroll: false })
  }

  const handleSelectedWorksClose = () => {
    setIsSelectedWorksOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('selected-works')
    router.push(params.toString() ? `?${params.toString()}` : '/', { scroll: false })
  }

  const handleFieldNotesClose = () => {
    setIsFieldNotesOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('field-notes')
    router.push(params.toString() ? `?${params.toString()}` : '/', { scroll: false })
  }

  const handleGuestbookClose = () => {
    setIsGuestbookOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('guestbook')
    router.push(params.toString() ? `?${params.toString()}` : '/', { scroll: false })
  }

  const handleStatsClose = () => {
    setIsStatsOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('stats')
    router.push(params.toString() ? `?${params.toString()}` : '/', { scroll: false })
  }

  return (
    <div
      className="relative grid grid-cols-6 items-center min-h-svh overflow-hidden font-[family-name:var(--font-geist-sans)] border border-blue-200/20 mx-auto px-4 sm:px-0 max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px]"
      style={{
        gridTemplateRows: 'var(--grid-major) 1fr 0',
        gap: 'var(--grid-major)',
        paddingBottom: `${NAV_HEIGHT}px`,
      }}
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <ParticleBackground />
      </div>

      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(rgba(115, 115, 115, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.06) 1px, transparent 1px),
            repeating-linear-gradient(90deg, 
              rgba(0, 100, 255, 0.015) 0, 
              rgba(0, 100, 255, 0.015) calc((100% - 5 * var(--grid-major)) / 6), 
              transparent calc((100% - 5 * var(--grid-major)) / 6), 
              transparent calc((100% - 5 * var(--grid-major)) / 6 + var(--grid-major))
            )
          `,
          backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), 100% 100%',
          backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), 0 0',
        }}
      />

      <div className="relative z-10 col-span-6 contents">
        <Howdy
          onSelectedWorksClick={() => router.push('/?selected-works=true')}
          onSiteSettingsClick={() => setIsSiteSettingsOpen(true)}
        />
        <Navigation />

        <Drawer
          isOpen={isWorkHistoryOpen}
          onClose={handleWorkHistoryClose}
          title="Work History"
          icon={<BriefcaseIcon className="w-6 h-6" />}
          showLinkedInButton={true}
          linkedInUrl="https://www.linkedin.com/in/levinmedia/details/experience/"
        >
          <WorkHistoryContent />
        </Drawer>

        <Drawer isOpen={isAboutOpen} onClose={handleAboutClose} title="About" icon={<QuestionMarkCircleIcon className="w-6 h-6" />}>
          <AboutContent />
        </Drawer>

        <Drawer
          isOpen={isSelectedWorksOpen}
          onClose={handleSelectedWorksClose}
          title="Selected works"
          icon={<CommandLineIcon className="w-6 h-6" />}
          contentPadding="p-0"
          maxWidth=""
        >
          <SelectedWorksContent initialWorks={initialSelectedWorks} />
        </Drawer>

        <Drawer
          isOpen={isFieldNotesOpen}
          onClose={handleFieldNotesClose}
          title="Field notes"
          icon={<DocumentTextIcon className="w-6 h-6" />}
          contentPadding="p-0"
          maxWidth=""
        >
          <FieldNotesContent />
        </Drawer>

        <Drawer
          isOpen={isSiteSettingsOpen}
          onClose={handleSiteSettingsClose}
          title="Site Settings"
          icon={<CogIcon className="w-6 h-6" />}
          contentPadding="p-4"
          maxWidth="max-w-4xl"
        >
          <SiteSettingsContent />
        </Drawer>

        <Drawer
          isOpen={isGuestbookOpen}
          onClose={handleGuestbookClose}
          title="Guestbook"
          icon={<PencilSquareIcon className="w-6 h-6" />}
          contentPadding="p-4"
          maxWidth="max-w-4xl"
        >
          <Guestbook />
        </Drawer>

        <Drawer
          isOpen={isStatsOpen}
          onClose={handleStatsClose}
          title="Site Statistics"
          icon={<ChartBarSquareIcon className="w-6 h-6" />}
          contentPadding="p-4"
          maxWidth="max-w-6xl"
        >
          <StatsContent />
        </Drawer>
      </div>
    </div>
  )
}
