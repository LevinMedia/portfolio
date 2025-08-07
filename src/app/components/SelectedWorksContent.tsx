import React from 'react'
import Image from 'next/image'

const SelectedWorksContent: React.FC = () => {
  return (
    <div>
      {/* Grid of work samples - each item spans 2 grid columns, gaps between columns */}
      <div className="grid grid-cols-6" style={{ gap: 'var(--grid-major)' }}>
                  {/* Analytics */}
        <div className="relative border border-blue-200/15 rounded-none col-span-2" style={{ padding: 'var(--grid-major)' }}>
          <div className="relative aspect-square overflow-hidden cursor-pointer">
            <Image 
              src="/Analytics.jpg" 
              alt="WooCommerce Analytics"
              fill
              className="object-cover hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h3 className="text-white text-sm font-medium font-[family-name:var(--font-geist-mono)] text-center px-2 bg-black/50 rounded-sm">WooCommerce Analytics</h3>
            </div>
          </div>
        </div>

        {/* Color Gradients */}
        <div className="relative border border-blue-200/15 rounded-none col-span-2" style={{ padding: 'var(--grid-major)' }}>
          <div className="relative aspect-square overflow-hidden cursor-pointer">
            <Image 
              src="/gradientsthumb.jpg" 
              alt="Accessible Color Palettes"
              fill
              className="object-cover hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h3 className="text-white text-sm font-medium font-[family-name:var(--font-geist-mono)] text-center px-2 bg-black/50 rounded-sm">Accessible Color Palettes</h3>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="relative border border-blue-200/15 rounded-none col-span-2" style={{ padding: 'var(--grid-major)' }}>
          <div className="relative aspect-square overflow-hidden cursor-pointer">
            <Image 
              src="/buttons_preview.jpg" 
              alt="ShareThis Share Buttons"
              fill
              className="object-cover hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h3 className="text-white text-sm font-medium font-[family-name:var(--font-geist-mono)] text-center px-2 bg-black/50 rounded-sm">ShareThis Share Buttons</h3>
            </div>
          </div>
        </div>

        {/* Audience Builder */}
        <div className="relative border border-blue-200/15 rounded-none col-span-2" style={{ padding: 'var(--grid-major)' }}>
          <div className="relative aspect-square overflow-hidden cursor-pointer">
            <Image 
              src="/AudienceThumb.jpg" 
              alt="ShareThis Audience Builder"
              fill
              className="object-cover hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h3 className="text-white text-sm font-medium font-[family-name:var(--font-geist-mono)] text-center px-2 bg-black/50 rounded-sm">ShareThis Audience Builder</h3>
            </div>
          </div>
        </div>
              </div>
    </div>
  )
}

export default SelectedWorksContent 