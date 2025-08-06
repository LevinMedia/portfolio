'use client'
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "./components/Button";
import ButtonTooltip from "./components/ButtonTooltip";
import Navigation, { NavigationItem } from "./components/Navigation";
import Tooltip from "./components/Tooltip";
import Drawer from "./components/Drawer";
import WorkHistoryContent from "./components/WorkHistoryContent";
import AboutContent from "./components/AboutContent";
import SelectedWorksContent from "./components/SelectedWorksContent";
import CircleInSquare from "./components/CircleInSquare";
import ViewportDebug from "./components/ViewportDebug";
import { CommandLineIcon, PencilSquareIcon, ChartBarSquareIcon, BriefcaseIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isWorkHistoryOpen, setIsWorkHistoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSelectedWorksOpen, setIsSelectedWorksOpen] = useState(false);

  // Check URL parameters on mount
  useEffect(() => {
    const showWorkHistory = searchParams.get('work-history') === 'true';
    const showAbout = searchParams.get('about') === 'true';
    const showSelectedWorks = searchParams.get('selected-works') === 'true';
    setIsWorkHistoryOpen(showWorkHistory);
    setIsAboutOpen(showAbout);
    setIsSelectedWorksOpen(showSelectedWorks);
  }, [searchParams]);

  // Handle opening work history drawer
  const handleWorkHistoryOpen = () => {
    setIsWorkHistoryOpen(true);
    setIsAboutOpen(false); // Close about drawer
    setIsSelectedWorksOpen(false); // Close selected works drawer
    const params = new URLSearchParams(searchParams.toString());
    params.set('work-history', 'true');
    params.delete('about'); // Remove about parameter
    params.delete('selected-works'); // Remove selected works parameter
    router.push(`?${params.toString()}`, { scroll: false });
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
    setIsAboutOpen(true);
    setIsWorkHistoryOpen(false); // Close work history drawer
    setIsSelectedWorksOpen(false); // Close selected works drawer
    const params = new URLSearchParams(searchParams.toString());
    params.set('about', 'true');
    params.delete('work-history'); // Remove work history parameter
    params.delete('selected-works'); // Remove selected works parameter
    router.push(`?${params.toString()}`, { scroll: false });
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
    setIsSelectedWorksOpen(true);
    setIsWorkHistoryOpen(false); // Close work history drawer
    setIsAboutOpen(false); // Close about drawer
    const params = new URLSearchParams(searchParams.toString());
    params.set('selected-works', 'true');
    params.delete('work-history'); // Remove work history parameter
    params.delete('about'); // Remove about parameter
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle closing selected works drawer
  const handleSelectedWorksClose = () => {
    setIsSelectedWorksOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('selected-works');
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
      <div className="row-start-2 col-span-6 flex flex-col lg:flex-row items-start" style={{ gap: 'var(--grid-major)' }}>
        {/* Image Box */}
        <Tooltip 
          codeGenerator={(props: any, children: any) => {
            return `<img 
  src="/Levin_Home.jpg" 
  alt="David Levin"
  className="w-full h-full object-cover"
/>`
          }} 
          borderRadius={0}
          showBorder={true}
          borderColor="stroke-accent"
        >
          <div className="relative border border-blue-200/15 rounded-none w-full lg:w-[328px] lg:h-[328px] lg:flex-shrink-0 aspect-square" style={{ padding: 'var(--grid-major)' }}>
            <img 
              src="/Levin_Home.jpg" 
              alt="David Levin"
              className="w-full h-full object-cover"
            />
          </div>
        </Tooltip>

        <main className="relative flex flex-col items-center sm:items-start border border-blue-200/15 rounded-none w-full lg:flex-grow" style={{ gap: 'var(--grid-major)', padding: 'var(--grid-major)' }}>
        <Tooltip 
          codeGenerator={(props: any, children: any) => {
            return `<div className="w-full text-2xl sm:text-5xl font-extrabold tracking-wide text-foreground font-[family-name:var(--font-geist-mono)] border border-blue-200/10 rounded-none" style={{ padding: 'var(--grid-major)' }}>
  Hi, I'm David 👋
</div>`
          }} 
          borderRadius={0}
          showBorder={true}
          borderColor="stroke-accent"
          fullWidth={true}
        >
          <div className="w-full text-2xl sm:text-5xl font-extrabold tracking-wide text-foreground font-[family-name:var(--font-geist-mono)] border border-blue-200/10 rounded-none" style={{ padding: 'var(--grid-major)' }}>Hi, I'm David 👋</div>
        </Tooltip>
        <Tooltip 
          codeGenerator={(props: any, children: any) => {
            return `<ul className="w-full list-none text-xs sm:text-sm/6 text-left font-[family-name:var(--font-geist-mono)] border border-blue-200/10 rounded-none" style={{ padding: 'var(--grid-major)' }}>
  <li className="tracking-[-.01em] flex items-start gap-2" style={{ marginBottom: 'var(--grid-major)' }}>
    <span className="text-lg">👷</span>
    <span>I orchestrate software architecture & design.</span>
  </li>
  <li className="tracking-[-.01em] flex items-start gap-2">
    <span className="text-lg">🚀</span>
    <span>Fancy that, right? Lets make awesome happen.</span>
  </li>
</ul>`
          }} 
          borderRadius={0}
          showBorder={true}
          borderColor="stroke-accent"
          fullWidth={true}
        >
          <ul className="w-full list-none text-xs sm:text-sm/6 text-left font-[family-name:var(--font-geist-mono)] border border-blue-200/10 rounded-none" style={{ padding: 'var(--grid-major)' }}>
            <li className="tracking-[-.01em] flex items-start gap-2" style={{ marginBottom: 'var(--grid-major)' }}>
              <span className="text-lg">👷</span>
              <span>I orchestrate software architecture & design.</span>
            </li>
            <li className="tracking-[-.01em] flex items-start gap-2">
              <span className="text-lg">🚀</span>
              <span>Fancy that, right? Lets make awesome happen.</span>
            </li>
          </ul>
        </Tooltip>

        <div className="w-full flex items-stretch flex-row border border-blue-200/15 rounded-none" style={{ gap: 'var(--grid-major)', padding: 'var(--grid-major)' }}>
                          <ButtonTooltip>
                  <Button
                    style="solid"
                    color="primary"
                    size="small"
                    className="sm:h-10 sm:px-4 sm:text-sm"
                    iconLeft={<CommandLineIcon className="w-5 h-5" />}
                    onClick={handleSelectedWorksOpen}
                  >
                    View selected work
                  </Button>
                </ButtonTooltip>
          <ButtonTooltip>
            <Button
              style="outline"
              color="primary"
              size="small"
              className="sm:h-10 sm:px-4 sm:text-sm"
            >
              Site settings
            </Button>
          </ButtonTooltip>
        </div>
      </main>
      </div>
      
      {/* Viewport Debug - positioned above navigation */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 w-full max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] z-50">
        <div className="flex justify-start" style={{ padding: 'var(--grid-major)' }}>
          <ViewportDebug />
        </div>
      </div>
      
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] z-50">
        <Tooltip 
          codeGenerator={(props: any, children: any) => {
            return `<Navigation>
  <CircleInSquare size={32} onClick={() => window.location.href = '/'} />
  <NavigationItem icon={<BriefcaseIcon />} label="Work history" onClick={handleWorkHistoryOpen} />
  <NavigationItem icon={<QuestionMarkCircleIcon />} label="About David" onClick={handleAboutOpen} />
  <NavigationItem icon={<ChartBarSquareIcon />} label="Stats" />
  <NavigationItem icon={<PencilSquareIcon />} label="Sign the guest book" />
</Navigation>`
          }} 
          borderRadius={0}
          showBorder={true}
          borderColor="stroke-accent"
          fullWidth={true}
        >
          <Navigation>
            <CircleInSquare size={32} onClick={() => window.location.href = '/'} />
            <NavigationItem 
              icon={<BriefcaseIcon className="w-5 h-5" />}
              label="Work history"
              onClick={handleWorkHistoryOpen}
            />
            <NavigationItem 
              icon={<QuestionMarkCircleIcon className="w-5 h-5" />}
              label="About David"
              onClick={handleAboutOpen}
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
          title="About David"
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
      </div>
    );
  }
