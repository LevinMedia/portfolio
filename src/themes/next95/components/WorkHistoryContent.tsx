import React from 'react'
import Image from 'next/image'

const WorkHistoryContent: React.FC = () => {
  return (
    <div className="space-y-3">
      {/* CaptivateIQ */}
      <section className="bg-white border-2 border-[#808080] p-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 relative flex-shrink-0 border-2 border-[#000]">
            <Image
              src="/captivateiq_logo.jpeg"
              alt="CaptivateIQ logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#111]">CaptivateIQ</h2>
            <p className="text-xs text-[#666]">2023 - Present · Remote / Full-time</p>
          </div>
        </div>
        
        <div className="space-y-3 pl-3">
          {/* Principle Designer */}
          <div className="border-l-4 border-[#0000ff] pl-3">
            <h3 className="text-sm font-bold text-[#111]">Principle Designer</h3>
            <p className="text-xs text-[#666] mb-1">May 2025 - Present · 4 mos</p>
            <p className="text-sm text-[#111] leading-relaxed">
              Designing system architecture for intuitive and scalable product experiences.
            </p>
          </div>

          {/* Sr. Manager Product Design */}
          <div className="border-l-4 border-[#0000ff] pl-3">
            <h3 className="text-sm font-bold text-[#111]">Sr. Manager Product Design</h3>
            <p className="text-xs text-[#666] mb-1">Jun 2023 - May 2025 · 2 yrs</p>
            <p className="text-sm text-[#111] leading-relaxed">
              Leading product design initiatives and managing design team operations.
            </p>
          </div>
        </div>
      </section>

      {/* FloSports */}
      <section className="bg-white border-2 border-[#808080] p-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 relative flex-shrink-0 border-2 border-[#000]">
            <Image
              src="/flosports_logo.jpeg"
              alt="FloSports logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#111]">FloSports</h2>
            <p className="text-xs text-[#666]">2022 - 2023 · Remote / Full-time</p>
          </div>
        </div>
        
        <div className="space-y-3 pl-3">
          {/* Head of Product Design */}
          <div className="border-l-4 border-[#0000ff] pl-3">
            <h3 className="text-sm font-bold text-[#111]">Head of Product Design</h3>
            <p className="text-xs text-[#666] mb-1">May 2022 - Jun 2023 · 1 yr 2 mos</p>
            <p className="text-sm text-[#111] leading-relaxed">
              Leading product design. Connecting people with the sports they love.
            </p>
          </div>
        </div>
      </section>

      {/* Automattic */}
      <section className="bg-white border-2 border-[#808080] p-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 relative flex-shrink-0 border-2 border-[#000]">
            <Image
              src="/automattic_logo.jpeg"
              alt="Automattic logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#111]">Automattic</h2>
            <p className="text-xs text-[#666]">2018 - 2022 · Remote / Full-time</p>
          </div>
        </div>
        
        <div className="space-y-3 pl-3">
          {/* Design Lead */}
          <div className="border-l-4 border-[#0000ff] pl-3">
            <h3 className="text-sm font-bold text-[#111]">Design Lead, WooCommerce</h3>
            <p className="text-xs text-[#666] mb-1">May 2021 - May 2022 · 1 yr 1 mo</p>
            <p className="text-sm text-[#111] leading-relaxed">
              Leading design for WooCommerce Payments and core commerce experiences.
            </p>
          </div>

          {/* Product Designer */}
          <div className="border-l-4 border-[#0000ff] pl-3">
            <h3 className="text-sm font-bold text-[#111]">Product Designer, WooCommerce</h3>
            <p className="text-xs text-[#666] mb-1">Jan 2018 - May 2021 · 3 yrs 5 mos</p>
            <p className="text-sm text-[#111] leading-relaxed">
              Designing merchant experiences for WooCommerce platform and extensions.
            </p>
          </div>
        </div>
      </section>

      {/* ShareThis */}
      <section className="bg-white border-2 border-[#808080] p-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 relative flex-shrink-0 border-2 border-[#000]">
            <Image
              src="/sharethis_logo.jpeg"
              alt="ShareThis logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#111]">ShareThis</h2>
            <p className="text-xs text-[#666]">2016 - 2017 · Palo Alto, CA / Full-time</p>
          </div>
        </div>
        
        <div className="space-y-3 pl-3">
          {/* Product Designer */}
          <div className="border-l-4 border-[#0000ff] pl-3">
            <h3 className="text-sm font-bold text-[#111]">Product Designer</h3>
            <p className="text-xs text-[#666] mb-1">Nov 2016 - Dec 2017 · 1 yr 2 mos</p>
            <p className="text-sm text-[#111] leading-relaxed">
              Designing social sharing tools and analytics platforms.
            </p>
          </div>
        </div>
      </section>

      {/* LevinMedia */}
      <section className="bg-white border-2 border-[#808080] p-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 relative flex-shrink-0 border-2 border-[#000] bg-white flex items-center justify-center">
            <span className="text-2xl font-bold text-[#111]">LM</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#111]">LevinMedia</h2>
            <p className="text-xs text-[#666]">2012 - 2016 · Los Angeles, CA / Self-employed</p>
          </div>
        </div>
        
        <div className="space-y-3 pl-3">
          {/* Freelance Designer */}
          <div className="border-l-4 border-[#0000ff] pl-3">
            <h3 className="text-sm font-bold text-[#111]">Freelance Designer & Developer</h3>
            <p className="text-xs text-[#666] mb-1">Jan 2012 - Nov 2016 · 4 yrs 11 mos</p>
            <p className="text-sm text-[#111] leading-relaxed">
              Building websites and digital experiences for clients across various industries.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default WorkHistoryContent

