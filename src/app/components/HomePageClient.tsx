'use client'

import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation'
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
import { defaultC64Settings, loadC64Settings } from '@/lib/c64-settings'

interface HomePageClientProps {
  initialSelectedWorks: SelectedWorkServer[]
}

function isDrawerOpenFromUrl(params: ReadonlyURLSearchParams, key: string): boolean {
  return params.get(key) === 'true'
}

export default function HomePageClient({
  initialSelectedWorks,
}: HomePageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const c64Ref = useRef<C64AuthenticHomeScreenHandle>(null)
  const [isWorkHistoryOpen, setIsWorkHistoryOpen] = useState(() =>
    isDrawerOpenFromUrl(searchParams, 'work-history'),
  )
  const [isAboutOpen, setIsAboutOpen] = useState(() =>
    isDrawerOpenFromUrl(searchParams, 'about'),
  )
  const [isSelectedWorksOpen, setIsSelectedWorksOpen] = useState(() =>
    isDrawerOpenFromUrl(searchParams, 'selected-works'),
  )
  const [isFieldNotesOpen, setIsFieldNotesOpen] = useState(() =>
    isDrawerOpenFromUrl(searchParams, 'field-notes'),
  )
  const [isSiteSettingsOpen, setIsSiteSettingsOpen] = useState(() =>
    isDrawerOpenFromUrl(searchParams, 'site-settings'),
  )
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(() =>
    isDrawerOpenFromUrl(searchParams, 'guestbook'),
  )
  const [isStatsOpen, setIsStatsOpen] = useState(() =>
    isDrawerOpenFromUrl(searchParams, 'stats'),
  )
  const [scanlinesAttr, setScanlinesAttr] = useState<'on' | 'off'>(
    defaultC64Settings.scanlines ? 'on' : 'off',
  )

  useLayoutEffect(() => {
    const syncScanlines = () => {
      setScanlinesAttr(loadC64Settings().scanlines ? 'on' : 'off')
    }
    syncScanlines()
    window.addEventListener('c64-settings-changed', syncScanlines)
    return () => window.removeEventListener('c64-settings-changed', syncScanlines)
  }, [])

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
    <div
      className="relative flex w-full min-w-0 min-h-0 flex-col c64-authentic-shell"
      data-c64-scanlines={scanlinesAttr}
      suppressHydrationWarning
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div
          inert={siteDrawerOpen ? true : undefined}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
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
        </div>

        <Drawer
          isOpen={isWorkHistoryOpen}
          onClose={handleWorkHistoryClose}
          breadcrumbs={[
            { label: 'Home', onClick: handleWorkHistoryClose },
            { label: 'Work History', current: true },
          ]}
          showLinkedInButton={true}
          linkedInUrl="https://www.linkedin.com/in/levinmedia/details/experience/"
        >
          <WorkHistoryContent />
        </Drawer>

        <Drawer
          isOpen={isAboutOpen}
          onClose={handleAboutClose}
          breadcrumbs={[
            { label: 'Home', onClick: handleAboutClose },
            { label: 'About', current: true },
          ]}
        >
          <AboutContent />
        </Drawer>

        <Drawer
          isOpen={isSelectedWorksOpen}
          onClose={handleSelectedWorksClose}
          breadcrumbs={[
            { label: 'Home', onClick: handleSelectedWorksClose },
            { label: 'Featured work', current: true },
          ]}
          contentPadding="p-0"
          maxWidth=""
        >
          <SelectedWorksContent initialWorks={initialSelectedWorks} />
        </Drawer>

        <Drawer
          isOpen={isFieldNotesOpen}
          onClose={handleFieldNotesClose}
          breadcrumbs={[
            { label: 'Home', onClick: handleFieldNotesClose },
            { label: 'Field notes', current: true },
          ]}
          contentPadding="p-0"
          maxWidth=""
        >
          <FieldNotesContent />
        </Drawer>

        <Drawer
          isOpen={isSiteSettingsOpen}
          onClose={handleSiteSettingsClose}
          breadcrumbs={[
            { label: 'Home', onClick: handleSiteSettingsClose },
            { label: 'Site Settings', current: true },
          ]}
          contentPadding="p-4"
          maxWidth="max-w-4xl"
        >
          <SiteSettingsContent />
        </Drawer>

        <Drawer
          isOpen={isGuestbookOpen}
          onClose={handleGuestbookClose}
          breadcrumbs={[
            { label: 'Home', onClick: handleGuestbookClose },
            { label: 'Guestbook', current: true },
          ]}
          contentPadding="p-4"
          maxWidth="max-w-4xl"
        >
          <Guestbook />
        </Drawer>

        <Drawer
          isOpen={isStatsOpen}
          onClose={handleStatsClose}
          breadcrumbs={[
            { label: 'Home', onClick: handleStatsClose },
            { label: 'Site Statistics', current: true },
          ]}
          contentPadding="p-4"
          maxWidth="max-w-6xl"
        >
          <StatsContent />
        </Drawer>
      </div>
    </div>
  )
}
