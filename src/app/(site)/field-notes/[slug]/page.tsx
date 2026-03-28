'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import FieldNoteDetail from '@/app/components/FieldNoteDetail'
import Drawer from '@/app/components/Drawer'
import Navigation from '@/app/components/Navigation'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { usePageTitle } from '@/app/hooks/usePageTitle'

export default function FieldNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [noteTitle, setNoteTitle] = useState<string>('')
  const [isTitleVisible, setIsTitleVisible] = useState(true)

  // Update page title dynamically
  usePageTitle(noteTitle || 'Field Notes')

  const handleClose = () => {
    router.push('/?field-notes=true')
  }


  return (
    <div className="relative min-h-screen">
      <Drawer
        isOpen={true}
        onClose={handleClose}
        title={
          <>
            {/* Desktop: "Field notes / Title" pattern */}
            <span className="hidden md:inline">
              <span className="text-muted-foreground">Field notes</span>
              {noteTitle && (
                <span 
                  className="transition-opacity duration-300 ease-in-out"
                  style={{ 
                    opacity: isTitleVisible ? 0 : 1,
                    display: 'inline'
                  }}
                >
                  <span className="mx-2 text-muted-foreground">/</span>
                  <span>{noteTitle}</span>
                </span>
              )}
            </span>
            
            {/* Mobile: Show nothing until title scrolls into sticky state; when shown, use 16px */}
            {(!isTitleVisible && noteTitle) ? (
              <span className="md:hidden text-base" style={{ whiteSpace: 'nowrap' }}>{noteTitle}</span>
            ) : null}
          </>
        }
        icon={<DocumentTextIcon className="w-6 h-6" />}
        contentPadding="p-0"
        maxWidth=""
      >
        <div className="px-4">
          <FieldNoteDetail 
            slug={slug} 
            onTitleLoad={setNoteTitle}
            onTitleVisibilityChange={setIsTitleVisible}
          />
        </div>
      </Drawer>

      {/* Footer Navigation */}
      <Navigation />
    </div>
  )
}

