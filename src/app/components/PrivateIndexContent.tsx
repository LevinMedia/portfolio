'use client'

import { useRouter } from 'next/navigation'
import DetailContentBody from './DetailContentBody'

interface PrivateIndexContentProps {
  content: string
}

/** Password-access Index page: the featured work / field note template without a feature image. */
export default function PrivateIndexContent({ content }: PrivateIndexContentProps) {
  const router = useRouter()

  return (
    <div className="c64-drawer-copy">
      <DetailContentBody
        content={content}
        onInternalNavigate={(href) => router.push(href, { scroll: false })}
      />
    </div>
  )
}
