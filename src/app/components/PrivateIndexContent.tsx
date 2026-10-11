'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import DetailContentBody from './DetailContentBody'
import { useDrawerHeroTitleVisibility } from '@/app/hooks/useDrawerHeroTitleVisibility'

interface PrivateIndexContentProps {
  title: string
  content: string
  onTitleVisibilityChange?: (isVisible: boolean) => void
}

/** Password-access Index page: the featured work / field note template without a feature image. */
export default function PrivateIndexContent({
  title,
  content,
  onTitleVisibilityChange,
}: PrivateIndexContentProps) {
  const router = useRouter()
  const titleRef = useRef<HTMLHeadingElement>(null)

  useDrawerHeroTitleVisibility(titleRef, onTitleVisibilityChange, true)

  return (
    <div className="c64-drawer-copy">
      <div className="chrome-detail-hero chrome-detail-hero--text -mx-4">
        <div className="chrome-detail-hero__caption">
          <h1 ref={titleRef} className="chrome-detail-hero__title">
            {title}
          </h1>
        </div>
      </div>

      <DetailContentBody
        content={content}
        onInternalNavigate={(href) => router.push(href, { scroll: false })}
      />
    </div>
  )
}
