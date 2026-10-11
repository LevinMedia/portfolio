'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FieldNoteDetail from '@/app/components/FieldNoteDetail'
import Drawer from '@/app/components/Drawer'
import Navigation from '@/app/components/Navigation'
import { usePageTitle } from '@/app/hooks/usePageTitle'
import { useStandaloneDrawer } from '@/app/components/PrivateIndexProvider'

/** Legacy bottom bar; off on full-bleed note pages for now. Flip to true to restore. */
const SHOW_LEGACY_FOOTER_NAV = false

export default function FieldNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const { isOpen, indexOpen, getReturnHref, leaveTo } = useStandaloneDrawer()
  const [noteTitle, setNoteTitle] = useState<string>('')
  const [isTitleVisible, setIsTitleVisible] = useState(true)

  // Update page title dynamically
  usePageTitle(noteTitle || 'Field Notes')

  useEffect(() => {
    setNoteTitle('')
    setIsTitleVisible(true)
  }, [slug])

  const goToList = () => {
    router.push('/?field-notes=true')
  }

  /** Opened from a password-access Index: close back to it (or to whichever home drawer led here). */
  const handleClose = () => {
    if (indexOpen) leaveTo(getReturnHref())
    else goToList()
  }

  const goHome = () => {
    leaveTo('/')
  }

  return (
    <div className="chrome-standalone-page relative min-h-screen min-h-[100dvh] bg-[var(--chrome-bg-solid,#f5f5f7)]">
      <Drawer
        isOpen={isOpen}
        onClose={handleClose}
        breadcrumbs={[
          { label: 'Home', onClick: goHome },
          { label: 'Field notes', onClick: goToList },
          {
            label: noteTitle,
            current: true,
            visible: !!noteTitle && !isTitleVisible,
          },
        ]}
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

      {SHOW_LEGACY_FOOTER_NAV ? <Navigation /> : null}
    </div>
  )
}

