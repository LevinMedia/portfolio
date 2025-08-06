'use client'

import Button from '../components/Button'
import { BriefcaseIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function WorkHistoryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border border-neutral-100/6 p-4 mb-4">
        <div className="flex items-center gap-4">
          <Button 
            style="ghost" 
            color="primary" 
            size="medium"
            iconLeft={<ArrowLeftIcon className="w-4 h-4" />}
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          <div className="flex items-center gap-2">
            <BriefcaseIcon className="w-6 h-6" />
            <h1 className="text-2xl font-semibold">Work History</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto space-y-8">
        {/* Current Role */}
        <section className="border border-neutral-100/6 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-primary">Principle Designer</h2>
              <p className="text-lg text-foreground/80">CaptivateIQ</p>
              <p className="text-sm text-foreground/60">May 2025 - Present · 4 mos</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground/60">Remote</p>
              <p className="text-sm text-foreground/60">Full-time</p>
            </div>
          </div>
          <p className="text-foreground/80 leading-relaxed">
            Designing system architecture for intuitive and scalable product experiences.
          </p>
        </section>

        {/* Previous Roles */}
        <section className="border border-neutral-100/6 p-6">
          <h3 className="text-lg font-semibold mb-4 text-accent">Previous Experience</h3>
          
          <div className="space-y-6">
            {/* Sr. Manager Product Design */}
            <div className="border-l-4 border-primary/20 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-medium">Sr. Manager Product Design</h4>
                  <p className="text-foreground/80">CaptivateIQ</p>
                  <p className="text-sm text-foreground/60">Jun 2023 - May 2025 · 2 yrs</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">Orange County, California</p>
                </div>
              </div>
            </div>

            {/* Head of Product Design */}
            <div className="border-l-4 border-secondary/20 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-medium">Head of Product Design</h4>
                  <p className="text-foreground/80">FloSports</p>
                  <p className="text-sm text-foreground/60">May 2022 - Jun 2023 · 1 yr 2 mos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">Orange County, California</p>
                </div>
              </div>
              <p className="text-foreground/80 leading-relaxed">
                Leading product design. Connecting people with the sports they love.
              </p>
            </div>

            {/* Product & Design Lead */}
            <div className="border-l-4 border-accent/20 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-medium">Product & Design Lead</h4>
                  <p className="text-foreground/80">Automattic (WooCommerce)</p>
                  <p className="text-sm text-foreground/60">May 2021 - May 2022 · 1 yr 1 mo</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">Orange County, California</p>
                </div>
              </div>
              <p className="text-foreground/80 leading-relaxed">
                Leading product and design for payment solutions at WooCommerce.
              </p>
            </div>

            {/* Product Design */}
            <div className="border-l-4 border-destructive/20 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-medium">Product Design</h4>
                  <p className="text-foreground/80">Automattic</p>
                  <p className="text-sm text-foreground/60">Feb 2018 - May 2021 · 3 yrs 4 mos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">Orange County, California</p>
                </div>
              </div>
            </div>

            {/* Director of UX and Design */}
            <div className="border-l-4 border-primary/20 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-medium">Director of UX and Design</h4>
                  <p className="text-foreground/80">ShareThis</p>
                  <p className="text-sm text-foreground/60">Sep 2016 - Jan 2018 · 1 yr 5 mos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">Issaquah, Washington</p>
                </div>
              </div>
              <p className="text-foreground/80 leading-relaxed">
                Vision + execution. Conceptualized and designed a platform of tools to help millions of digital publishers grow their audiences. Led the re-design of share button tools and associated plugins, resulting in a 200% improvement in new user registration, and reduced 24 hour churn from over 50% to less than 10%.
              </p>
            </div>

            {/* Design Director */}
            <div className="border-l-4 border-secondary/20 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-medium">Design Director</h4>
                  <p className="text-foreground/80">USA TODAY Sports Media Group</p>
                  <p className="text-sm text-foreground/60">Jan 2014 - Sep 2016 · 2 yrs 9 mos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">Issaquah, WA</p>
                </div>
              </div>
              <p className="text-foreground/80 leading-relaxed">
                Lead all design initiatives at USA TODAY Sports. Worked in conjunction with senior executives at USA TODAY and Gannett to develop and deliver digital product, advertising, and brand marketing solutions. Lead and managed a nationally distributed team of UX / UI designers, art directors and third party vendors. Managed USA TODAY Sports Creative Solutions, a full service in house creative agency producing print and digital advertising for clients of USA TODAY Sports.
              </p>
              <p className="text-foreground/80 leading-relaxed mt-2">
                Led an assessment and reorganization of a nationally distributed design team, resulting in dramatic improvement of group productivity, morale, and overall quality of output. Led design rollout of 16 website launches, or re-launches, between April 2014 and April 2015, including USA TODAY Ad Meter, USA TODAY Bracket Challenge, and the 2016 Olympics Experience. In 2015 the sites accounted for 18% of USA TODAY&apos;s digital advertising revenue.
              </p>
            </div>

            {/* Design Director - Sports Digital Properties */}
            <div className="border-l-4 border-accent/20 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-medium">Design Director - Sports Digital Properties</h4>
                  <p className="text-foreground/80">USA TODAY Sports Media Group</p>
                  <p className="text-sm text-foreground/60">Jan 2011 - Dec 2013 · 3 yrs</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">Los Angeles, CA</p>
                </div>
              </div>
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

            {/* Levin Media */}
            <div className="border-l-4 border-destructive/20 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-medium">Design Director</h4>
                  <p className="text-foreground/80">Levin Media · Self-employed</p>
                  <p className="text-sm text-foreground/60">Jan 2006 - Feb 2011 · 5 yrs 2 mos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">Self-employed</p>
                </div>
              </div>
              <p className="text-foreground/80 leading-relaxed">
                Specializing in all manner of design, digital product direction and design, photography, film, motion graphics and video production for primarily outdoor and action sports industry clients. Notable clients include Oakley, Red Bull, Storm Mountain Publishing, publishers of Freeskier and Snowboard Magazine, BNQT Media Group owned by USA TODAY Sports, Poor Boyz Productions, Exile Skimboards, Happy Magazine, and DaKine.
              </p>
            </div>

            {/* Art Director */}
            <div className="border-l-4 border-primary/20 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-medium">Art Director</h4>
                  <p className="text-foreground/80">Armada Skis</p>
                  <p className="text-sm text-foreground/60">Oct 2002 - Jan 2006 · 3 yrs 4 mos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">Costa Mesa, CA</p>
                </div>
              </div>
              <p className="text-foreground/80 leading-relaxed">
                Established the brand identity and creative direction for the most successful start up ski company in history. Responsible for all creative deliverables including hard goods graphics, soft goods graphics, and web development. Responsible for all sales and marketing materials including advertising, catalogs, posters, experiential trade show elements, and point of purchase graphics.
              </p>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="border border-neutral-100/6 p-6">
          <h3 className="text-lg font-semibold mb-4 text-accent">Areas of Expertise</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 text-primary">Product & Design</h4>
              <ul className="space-y-1 text-sm text-foreground/80">
                <li>Product Strategy & Architecture</li>
                <li>User Experience Design (UX)</li>
                <li>User Interface Design (UI)</li>
                <li>Design Systems & Component Libraries</li>
                <li>User Research & Testing</li>
                <li>Prototyping & Wireframing</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 text-secondary">Technical & Creative</h4>
              <ul className="space-y-1 text-sm text-foreground/80">
                <li>Figma, Sketch, Adobe Creative Suite</li>
                <li>HTML, CSS, JavaScript</li>
                <li>WordPress, Content Management</li>
                <li>Motion Graphics & Video Production</li>
                <li>Photography & Visual Design</li>
                <li>Brand Identity & Marketing</li>
              </ul>
            </div>
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="bg-black dark:bg-white p-4 mt-8 relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white dark:text-black">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <Button 
            style="outline" 
            color="primary" 
            size="medium"
            onClick={() => window.open('https://www.linkedin.com/in/levinmedia/details/experience/', '_blank')}
          >
            View on LinkedIn
          </Button>
        </div>
      </footer>
    </div>
  )
} 