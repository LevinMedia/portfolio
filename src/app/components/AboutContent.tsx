import React from 'react'

const AboutContent: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* About this site Card (now first) */}
      <section className="bg-background border border-neutral-100/6 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-accent font-[family-name:var(--font-geist-mono)] mb-2">About this site</h2>
        </div>
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>
            Building and maintaining a portfolio site has always been at the absolute bottom of my list of things I&apos;m excited to spend time on. But... there’s this new thing — I dunno if you’ve heard of it — it’s called AI, and it’s kind of revolutionizing software development. 😏
          </p>
          <p>
            So this site is a bit of an experiment. It&apos;s the product of AI-assisted software development (distinctly different from “vibe coding”). I&apos;ve open-sourced the whole thing too, for anyone who wants a nifty little portfolio site to tinker with. Go ahead, take a peek under the hood. Heck, open an issue and tell me what I did wrong — or better yet, just make a PR and fix it!
          </p>
          <p>
            <a href="https://github.com/levinmedia/portfolio" target="_blank" rel="noopener noreferrer" className="underline text-accent hover:text-accent/80">https://github.com/levinmedia/portfolio</a>
          </p>
        </div>
      </section>

      {/* About David Card (now second) */}
      <section className="bg-background border border-neutral-100/6 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-accent font-[family-name:var(--font-geist-mono)] mb-2">About David</h2>
        </div>
        
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>
            David is a software architect with a designer&apos;s mindset and a builder&apos;s instinct. He specializes in designing complex, data-driven experiences that feel intuitive and efficient — especially in areas where the stakes are high, the logic is deep, and the edge cases matter.
          </p>
          
          <p>
            His work blends product strategy, UX architecture, and hands-on design execution. He&apos;s led cross-functional teams, built new products from the ground up, and helped scale existing systems without losing sight of the end user. Whether he&apos;s modeling data relationships, designing interactive tools, or thinking through complex data models, he cares about clarity, precision, and momentum. He&apos;s worked across domains — from compensation planning to surf forecasting to game design — and brings a sharp eye to both product mechanics and user experience.
          </p>
          
          <p>
            Outside of work, he&apos;s a husband, a dad, a surfer, a skier, and an incurable tinkerer. He likes to build things — digital and physical — and is usually chasing a better system, a smoother flow, or a smarter solution. If he&apos;s not sketching out a product idea, he&apos;s probably in the ocean or working on a side project with his daughter.
          </p>
          
          <p className="text-sm text-foreground/60 italic">
            And yes, this was absolutely written by AI, and edited lightly for style, context, and clarity.
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