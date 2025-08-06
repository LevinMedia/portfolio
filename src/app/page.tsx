'use client'
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "./components/Button";
import ButtonTooltip from "./components/ButtonTooltip";
import Navigation, { NavigationItem } from "./components/Navigation";
import Tooltip from "./components/Tooltip";
import Drawer from "./components/Drawer";
import WorkHistoryContent from "./components/WorkHistoryContent";
import CircleInSquare from "./components/CircleInSquare";
import { CommandLineIcon, PencilSquareIcon, ChartBarSquareIcon, BriefcaseIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isWorkHistoryOpen, setIsWorkHistoryOpen] = useState(false);

  // Check URL parameters on mount
  useEffect(() => {
    const showWorkHistory = searchParams.get('work-history') === 'true';
    setIsWorkHistoryOpen(showWorkHistory);
  }, [searchParams]);

  // Handle opening work history drawer
  const handleWorkHistoryOpen = () => {
    setIsWorkHistoryOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('work-history', 'true');
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
      <main className="relative flex flex-col row-start-2 col-span-6 lg:col-span-3 items-center sm:items-start border border-blue-200/15 rounded-none" style={{ gap: 'var(--grid-major)', padding: 'var(--grid-major)' }}>
        <div className="w-full text-5xl sm:text-5xl font-extrabold tracking-wide text-foreground font-[family-name:var(--font-geist-mono)] border border-blue-200/10 rounded-none" style={{ padding: 'var(--grid-major)' }}>LevinMedia</div>
        <ul className="w-full list-none text-sm/6 text-left font-[family-name:var(--font-geist-mono)] border border-blue-200/10 rounded-none" style={{ padding: 'var(--grid-major)' }}>
          <li className="tracking-[-.01em] flex items-start gap-2" style={{ marginBottom: 'var(--grid-major)' }}>
            <span className="text-lg">👷</span>
            <span>I orchestrate software architecture & design.</span>
          </li>
          <li className="tracking-[-.01em] flex items-start gap-2">
            <span className="text-lg">🚀</span>
            <span>Fancy that, right? Lets make awesome happen.</span>
          </li>
        </ul>

        <div className="w-full flex items-stretch flex-col sm:flex-row border border-blue-200/15 rounded-none" style={{ gap: 'var(--grid-major)', padding: 'var(--grid-major)' }}>
          <ButtonTooltip>
            <Button
              style="solid"
              color="primary"
              size="medium"
              iconLeft={<CommandLineIcon className="w-5 h-5" />}
            >
              View selected work
            </Button>
          </ButtonTooltip>
          <ButtonTooltip>
            <Button
              style="outline"
              color="primary"
              size="medium"
            >
              Site settings
            </Button>
          </ButtonTooltip>
        </div>
      </main>
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px]">
        <Tooltip 
          codeGenerator={(props: any, children: any) => {
            return `<Navigation>
  <CircleInSquare size={32} onClick={() => window.location.href = '/'} />
  <NavigationItem icon={<BriefcaseIcon />} label="Work history" onClick={() => setIsWorkHistoryOpen(true)} />
  <NavigationItem icon={<QuestionMarkCircleIcon />} label="About David" />
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
    </div>
  );
}
