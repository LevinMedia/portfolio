'use client';

import Window from './Window';
import { useWindowManager } from '../context/WindowManagerContext';
import Image from 'next/image';

interface AboutWindowProps {
  onClose: () => void;
}

export default function AboutWindow({ onClose }: AboutWindowProps) {
  const { windows } = useWindowManager();

  // Calculate cascaded position
  const cascadeLevel = windows.filter(w => !w.isMinimized).length;
  const cascadeOffset = 40;
  
  // Calculate window size with max 1000px width and fill height with padding
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const taskbarHeight = 56;
  const verticalPadding = 40;
  
  const windowWidth = Math.min(1000, viewportWidth - 40);
  const windowHeight = viewportHeight - taskbarHeight - verticalPadding;
  
  const baseX = typeof window !== 'undefined' ? Math.max(20, (viewportWidth - windowWidth) / 2) : 100;
  const baseY = 20;
  
  const defaultX = baseX + (cascadeLevel * cascadeOffset);
  const defaultY = baseY + (cascadeLevel * cascadeOffset);

  return (
    <Window
      id="about-next95"
      title="About"
      icon={<Image src="/about.png" alt="About" width={16} height={16} />}
      defaultWidth={windowWidth}
      defaultHeight={windowHeight}
      defaultX={defaultX}
      defaultY={defaultY}
      onClose={onClose}
      resizable
      draggable
    >
      <div 
        className="h-full overflow-y-auto"
        style={{
          backgroundColor: 'var(--win95-content-bg, #ffffff)',
          color: 'var(--win95-content-text, #000000)'
        }}
      >
        <div className="p-4">
          {/* Content - max-width 768px for text */}
          <div className="mx-auto work-content-wrapper @container" style={{ maxWidth: '768px' }}>
            <div className="work-detail-content text-sm @[600px]:text-base leading-relaxed" style={{ color: 'var(--win95-content-text, #111)' }}>
              {/* About this site section */}
              <h2 className="text-xl @[600px]:text-2xl font-bold mb-3 mt-0" style={{ color: 'var(--win95-content-text, #111)' }}>About this site</h2>
              <p className="mb-4">
                Building and maintaining a portfolio site has always been at the absolute bottom of my list of things I'm excited to spend time on. But... there's this new thing — I dunno if you've heard of it — it's called AI, and it's kind of revolutionizing software development. 😏
              </p>
              <p className="mb-4">
                So this site is a bit of an experiment. It's the product of AI-assisted software development (distinctly different from "vibe coding"). I've open-sourced the whole thing too, for anyone who wants a nifty little portfolio site to tinker with. Go ahead, take a peek under the hood. Heck, open an issue and tell me what I did wrong — or better yet, just make a PR and fix it!
              </p>
              <p className="mb-4">
                <a 
                  href="https://github.com/levinmedia/portfolio" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline"
                  style={{ 
                    color: 'var(--next95-primary, #0000ff)',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--next95-secondary').trim() || '#ff00ff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--next95-primary').trim() || '#0000ff'}
                >
                  https://github.com/levinmedia/portfolio
                </a>
              </p>

              {/* About David section */}
              <h2 className="text-xl @[600px]:text-2xl font-bold mb-3 mt-6" style={{ color: 'var(--win95-content-text, #111)' }}>About David</h2>
              <p className="mb-4">
                David is a software architect with a designer's mindset and a builder's instinct. He specializes in designing complex, data-driven experiences that feel intuitive and efficient — especially in areas where the stakes are high, the logic is deep, and the edge cases matter.
              </p>
              <p className="mb-4">
                His work blends product strategy, UX architecture, and hands-on design execution. He's led cross-functional teams, built new products from the ground up, and helped scale existing systems without losing sight of the end user. Whether he's modeling data relationships, designing interactive tools, or thinking through complex data models, he cares about clarity, precision, and momentum. He's worked across domains — from compensation planning to surf forecasting to game design — and brings a sharp eye to both product mechanics and user experience.
              </p>
              <p className="mb-4">
                Outside of work, he's a husband, a dad, a surfer, a skier, and an incurable tinkerer. He likes to build things — digital and physical — and is usually chasing a better system, a smoother flow, or a smarter solution. If he's not sketching out a product idea, he's probably in the ocean or working on a side project with his daughter.
              </p>
              <p className="mb-4 text-xs italic" style={{ color: 'var(--win95-content-text, #666)' }}>
                And yes, this was absolutely written by AI, and edited lightly for style, context, and clarity.
              </p>

              {/* Published Date */}
              <div 
                className="mx-auto text-xs border-t-2 pt-2 mt-4" 
                style={{ 
                  maxWidth: '768px',
                  color: 'var(--win95-content-text, #666)',
                  borderColor: 'var(--win95-border-mid, #808080)'
                }}
              >
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
          <style jsx global>{`
            .work-content-wrapper {
              font-family: 'MS Sans Serif', system-ui, sans-serif;
              container-type: inline-size;
            }
          `}</style>
        </div>
      </div>
    </Window>
  );
}

