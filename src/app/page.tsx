'use client'

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Drawer from "./components/Drawer";
import WorkHistoryContent from "./components/WorkHistoryContent";
import AboutContent from "./components/AboutContent";
import SelectedWorksContent from "./components/SelectedWorksContent";
import SiteSettingsContent from "./components/SiteSettingsContent";
import StatsContent from "./components/StatsContent";
import Guestbook from "./components/Guestbook";
import { ThemeHowdy, ThemeNavigation } from "./components/ThemeComponents";
import { ParticleBackground } from "./components/ParticleBackground";
import { usePageTitle } from "./hooks/usePageTitle";
import { useTheme } from "@/lib/themes/ThemeProvider";
import { WindowManagerProvider } from "@/themes/next95/context/WindowManagerContext";
import DesktopIcon from "@/themes/next95/components/DesktopIcon";
import SelectedWorksWindow from "@/themes/next95/components/SelectedWorksWindow";
import WorkDetailWindow from "@/themes/next95/components/WorkDetailWindow";
import StatsWindow from "@/themes/next95/components/StatsWindow";
import WorkHistoryWindow from "@/themes/next95/components/WorkHistoryWindow";
import GuestbookWindow from "@/themes/next95/components/GuestbookWindow";
import AboutWindow from "@/themes/next95/components/AboutWindow";
import SystemSettingsWindow from "@/themes/next95/components/SystemSettingsWindow";

import { CommandLineIcon, PencilSquareIcon, ChartBarSquareIcon, BriefcaseIcon, QuestionMarkCircleIcon, CogIcon } from "@heroicons/react/24/outline";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [isWorkHistoryOpen, setIsWorkHistoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSelectedWorksOpen, setIsSelectedWorksOpen] = useState(false);
  const [isSiteSettingsOpen, setIsSiteSettingsOpen] = useState(false);
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [isHowdyOpen, setIsHowdyOpen] = useState(true); // Howdy window state
  const [isSelectedWorksWindowOpen, setIsSelectedWorksWindowOpen] = useState(false); // Next95 Selected Works window
  const [isStatsWindowOpen, setIsStatsWindowOpen] = useState(false); // Next95 Stats window
  const [isWorkHistoryWindowOpen, setIsWorkHistoryWindowOpen] = useState(false); // Next95 Work History window
  const [isGuestbookWindowOpen, setIsGuestbookWindowOpen] = useState(false); // Next95 Guestbook window
  const [isAboutWindowOpen, setIsAboutWindowOpen] = useState(false); // Next95 About window
  const [isSystemSettingsWindowOpen, setIsSystemSettingsWindowOpen] = useState(false); // Next95 System Settings window
  const [openWorkWindows, setOpenWorkWindows] = useState<Array<{ slug: string; title: string }>>([]); // Track open work detail windows
  const [howdyImageSrc, setHowdyImageSrc] = useState<string>('/guestbook-icon.png'); // Fallback to guestbook icon
  const [isDarkMode, setIsDarkMode] = useState(false); // Track dark mode state

  // Determine current page title based on open drawer
  const pageTitle = isWorkHistoryOpen ? 'Work History'
    : isAboutOpen ? 'About'
    : isSelectedWorksOpen ? 'Selected Works'
    : isSiteSettingsOpen ? 'Site Settings'
    : isGuestbookOpen ? 'Guestbook'
    : isStatsOpen ? 'Stats'
    : isAboutWindowOpen ? 'About'
    : null;

  usePageTitle(pageTitle);

  // Fetch howdy image for desktop icon
  useEffect(() => {
    const fetchHowdyImage = async () => {
      try {
        const response = await fetch('/api/howdy');
        if (response.ok) {
          const data = await response.json();
          if (data.image_src) {
            setHowdyImageSrc(data.image_src);
          }
        }
      } catch (err) {
        console.error('Failed to fetch howdy image:', err);
      }
    };
    
    if (theme.id === 'next95') {
      void fetchHowdyImage();
    }
  }, [theme.id]);

  // Initialize Next95 theme colors
  useEffect(() => {
    if (theme.id === 'next95') {
      const savedSettings = localStorage.getItem('next95-settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          const root = document.documentElement;
          root.style.setProperty('--next95-primary', settings.primaryColor || '#0000ff');
          root.style.setProperty('--next95-secondary', settings.secondaryColor || '#ff00ff');
          
          // Apply window header settings
          if (settings.windowHeaderType === 'solid') {
            root.style.setProperty('--next95-window-header', settings.windowHeaderSolid || '#000080');
            // Calculate text color for solid backgrounds
            const hex = (settings.windowHeaderSolid || '#000080').replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            root.style.setProperty('--next95-window-header-text', luminance > 0.5 ? '#000000' : '#ffffff');
          } else if (settings.windowHeaderGradient) {
            root.style.setProperty('--next95-window-header', settings.windowHeaderGradient);
            root.style.setProperty('--next95-window-header-text', '#ffffff');
          }
        } catch (error) {
          console.error('Error loading Next95 settings:', error);
        }
      }
    }
  }, [theme.id]);

  // Track dark mode changes for Next95 theme
  useEffect(() => {
    if (theme.id === 'next95') {
      const checkDarkMode = () => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
      };
      
      checkDarkMode();
      
      // Watch for dark mode changes
      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      return () => observer.disconnect();
    }
  }, [theme.id]);

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
    
    // Set active window based on what's open
    if (showWorkHistory) setActiveWindow('work-history');
    else if (showAbout) setActiveWindow('about');
    else if (showSelectedWorks) setActiveWindow('selected-works');
    else if (showGuestbook) setActiveWindow('guestbook');
    else if (showStats) setActiveWindow('stats');
    else if (showSiteSettings) setActiveWindow('site-settings');
    else setActiveWindow(null);
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

  const showParticleBackground = theme.layoutConfig?.particleBackground !== false;
  const showGridPattern = theme.layoutConfig?.gridPattern !== false;
  const fullWidth = theme.layoutConfig?.fullWidth === true;

  const containerClasses = fullWidth
    ? "relative grid grid-cols-6 items-center min-h-screen font-[family-name:var(--font-geist-sans)]"
    : "relative grid grid-cols-6 items-center min-h-screen font-[family-name:var(--font-geist-sans)] border border-blue-200/20 mx-auto px-4 sm:px-0 max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px]";

  const content = (
    <div className={containerClasses} style={{ 
      gridTemplateRows: 'var(--grid-major) 1fr 0',
      gap: 'var(--grid-major)',
    }}>
      {/* Particle Background Layer - constrained to wrapper */}
      {showParticleBackground && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <ParticleBackground />
        </div>
      )}

      {/* Dark Mode Scrim - 67% opacity black overlay for Next95 theme in dark mode */}
      {theme.id === 'next95' && isDarkMode && (
        <div 
          className="absolute inset-0 z-[0.5] pointer-events-none transition-opacity duration-300"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.67)' }}
        />
      )}

      {/* Grid Pattern Overlay */}
      {showGridPattern && (
        <div className="absolute inset-0 z-[1] pointer-events-none" style={{
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
        }} />
      )}

      {/* Content Layer */}
      <div className="relative z-10 col-span-6 contents">
        {/* Desktop Icons - only show in next95 theme */}
        {theme.id === 'next95' && (
          <div className="fixed top-4 left-4 bottom-20 z-20 flex flex-col flex-wrap gap-2 content-start">
            <DesktopIcon 
              icon={
                <Image 
                  src={howdyImageSrc} 
                  alt="Howdy" 
                  width={72} 
                  height={72} 
                  className="object-cover rounded"
                />
              }
              label="Howdy"
              onClick={() => setIsHowdyOpen(true)}
            />
            <DesktopIcon
              icon={
                <svg width="72" height="72" viewBox="0 0 72 72" className="flex-shrink-0">
                  <rect x="9" y="4.5" width="45" height="63" fill="#ffffff" stroke="#000" strokeWidth="1.5" />
                  <path d="M36 4.5 L54 4.5 L54 22.5 L36 22.5 Z" fill="#e0e0e0" stroke="#000" strokeWidth="1.5" />
                  <line x1="18" y1="31.5" x2="45" y2="31.5" stroke="#000" strokeWidth="1.5" />
                  <line x1="18" y1="40.5" x2="45" y2="40.5" stroke="#000" strokeWidth="1.5" />
                  <line x1="18" y1="49.5" x2="36" y2="49.5" stroke="#000" strokeWidth="1.5" />
                </svg>
              }
              label="About"
              onClick={() => setIsAboutWindowOpen(true)}
            />
            <DesktopIcon 
              icon={
                <Image src="/work-history.png" alt="Work History" width={72} height={72} />
              }
              label="Work History"
              onClick={() => setIsWorkHistoryWindowOpen(true)}
            />
            <DesktopIcon 
              icon={
                <Image src="/folder.png" alt="Selected Works" width={72} height={72} />
              }
              label="Selected Works"
              onClick={() => setIsSelectedWorksWindowOpen(true)}
            />
            <DesktopIcon 
              icon={
                <Image src="/Stats.png" alt="Stats" width={72} height={72} />
              }
              label="Stats"
              onClick={() => setIsStatsWindowOpen(true)}
            />
            <DesktopIcon 
              icon={
                <Image src="/guestbook-icon.png" alt="Guestbook" width={72} height={72} />
              }
              label="Guestbook"
              onClick={() => setIsGuestbookWindowOpen(true)}
            />
            <DesktopIcon 
              icon={
                <Image src="/System-settings.png" alt="System Settings" width={72} height={72} />
              }
              label="System Settings"
              onClick={() => setIsSystemSettingsWindowOpen(true)}
            />
          </div>
        )}

        <ThemeHowdy 
          onSelectedWorksClick={() => setIsSelectedWorksWindowOpen(true)} 
          onSiteSettingsClick={() => setIsSystemSettingsWindowOpen(true)} 
          isOpen={isHowdyOpen}
          onClose={() => setIsHowdyOpen(false)}
        />

        {/* Next95 Selected Works Window */}
        {theme.id === 'next95' && isSelectedWorksWindowOpen && (
          <SelectedWorksWindow 
            onClose={() => setIsSelectedWorksWindowOpen(false)} 
            onOpenWork={(slug, title) => {
              // Add to open work windows if not already open
              if (!openWorkWindows.some(w => w.slug === slug)) {
                setOpenWorkWindows([...openWorkWindows, { slug, title }]);
              }
            }}
          />
        )}

        {/* Next95 Work Detail Windows */}
        {theme.id === 'next95' && openWorkWindows.map(work => (
          <WorkDetailWindow
            key={work.slug}
            slug={work.slug}
            title={work.title}
            onClose={() => {
              setOpenWorkWindows(openWorkWindows.filter(w => w.slug !== work.slug));
            }}
          />
        ))}

        {/* Next95 Stats Window */}
        {theme.id === 'next95' && isStatsWindowOpen && (
          <StatsWindow onClose={() => setIsStatsWindowOpen(false)} />
        )}

        {/* Next95 Work History Window */}
        {theme.id === 'next95' && isWorkHistoryWindowOpen && (
          <WorkHistoryWindow onClose={() => setIsWorkHistoryWindowOpen(false)} />
        )}

        {/* Next95 Guestbook Window */}
        {theme.id === 'next95' && isGuestbookWindowOpen && (
          <GuestbookWindow onClose={() => setIsGuestbookWindowOpen(false)} />
        )}

        {/* Next95 About Window */}
        {theme.id === 'next95' && isAboutWindowOpen && (
          <AboutWindow onClose={() => setIsAboutWindowOpen(false)} />
        )}

        {/* Next95 System Settings Window */}
        {theme.id === 'next95' && isSystemSettingsWindowOpen && (
          <SystemSettingsWindow 
            onClose={() => setIsSystemSettingsWindowOpen(false)} 
          />
        )}
      

      
      <ThemeNavigation />

      {/* Work History Drawer */}
      <Drawer
        isOpen={isWorkHistoryOpen}
        onClose={handleWorkHistoryClose}
        title="Work History"
        icon={<BriefcaseIcon className="w-6 h-6" />}
        showLinkedInButton={true}
        linkedInUrl="https://www.linkedin.com/in/levinmedia/details/experience/"
        lazyMount
      >
        <WorkHistoryContent />
      </Drawer>

              {/* About Drawer */}
        <Drawer
          isOpen={isAboutOpen}
          onClose={handleAboutClose}
          title="About"
          icon={<QuestionMarkCircleIcon className="w-6 h-6" />}
        lazyMount
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
        lazyMount
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
        lazyMount
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
        lazyMount
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
        lazyMount
        >
          <StatsContent />
        </Drawer>
      </div>
    </div>
  );

  // Wrap with WindowManagerProvider for next95 theme
  if (theme.id === 'next95') {
    return <WindowManagerProvider>{content}</WindowManagerProvider>;
  }

  return content;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
