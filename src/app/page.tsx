'use client'

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Drawer from "./components/Drawer";
import WorkHistoryContent from "./components/WorkHistoryContent";
import AboutContent from "./components/AboutContent";
import SelectedWorksContent from "./components/SelectedWorksContent";
import SiteSettingsContent from "./components/SiteSettingsContent";
import StatsContent from "./components/StatsContent";
import Guestbook from "./components/Guestbook";
import Howdy from "./components/Howdy";
import Navigation from "./components/Navigation";
import { usePageTitle } from "./hooks/usePageTitle";

import { CommandLineIcon, PencilSquareIcon, ChartBarSquareIcon, BriefcaseIcon, QuestionMarkCircleIcon, CogIcon } from "@heroicons/react/24/outline";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isWorkHistoryOpen, setIsWorkHistoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSelectedWorksOpen, setIsSelectedWorksOpen] = useState(false);
  const [isSiteSettingsOpen, setIsSiteSettingsOpen] = useState(false);
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Determine current page title based on open drawer
  const pageTitle = isWorkHistoryOpen ? 'Work History'
    : isAboutOpen ? 'About'
    : isSelectedWorksOpen ? 'Selected Works'
    : isSiteSettingsOpen ? 'Site Settings'
    : isGuestbookOpen ? 'Guestbook'
    : isStatsOpen ? 'Stats'
    : null;

  usePageTitle(pageTitle);

  // Check URL parameters on mount
  useEffect(() => {
    const showWorkHistory = searchParams.get('work-history') === 'true';
    const showAbout = searchParams.get('about') === 'true';
    const showSelectedWorks = searchParams.get('selected-works') === 'true';
    const showGuestbook = searchParams.get('guestbook') === 'true';
    const showStats = searchParams.get('stats') === 'true';
    const showSiteSettings = searchParams.get('site-settings') === 'true';
    setIsWorkHistoryOpen(showWorkHistory);
    setIsAboutOpen(showAbout);
    setIsSelectedWorksOpen(showSelectedWorks);
    setIsGuestbookOpen(showGuestbook);
    setIsStatsOpen(showStats);
    setIsSiteSettingsOpen(showSiteSettings);
  }, [searchParams]);


  // Handle closing work history drawer
  const handleWorkHistoryClose = () => {
    setIsWorkHistoryOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('work-history');
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
  };


  // Handle closing about drawer
  const handleAboutClose = () => {
    setIsAboutOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('about');
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
  };



  // Handle closing site settings drawer
  const handleSiteSettingsClose = () => {
    setIsSiteSettingsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('site-settings');
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
  };

  // Handle closing selected works drawer
  const handleSelectedWorksClose = () => {
    setIsSelectedWorksOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('selected-works');
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
  };


  // Handle closing guestbook drawer
  const handleGuestbookClose = () => {
    setIsGuestbookOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('guestbook');
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
  };


  const handleStatsClose = () => {
    setIsStatsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('stats');
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="home-shell">
      <div
        className="home-grid grid grid-cols-6 items-center min-h-screen font-[family-name:var(--font-geist-sans)] border border-blue-200/20 mx-auto max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px]"
        style={{
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
        }}
      >
        <Howdy onSelectedWorksClick={() => router.push('/?selected-works=true')} onSiteSettingsClick={() => setIsSiteSettingsOpen(true)} />

        <Navigation />

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

        {/* Stats Drawer */}
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
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
