import React from 'react'

const AboutContent: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* About David Card (now first) */}
      <section className="bg-background border border-neutral-100/6 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-accent font-[family-name:var(--font-geist-mono)] mb-2">About David</h2>
        </div>
        
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>
            I specialize in designing complex, data-driven experiences that feel intuitive and efficient — especially in areas where the stakes are high, the logic is deep, and the edge cases matter.
          </p>
          
          <p>
            My work blends product strategy, UX architecture, and hands-on design execution. I&apos;ve led cross-functional teams, built new products from the ground up, and helped scale existing systems without losing sight of the end user. Whether I&apos;m modeling data relationships, designing interactive tools, or thinking through complex data models, I care about clarity, precision, and momentum. I&apos;ve worked across domains — from compensation planning to surf forecasting to game design — and bring a sharp eye to both product mechanics and user experience.
          </p>
          
          <p>
            Outside of work, I&apos;m a husband, a dad, a surfer, a skier, and an incurable tinkerer. I like to build things — digital and physical — and am usually chasing a better system, a smoother flow, or a smarter solution. If I&apos;m not sketching out a product idea, I&apos;m probably in the ocean or working on a side project with my daughter.
          </p>

          <p className="flex flex-col gap-1">
            <a href="/Levin_Resume.pdf" target="_blank" rel="noopener noreferrer" className="underline text-accent hover:text-accent/80">
              Resume (PDF)
            </a>
            <a href="https://www.linkedin.com/in/levinmedia/" target="_blank" rel="noopener noreferrer" className="underline text-accent hover:text-accent/80">
              LinkedIn
            </a>
          </p>
        </div>
      </section>

      {/* About this site Card (now second) */}
      <section className="bg-background border border-neutral-100/6 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-accent font-[family-name:var(--font-geist-mono)] mb-2">About this site</h2>
        </div>
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>
            Building and maintaining a portfolio site has always been at the absolute bottom of my list of things I&apos;m excited to spend time on. But... there&apos;s this new thing — I dunno if you&apos;ve heard of it — it&apos;s called AI, and it&apos;s kind of revolutionizing software development. 😏
          </p>
          <p>
            So this site is a bit of an experiment. It&apos;s the product of AI-assisted software development (distinctly different from &quot;vibe coding&quot;). I&apos;ve open-sourced the whole thing too, for anyone who wants a nifty little portfolio site to tinker with. Go ahead, take a peek under the hood. Heck, open an issue and tell me what I did wrong — or better yet, just make a PR and fix it!
          </p>
          <p>
            <a href="https://github.com/levinmedia/portfolio" target="_blank" rel="noopener noreferrer" className="underline text-accent hover:text-accent/80">https://github.com/levinmedia/portfolio</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <section className="pt-4 border-t border-neutral-100/6">
        <p className="text-sm text-foreground/60">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </section>
    </div>
  )
}

export default AboutContent
