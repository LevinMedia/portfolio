import React from 'react'
import Image from 'next/image'

const boxClass =
  'border-4 border-[var(--c64-accent)] bg-[var(--c64-screen-bg)] c64-petscii-frame c64-screen-grid'

/** Full-width hero; taller box on md+ so desktop shows more of the portrait (object-cover). */
const aboutHeroHeightClass =
  'h-[calc(50dvh-6.5rem)] max-[480px]:h-[calc(50dvh-6rem)] md:h-[calc(58dvh-7rem)] lg:h-[calc(60dvh-7.5rem)]'

const AboutContent: React.FC = () => {
  return (
    <div className="c64-about-content c64-drawer-copy space-y-6 sm:space-y-8 pb-24 pt-0">
      <figure
        className={`relative mx-auto w-full max-w-full shrink-0 overflow-hidden ${aboutHeroHeightClass}`}
      >
        <Image
          src="/levin-about.png"
          alt="Portrait of David Levin"
          fill
          className="object-cover object-top"
          sizes="(max-width: 42rem) 100vw, 42rem"
          priority
        />
      </figure>

      <section
        className={`${boxClass} p-5 sm:p-7`}
        aria-labelledby="about-david-heading"
      >
        <h2
          id="about-david-heading"
          className="text-lg sm:text-xl font-bold uppercase tracking-[0.12em] text-[var(--c64-accent)] mb-5 border-b-4 border-[var(--c64-accent)] pb-3"
        >
          About David
        </h2>

        <div className="c64-prose space-y-4 leading-snug text-foreground">
          <p>
            I specialize in designing complex, data-driven experiences that feel intuitive and
            efficient — especially in areas where the stakes are high, the logic is deep, and the
            edge cases matter.
          </p>

          <p>
            My work blends product strategy, UX architecture, and hands-on design execution.
            I&apos;ve led cross-functional teams, built new products from the ground up, and helped
            scale existing systems without losing sight of the end user. I&apos;ve built software
            that empowers the planning and execution of business models, surf forecasting,
            e-commerce, good old fashioned sports-ball content, and more. Whether I&apos;m modeling
            data relationships, designing interactive tools, or thinking through complex data models,
            I care about clarity, precision, and momentum.
          </p>

          <p>
            Outside of work, I&apos;m a husband, a dad, a surfer, a skier, and an incurable
            tinkerer. I like to build things — digital and physical — and am usually chasing a
            better system, a smoother flow, or a smarter solution. If I&apos;m not sketching out a
            product idea, I&apos;m probably in the ocean or working on a side project with my
            daughter.
          </p>

          <div className="flex flex-col gap-2 pt-1">
            <a
              href="/Levin_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--c64-accent)] underline underline-offset-[3px]"
            >
              Resume (PDF)
            </a>
            <a
              href="https://www.linkedin.com/in/levinmedia/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--c64-accent)] underline underline-offset-[3px]"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </section>

      <section
        className={`${boxClass} p-5 sm:p-7`}
        aria-labelledby="about-site-heading"
      >
        <h2
          id="about-site-heading"
          className="text-lg sm:text-xl font-bold uppercase tracking-[0.12em] text-[var(--c64-accent)] mb-5 border-b-4 border-[var(--c64-accent)] pb-3"
        >
          About this site
        </h2>
        <div className="c64-prose space-y-4 leading-snug text-foreground">
          <p>
            Building and maintaining a portfolio site has always been at the absolute bottom of my
            list of things I&apos;m excited to spend time on. But... there&apos;s this new thing —
            I dunno if you&apos;ve heard of it — it&apos;s called AI, and it&apos;s kind of
            revolutionizing software development. 😏
          </p>
          <p>
            So this site is a bit of an experiment. It&apos;s the product of AI-assisted software
            development (distinctly different from &quot;vibe coding&quot;). I&apos;ve open-sourced
            the whole thing too, so go ahead, take a peek under the hood. Heck, open an issue and
            tell me what I did wrong — or better yet, just make a PR and fix it!
          </p>
          <p>
            <a
              href="https://github.com/levinmedia/portfolio"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://github.com/levinmedia/portfolio
            </a>
          </p>
        </div>
      </section>

      <footer className="border-t-4 border-[var(--c64-accent)]/35 pt-4 uppercase tracking-wider text-[var(--c64-accent)]/85 bg-[var(--c64-screen-bg)]/90">
        <p className="m-0">
          <span className="text-[var(--foreground)]/70">Last update:</span>{' '}
          {new Date().toLocaleDateString()}
        </p>
      </footer>
    </div>
  )
}

export default AboutContent
