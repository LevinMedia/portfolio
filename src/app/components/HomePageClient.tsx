'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Drawer from './Drawer'
import WorkHistoryContent from './WorkHistoryContent'
import AboutContent from './AboutContent'
import SelectedWorksContent from './SelectedWorksContent'
import FieldNotesContent from './FieldNotesContent'
import SiteSettingsContent from './SiteSettingsContent'
import StatsContent from './StatsContent'
import Guestbook from './Guestbook'
import C64AuthenticHomeScreen, {
  type C64AuthenticHomeScreenHandle,
} from './C64AuthenticHomeScreen'
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

export default function HomePageClient({
  initialSelectedWorks,
}: HomePageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const c64Ref = useRef<C64AuthenticHomeScreenHandle>(null)
  const [isWorkHistoryOpen, setIsWorkHistoryOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isSelectedWorksOpen, setIsSelectedWorksOpen] = useState(false)
  const [isFieldNotesOpen, setIsFieldNotesOpen] = useState(false)
  const [isSiteSettingsOpen, setIsSiteSettingsOpen] = useState(false)
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)

  const pageTitle = isWorkHistoryOpen ? 'Work History'
    : isAboutOpen ? 'About'
    : isSelectedWorksOpen ? 'Featured Work'
    : isFieldNotesOpen ? 'Field Notes'
    : isSiteSettingsOpen ? 'Site Settings'
    : isGuestbookOpen ? 'Guestbook'
    : isStatsOpen ? 'Stats'
    : null

  usePageTitle(pageTitle)

  /** While closing, URL can still show the drawer param briefly — don't snap the drawer back open. */
  const closingDrawerParamsRef = useRef(new Set<string>())

  const syncDrawerFromUrl = (
    paramKey: string,
    setOpen: (open: boolean) => void,
  ) => {
    const urlOpen = searchParams.get(paramKey) === 'true'
    if (closingDrawerParamsRef.current.has(paramKey)) {
      if (!urlOpen) {
        closingDrawerParamsRef.current.delete(paramKey)
        setOpen(false)
      }
      return
    }
    setOpen(urlOpen)
  }

  useEffect(() => {
    syncDrawerFromUrl('work-history', setIsWorkHistoryOpen)
    syncDrawerFromUrl('about', setIsAboutOpen)
    syncDrawerFromUrl('selected-works', setIsSelectedWorksOpen)
    syncDrawerFromUrl('field-notes', setIsFieldNotesOpen)
    syncDrawerFromUrl('guestbook', setIsGuestbookOpen)
    syncDrawerFromUrl('stats', setIsStatsOpen)
    syncDrawerFromUrl('site-settings', setIsSiteSettingsOpen)
  }, [searchParams])

  const openDrawerByParam = (paramKey: string, setOpen: (open: boolean) => void) => {
    closingDrawerParamsRef.current.delete(paramKey)
    setOpen(true)
    router.push(`?${paramKey}=true`, { scroll: false })
  }

  const closeSiteDrawer = (setOpen: (open: boolean) => void, paramKey: string) => {
    closingDrawerParamsRef.current.add(paramKey)
    setOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete(paramKey)
    router.push(params.toString() ? `?${params.toString()}` : '/', { scroll: false })
  }

  const handleWorkHistoryClose = () => {
    closeSiteDrawer(setIsWorkHistoryOpen, 'work-history')
  }

  const handleAboutClose = () => {
    closeSiteDrawer(setIsAboutOpen, 'about')
  }

  const handleSiteSettingsClose = () => {
    closeSiteDrawer(setIsSiteSettingsOpen, 'site-settings')
  }

  const handleSelectedWorksClose = () => {
    closeSiteDrawer(setIsSelectedWorksOpen, 'selected-works')
  }

  const handleFieldNotesClose = () => {
    closeSiteDrawer(setIsFieldNotesOpen, 'field-notes')
  }

  const handleGuestbookClose = () => {
    closeSiteDrawer(setIsGuestbookOpen, 'guestbook')
  }

  const handleStatsClose = () => {
    closeSiteDrawer(setIsStatsOpen, 'stats')
  }

  const siteDrawerOpen =
    isWorkHistoryOpen ||
    isAboutOpen ||
    isSelectedWorksOpen ||
    isFieldNotesOpen ||
    isSiteSettingsOpen ||
    isGuestbookOpen ||
    isStatsOpen

  const openSection = (key: string) => {
    switch (key) {
      case 'about':
        openDrawerByParam('about', setIsAboutOpen)
        break
      case 'work-history':
        openDrawerByParam('work-history', setIsWorkHistoryOpen)
        break
      case 'selected-works':
        openDrawerByParam('selected-works', setIsSelectedWorksOpen)
        break
      case 'field-notes':
        openDrawerByParam('field-notes', setIsFieldNotesOpen)
        break
      case 'stats':
        openDrawerByParam('stats', setIsStatsOpen)
        break
      case 'guestbook':
        openDrawerByParam('guestbook', setIsGuestbookOpen)
        break
      case 'site-settings':
        openDrawerByParam('site-settings', setIsSiteSettingsOpen)
        break
      default:
        router.push(`?${key}=true`, { scroll: false })
    }
  }

  return (
    <div className="relative flex w-full min-w-0 min-h-0 flex-col c64-authentic-shell">
      <div
        className="absolute inset-0 z-[1] pointer-events-none c64-screen-grid opacity-25"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <C64AuthenticHomeScreen
          ref={c64Ref}
          siteDrawerOpen={siteDrawerOpen}
          onOpenAbout={() => openSection('about')}
          onOpenWorkHistory={() => openSection('work-history')}
          onOpenSelectedWorks={() => openSection('selected-works')}
          onOpenFieldNotes={() => openSection('field-notes')}
          onOpenStats={() => openSection('stats')}
          onOpenGuestbook={() => openSection('guestbook')}
          onOpenSiteSettings={() => openSection('site-settings')}
        />

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

        <Drawer
          isOpen={isAboutOpen}
          onClose={handleAboutClose}
          title="About"
          icon={<QuestionMarkCircleIcon className="w-6 h-6" />}
        >
          <AboutContent />
        </Drawer>

        <Drawer
          isOpen={isSelectedWorksOpen}
          onClose={handleSelectedWorksClose}
          title="Featured work"
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
