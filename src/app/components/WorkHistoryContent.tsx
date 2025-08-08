import React from 'react'
import Image from 'next/image'
import LevinMediaLogo from './LevinMediaLogo'

const WorkHistoryContent: React.FC = () => {
  return (
    <div>
      <div className="space-y-8">
        {/* CaptivateIQ */}
        <section className="bg-background border border-neutral-100/6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 relative flex-shrink-0 border border-neutral-200/20">
                <Image
                  src="/captivateiq_logo.jpeg"
                  alt="CaptivateIQ logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-accent font-[family-name:var(--font-geist-mono)]">CaptivateIQ</h2>
                <p className="text-sm text-foreground/50 mt-1">2023 - Present</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-foreground/60">Remote / Full-time</p>
            </div>
          </div>
          {/* XS employment type */}
          <div className="sm:hidden pl-4 text-sm text-foreground/60 mb-4">Remote / Full-time</div>
          
          <div className="space-y-6">
            {/* Principle Designer */}
            <div className="pl-4">
              <h3 className="text-lg font-medium text-foreground">Principle Designer</h3>
              <p className="text-sm text-foreground/60 mb-2">May 2025 - Present · 4 mos</p>
              <p className="text-foreground/80 leading-relaxed">
                Designing system architecture for intuitive and scalable product experiences.
              </p>
            </div>

            {/* Sr. Manager Product Design */}
            <div className="pl-4">
              <h3 className="text-lg font-medium text-foreground">Sr. Manager Product Design</h3>
              <p className="text-sm text-foreground/60 mb-2">Jun 2023 - May 2025 · 2 yrs</p>
              <p className="text-foreground/80 leading-relaxed">
                Leading product design initiatives and managing design team operations.
              </p>
            </div>
          </div>
        </section>

        {/* FloSports */}
        <section className="bg-background border border-neutral-100/6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 relative flex-shrink-0 border border-neutral-200/20">
                <Image
                  src="/flosports_logo.jpeg"
                  alt="FloSports logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary font-[family-name:var(--font-geist-mono)]">FloSports</h2>
                <p className="text-sm text-foreground/50 mt-1">2022 - 2023</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-foreground/60">Remote / Full-time</p>
            </div>
          </div>
          {/* XS employment type */}
          <div className="sm:hidden pl-4 text-sm text-foreground/60 mb-4">Remote / Full-time</div>
          
          <div className="space-y-6">
            {/* Head of Product Design */}
            <div className="pl-4">
              <h3 className="text-lg font-medium text-foreground">Head of Product Design</h3>
              <p className="text-sm text-foreground/60 mb-2">May 2022 - Jun 2023 · 1 yr 2 mos</p>
              <p className="text-foreground/80 leading-relaxed">
                Leading product design. Connecting people with the sports they love.
              </p>
            </div>
          </div>
        </section>

        {/* Automattic */}
        <section className="bg-background border border-neutral-100/6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 relative flex-shrink-0 border border-neutral-200/20">
                <Image
                  src="/automattic_logo.jpeg"
                  alt="Automattic logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary font-[family-name:var(--font-geist-mono)]">Automattic</h2>
                <p className="text-sm text-foreground/50 mt-1">2018 - 2022</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-foreground/60">Remote / Full-time</p>
            </div>
          </div>
          {/* XS employment type */}
          <div className="sm:hidden pl-4 text-sm text-foreground/60 mb-4">Remote / Full-time</div>
          
          <div className="space-y-6">
            {/* Product & Design Lead */}
            <div className="pl-4">
              <h3 className="text-lg font-medium text-foreground">Product & Design Lead (WooCommerce)</h3>
              <p className="text-sm text-foreground/60 mb-2">May 2021 - May 2022 · 1 yr 1 mo</p>
              <p className="text-foreground/80 leading-relaxed">
                Leading product and design for payment solutions at WooCommerce.
              </p>
            </div>

            {/* Product Design */}
            <div className="pl-4">
              <h3 className="text-lg font-medium text-foreground">Product Design</h3>
              <p className="text-sm text-foreground/60 mb-2">Feb 2018 - May 2021 · 3 yrs 4 mos</p>
              <p className="text-foreground/80 leading-relaxed">
                Designing product experiences across the WordPress ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* ShareThis */}
        <section className="bg-background border border-neutral-100/6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 relative flex-shrink-0 border border-neutral-200/20">
                <Image
                  src="/sharethis_logo.jpeg"
                  alt="ShareThis logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-destructive font-[family-name:var(--font-geist-mono)]">ShareThis</h2>
                <p className="text-sm text-foreground/50 mt-1">2016 - 2018</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-foreground/60">Remote / Full-time</p>
            </div>
          </div>
          {/* XS employment type */}
          <div className="sm:hidden pl-4 text-sm text-foreground/60 mb-4">Remote / Full-time</div>
          
          <div className="space-y-6">
            {/* Director of UX and Design */}
            <div className="pl-4">
              <h3 className="text-lg font-medium text-foreground">Director of UX and Design</h3>
              <p className="text-sm text-foreground/60 mb-2">Sep 2016 - Jan 2018 · 1 yr 5 mos</p>
              <p className="text-foreground/80 leading-relaxed">
                Vision + execution. Conceptualized and designed a platform of tools to help millions of digital publishers grow their audiences. Led the re-design of share button tools and associated plugins, resulting in a 200% improvement in new user registration, and reduced 24 hour churn from over 50% to less than 10%.
              </p>
            </div>
          </div>
        </section>

        {/* USA TODAY Sports */}
        <section className="bg-background border border-neutral-100/6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 relative flex-shrink-0 border border-neutral-200/20">
                <Image
                  src="/usatsportts_logo.jpeg"
                  alt="USA TODAY Sports logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-accent font-[family-name:var(--font-geist-mono)]">USA TODAY Sports</h2>
                <p className="text-sm text-foreground/50 mt-1">2011 - 2016</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-foreground/60">Hybrid / Full-time</p>
            </div>
          </div>
          {/* XS employment type */}
          <div className="sm:hidden pl-4 text-sm text-foreground/60 mb-4">Hybrid / Full-time</div>
          
          <div className="space-y-6">
            {/* Design Director */}
            <div className="pl-4">
              <h3 className="text-lg font-medium text-foreground">Design Director</h3>
              <p className="text-sm text-foreground/60 mb-2">Jan 2014 - Sep 2016 · 2 yrs 9 mos</p>
              <p className="text-foreground/80 leading-relaxed">
                Lead all design initiatives at USA TODAY Sports. Worked in conjunction with senior executives at USA TODAY and Gannett to develop and deliver digital product, advertising, and brand marketing solutions. Lead and managed a nationally distributed team of UX / UI designers, art directors and third party vendors. Managed USA TODAY Sports Creative Solutions, a full service in house creative agency producing print and digital advertising for clients of USA TODAY Sports.
              </p>
              <p className="text-foreground/80 leading-relaxed mt-2">
                Led an assessment and reorganization of a nationally distributed design team, resulting in dramatic improvement of group productivity, morale, and overall quality of output. Led design rollout of 16 website launches, or re-launches, between April 2014 and April 2015, including USA TODAY Ad Meter, USA TODAY Bracket Challenge, and the 2016 Olympics Experience. In 2015 the sites accounted for 18% of USA TODAY&apos;s digital advertising revenue.
              </p>
            </div>

            {/* Design Director - Sports Digital Properties */}
            <div className="pl-4">
              <h3 className="text-lg font-medium text-foreground">Design Director - Sports Digital Properties</h3>
              <p className="text-sm text-foreground/60 mb-2">Jan 2011 - Dec 2013 · 3 yrs</p>
              <p className="text-foreground/80 leading-relaxed">
                Responsible for all creative initiatives at USA TODAY Sports Digital Properties, a sports focused digital advertising network consisting of 12 USA TODAY owned and operated websites (including For The Win, The Big Lead, HoopsHype, and MMA Junkie) plus over 100 affiliate advertising partners. Assumed responsibility of digital product strategy and development in conjunction with Director of Engineering. Responsible for brand marketing of owned and operated properties.
              </p>
              <p className="text-foreground/80 leading-relaxed mt-2">
                Conceptualized and designed a highly customized, device responsive WordPress based publishing solution to consolidate the majority of owned and operated websites onto a single, shared CMS. (The platform is named Lawrence, after our friendly in-office caterer.) The consolidation slashed operational overhead, significantly reduced design and product development time, and radically improved user experiences for visitors and editors. The consolidation contributed to significant increases in revenue and audience.
              </p>
              <p className="text-foreground/80 leading-relaxed mt-2">
                Proposed and launched USA TODAY Sports Creative Solutions, an in-house, full service creative agency for advertising clients of USA TODAY Sports. Produced both print and digital advertising for clients such as Oakley, Under Armor, Asics, ESPN, NBC Sports, UFC, Harley Davidson, State Farm, Mountain Dew, Pacifico, and more.
              </p>
            </div>
          </div>
        </section>

        {/* Levin Media */}
        <section className="bg-background border border-neutral-100/6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 relative flex-shrink-0 border border-neutral-200/20">
                <LevinMediaLogo size={48} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary font-[family-name:var(--font-geist-mono)]">Levin Media</h2>
                <p className="text-sm text-foreground/50 mt-1">2006 - 2011</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-foreground/60">Self-employed / Freelance</p>
            </div>
          </div>
          {/* XS employment type */}
          <div className="sm:hidden pl-4 text-sm text-foreground/60 mb-4">Self-employed / Freelance</div>
          
          <div className="space-y-6">
            {/* Design Director */}
            <div className="pl-4">
              <h3 className="text-lg font-medium text-foreground">Design Director</h3>
              <p className="text-sm text-foreground/60 mb-2">Jan 2006 - Feb 2011 · 5 yrs 2 mos</p>
              <p className="text-foreground/80 leading-relaxed">
                Specializing in all manner of design, digital product direction and design, photography, film, motion graphics and video production for primarily outdoor and action sports industry clients. Notable clients include Oakley, Red Bull, Storm Mountain Publishing, publishers of Freeskier and Snowboard Magazine, BNQT Media Group owned by USA TODAY Sports, Poor Boyz Productions, Exile Skimboards, Happy Magazine, and DaKine.
              </p>
            </div>
          </div>
        </section>

        {/* Armada Skis */}
        <section className="bg-background border border-neutral-100/6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 relative flex-shrink-0 border border-neutral-200/20">
                <Image
                  src="/armada_logo.jpg"
                  alt="Armada Skis logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary font-[family-name:var(--font-geist-mono)]">Armada Skis</h2>
                <p className="text-sm text-foreground/50 mt-1">2002 - 2006</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-foreground/60">Costa Mesa, CA / Full-time</p>
            </div>
          </div>
          {/* XS employment type */}
          <div className="sm:hidden pl-4 text-sm text-foreground/60 mb-4">Costa Mesa, CA / Full-time</div>
          
          <div className="space-y-6">
            {/* Art Director */}
            <div className="pl-4">
              <h3 className="text-lg font-medium text-foreground">Art Director</h3>
              <p className="text-sm text-foreground/60 mb-2">Oct 2002 - Jan 2006 · 3 yrs 4 mos</p>
              <p className="text-foreground/80 leading-relaxed">
                Established the brand identity and creative direction for the most successful start up ski company in history. Responsible for all creative deliverables including hard goods graphics, soft goods graphics, and web development. Responsible for all sales and marketing materials including advertising, catalogs, posters, experiential trade show elements, and point of purchase graphics.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="pt-4 border-t border-neutral-100/6">
          <p className="text-sm text-foreground/60">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </section>
      </div>
    </div>
  )
}

export default WorkHistoryContent 