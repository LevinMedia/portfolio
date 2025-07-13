'use client'
import Button from "./components/Button";
import ButtonTooltip from "./components/ButtonTooltip";
import { CommandLineIcon, PencilSquareIcon, ChartBarSquareIcon, BriefcaseIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

export default function Home() {
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
      <footer className="fixed bottom-0 left-1/2 transform -translate-x-1/2 flex flex-wrap items-center justify-start border border-blue-200/15 rounded-none mx-auto max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] w-full" style={{ 
        gap: 'var(--grid-major)', 
        padding: 'var(--grid-major)', 
        height: 'calc(var(--grid-major) * 4)'
      }}>
        <span className="flex items-center text-base" style={{ gap: 'var(--grid-major)' }}>
          <BriefcaseIcon className="w-5 h-5" aria-hidden />
          Work history
        </span>
        <span className="flex items-center text-base" style={{ gap: 'var(--grid-major)' }}>
          <QuestionMarkCircleIcon className="w-5 h-5" aria-hidden />
          About David
        </span>
        <span className="flex items-center text-base" style={{ gap: 'var(--grid-major)' }}>
          <ChartBarSquareIcon className="w-5 h-5" aria-hidden />
          Stats
        </span>
        <span className="flex items-center text-base" style={{ gap: 'var(--grid-major)' }}>
          <PencilSquareIcon className="w-5 h-5" aria-hidden />
          Sign the guest book
          <span aria-hidden>→</span>
        </span>
      </footer>
    </div>
  );
}
