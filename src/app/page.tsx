'use client'

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navigation, { NavigationItem } from "./components/Navigation";
import Tooltip from "./components/Tooltip";
import Drawer from "./components/Drawer";
import WorkHistoryContent from "./components/WorkHistoryContent";
import AboutContent from "./components/AboutContent";
import SelectedWorksContent from "./components/SelectedWorksContent";
import SiteSettingsContent from "./components/SiteSettingsContent";
import Guestbook from "./components/Guestbook";
import LevinMediaLogo from "./components/LevinMediaLogo";
import Howdy from "./components/Howdy";

import { CommandLineIcon, PencilSquareIcon, ChartBarSquareIcon, BriefcaseIcon, QuestionMarkCircleIcon, CogIcon } from "@heroicons/react/24/outline";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isWorkHistoryOpen, setIsWorkHistoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSelectedWorksOpen, setIsSelectedWorksOpen] = useState(false);
  const [isSiteSettingsOpen, setIsSiteSettingsOpen] = useState(false);
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(false);

  // Check URL parameters on mount
  useEffect(() => {
    const showWorkHistory = searchParams.get('work-history') === 'true';
    const showAbout = searchParams.get('about') === 'true';
    const showSelectedWorks = searchParams.get('selected-works') === 'true';
    const showGuestbook = searchParams.get('guestbook') === 'true';
    setIsWorkHistoryOpen(showWorkHistory);
    setIsAboutOpen(showAbout);
    setIsSelectedWorksOpen(showSelectedWorks);
    setIsGuestbookOpen(showGuestbook);
  }, [searchParams]);

  // Handle opening work history drawer
  const handleWorkHistoryOpen = () => {
    // Check if any drawer is currently open
    const isAnyDrawerOpen = isAboutOpen || isSelectedWorksOpen || isSiteSettingsOpen || isGuestbookOpen;
    
    if (isAnyDrawerOpen) {
      // Close all drawers first
      setIsAboutOpen(false);
      setIsSelectedWorksOpen(false);
      setIsSiteSettingsOpen(false);
      setIsGuestbookOpen(false);
      
      // Wait for slide-out animation to complete (300ms), then open new drawer
      setTimeout(() => {
        setIsWorkHistoryOpen(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('work-history', 'true');
        params.delete('about');
        params.delete('selected-works');
        params.delete('guestbook');
        router.push(`?${params.toString()}`, { scroll: false });
      }, 300);
    } else {
      // No drawer open, open immediately
      setIsWorkHistoryOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set('work-history', 'true');
      params.delete('about');
      params.delete('selected-works');
      params.delete('guestbook');
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  // Handle closing work history drawer
  const handleWorkHistoryClose = () => {
    setIsWorkHistoryOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('work-history');
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
  };

  // Handle opening about drawer
  const handleAboutOpen = () => {
    // Check if any drawer is currently open
    const isAnyDrawerOpen = isWorkHistoryOpen || isSelectedWorksOpen || isSiteSettingsOpen || isGuestbookOpen;
    
    if (isAnyDrawerOpen) {
      // Close all drawers first
      setIsWorkHistoryOpen(false);
      setIsSelectedWorksOpen(false);
      setIsSiteSettingsOpen(false);
      setIsGuestbookOpen(false);
      
      // Wait for slide-out animation to complete (300ms), then open new drawer
      setTimeout(() => {
        setIsAboutOpen(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('about', 'true');
        params.delete('work-history');
        params.delete('selected-works');
        params.delete('guestbook');
        router.push(`?${params.toString()}`, { scroll: false });
      }, 300);
    } else {
      // No drawer open, open immediately
      setIsAboutOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set('about', 'true');
      params.delete('work-history');
      params.delete('selected-works');
      params.delete('guestbook');
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  // Handle closing about drawer
  const handleAboutClose = () => {
    setIsAboutOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('about');
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
  };

  // Handle opening selected works drawer
  const handleSelectedWorksOpen = () => {
    // Check if any drawer is currently open
    const isAnyDrawerOpen = isWorkHistoryOpen || isAboutOpen || isSiteSettingsOpen || isGuestbookOpen;
    
    if (isAnyDrawerOpen) {
      // Close all drawers first
      setIsWorkHistoryOpen(false);
      setIsAboutOpen(false);
      setIsSiteSettingsOpen(false);
      setIsGuestbookOpen(false);
      
      // Wait for slide-out animation to complete (300ms), then open new drawer
      setTimeout(() => {
        setIsSelectedWorksOpen(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('selected-works', 'true');
        params.delete('work-history');
        params.delete('about');
        params.delete('guestbook');
        router.push(`?${params.toString()}`, { scroll: false });
      }, 300);
    } else {
      // No drawer open, open immediately
      setIsSelectedWorksOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set('selected-works', 'true');
      params.delete('work-history');
      params.delete('about');
      params.delete('guestbook');
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  // Handle opening site settings drawer
  const handleSiteSettingsOpen = () => {
    // Check if any drawer is currently open
    const isAnyDrawerOpen = isWorkHistoryOpen || isAboutOpen || isSelectedWorksOpen || isGuestbookOpen;
    
    if (isAnyDrawerOpen) {
      // Close all drawers first
      setIsWorkHistoryOpen(false);
      setIsAboutOpen(false);
      setIsSelectedWorksOpen(false);
      setIsGuestbookOpen(false);
      
      // Wait for slide-out animation to complete (300ms), then open new drawer
      setTimeout(() => {
        setIsSiteSettingsOpen(true);
      }, 300);
    } else {
      // No drawer open, open immediately
      setIsSiteSettingsOpen(true);
    }
  };

  // Handle closing site settings drawer
  const handleSiteSettingsClose = () => {
    setIsSiteSettingsOpen(false);
  };

  // Handle closing selected works drawer
  const handleSelectedWorksClose = () => {
    setIsSelectedWorksOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('selected-works');
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
  };

  // Handle opening guestbook drawer
  const handleGuestbookOpen = () => {
    // Check if any drawer is currently open
    const isAnyDrawerOpen = isWorkHistoryOpen || isAboutOpen || isSelectedWorksOpen || isSiteSettingsOpen;
    
    if (isAnyDrawerOpen) {
      // Close all drawers first
      setIsWorkHistoryOpen(false);
      setIsAboutOpen(false);
      setIsSelectedWorksOpen(false);
      setIsSiteSettingsOpen(false);
      
      // Wait for slide-out animation to complete (300ms), then open new drawer
      setTimeout(() => {
        setIsGuestbookOpen(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('guestbook', 'true');
        params.delete('work-history');
        params.delete('about');
        params.delete('selected-works');
        router.push(`?${params.toString()}`, { scroll: false });
      }, 300);
    } else {
      // No drawer open, open immediately
      setIsGuestbookOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set('guestbook', 'true');
      params.delete('work-history');
      params.delete('about');
      params.delete('selected-works');
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  // Handle closing guestbook drawer
  const handleGuestbookClose = () => {
    setIsGuestbookOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('guestbook');
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="grid grid-cols-6 items-center min-h-screen font-[family-name:var(--font-geist-sans)] border border-blue-200/20 mx-auto max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px]" style={{ 
      gridTemplateRows: 'var(--grid-major) 1fr 0',
      gap: 'var(--grid-major)',
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
      backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), 0 0'
    }}>
      <Howdy onSelectedWorksClick={handleSelectedWorksOpen} onSiteSettingsClick={handleSiteSettingsOpen} />
      

      
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] z-50">
        <Tooltip 
                      codeGenerator={() => {
            return `<Navigation>
  <LevinMediaLogo size={32} onClick={() => window.location.href = '/'} />
  <NavigationItem icon={<CommandLineIcon />} label="Selected works" onClick={handleSelectedWorksOpen} />
  <ViewportDebug />
  <NavigationItem icon={<BriefcaseIcon />} label="Work history" onClick={handleWorkHistoryOpen} />
  <NavigationItem icon={<QuestionMarkCircleIcon />} label="About" onClick={handleAboutOpen} />
  <NavigationItem icon={<ChartBarSquareIcon />} label="Stats" />
  <NavigationItem icon={<PencilSquareIcon />} label="Guestbook" onClick={handleGuestbookOpen} />
  <NavigationItem icon={<CogIcon />} label="Site settings" onClick={handleSiteSettingsOpen} />
</Navigation>`
          }} 
          borderRadius={0}
          showBorder={true}
          borderColor="stroke-accent"
          fullWidth={true}
        >
          <Navigation>
            <LevinMediaLogo size={32} onClick={() => window.location.href = '/'} />
            <NavigationItem 
              icon={<CommandLineIcon className="w-5 h-5" />}
              label="Selected works"
              onClick={handleSelectedWorksOpen}
            />
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
            <NavigationItem 
              icon={<CogIcon className="w-5 h-5" />}
              label="Site settings"
              onClick={handleSiteSettingsOpen}
            />
          </Navigation>
        </Tooltip>
      </div>

      {/* Work History Drawer */}
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

              {/* About Drawer */}
        <Drawer
          isOpen={isAboutOpen}
          onClose={handleAboutClose}
          title="About"
          icon={<QuestionMarkCircleIcon className="w-6 h-6" />}
        >
          <AboutContent />
        </Drawer>

        {/* Selected Works Drawer */}
        <Drawer
          isOpen={isSelectedWorksOpen}
          onClose={handleSelectedWorksClose}
          title="Selected works"
          icon={<CommandLineIcon className="w-6 h-6" />}
          contentPadding="p-0"
          maxWidth=""
        >
          <SelectedWorksContent />
        </Drawer>

        {/* Site Settings Drawer */}
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

        {/* Guestbook Drawer */}
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
      </div>
    );
  }

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
