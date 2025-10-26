'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import SelectedWorkDetail from '@/app/components/SelectedWorkDetail'
import Drawer from '@/app/components/Drawer'
import Navigation from '@/app/components/Navigation'
import { CommandLineIcon } from '@heroicons/react/24/outline'

export default function SelectedWorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [workTitle, setWorkTitle] = useState<string>('')
  const [isTitleVisible, setIsTitleVisible] = useState(true)

  const handleClose = () => {
    router.push('/?selected-works=true')
  }


  return (
    <div className="relative min-h-screen">
      <Drawer
        isOpen={true}
        onClose={handleClose}
        title={
          <>
            {/* Desktop: "Selected works / Title" pattern */}
            <span className="hidden md:inline">
              <span className="text-muted-foreground">Selected works</span>
              {workTitle && (
                <span 
                  className="transition-opacity duration-300 ease-in-out"
                  style={{ 
                    opacity: isTitleVisible ? 0 : 1,
                    display: 'inline'
                  }}
                >
                  <span className="mx-2 text-muted-foreground">/</span>
                  <span>{workTitle}</span>
                </span>
              )}
            </span>
            
            {/* Mobile: Show nothing until title scrolls into sticky state; when shown, use 16px */}
            {(!isTitleVisible && workTitle) ? (
              <span className="md:hidden text-base" style={{ whiteSpace: 'nowrap' }}>{workTitle}</span>
            ) : null}
          </>
        }
        icon={<CommandLineIcon className="w-6 h-6" />}
        contentPadding="p-0"
        maxWidth=""
      >
        <div className="px-4 pb-4">
          <SelectedWorkDetail 
            slug={slug} 
            onTitleLoad={setWorkTitle}
            onTitleVisibilityChange={setIsTitleVisible}
          />
        </div>
      </Drawer>

      {/* Footer Navigation */}
      <Navigation />
    </div>
  )
}

