'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SelectedWorkDetail from '@/app/components/SelectedWorkDetail'
import Drawer from '@/app/components/Drawer'
import Navigation from '@/app/components/Navigation'
import { usePageTitle } from '@/app/hooks/usePageTitle'

/** Legacy bottom bar; off on full-bleed work pages for now. Flip to true to restore. */
const SHOW_LEGACY_FOOTER_NAV = false

export default function SelectedWorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [workTitle, setWorkTitle] = useState<string>('')
  const [isTitleVisible, setIsTitleVisible] = useState(true)

  // Update page title dynamically
  usePageTitle(workTitle || 'Featured Work')

  useEffect(() => {
    setWorkTitle('')
    setIsTitleVisible(true)
  }, [slug])

  const handleClose = () => {
    router.push('/?selected-works=true')
  }

  const goHome = () => {
    router.push('/')
  }

  return (
    <div className="chrome-standalone-page relative min-h-screen min-h-[100dvh] bg-[var(--chrome-bg-solid,#f5f5f7)]">
      <Drawer
        isOpen={true}
        onClose={handleClose}
        breadcrumbs={[
          { label: 'Home', onClick: goHome },
          { label: 'Featured work', onClick: handleClose },
          {
            label: workTitle,
            current: true,
            visible: !!workTitle && !isTitleVisible,
          },
        ]}
        contentPadding="p-0"
        maxWidth=""
      >
        <div className="px-4">
          <SelectedWorkDetail 
            slug={slug} 
            onTitleLoad={setWorkTitle}
            onTitleVisibilityChange={setIsTitleVisible}
          />
        </div>
      </Drawer>

      {SHOW_LEGACY_FOOTER_NAV ? <Navigation /> : null}
    </div>
  )
}

