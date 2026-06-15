'use client'

import { useRouter } from 'next/navigation'
import type { PortfolioCoverImage } from '@/lib/portfolio-cover-images-server'
import Drawer from '@/app/components/Drawer'
import AccessContent from '@/app/components/AccessContent'

type AccessPageClientProps = {
  coverImages: PortfolioCoverImage[]
}

export default function AccessPageClient({ coverImages }: AccessPageClientProps) {
  const router = useRouter()

  const goHome = () => {
    router.push('/')
  }

  return (
    <div className="chrome-standalone-page relative min-h-screen min-h-[100dvh] bg-[var(--chrome-bg-solid,#f5f5f7)]">
      <Drawer
        isOpen={true}
        onClose={goHome}
        breadcrumbs={[
          { label: 'Home', onClick: goHome },
          { label: 'Sign in', current: true },
        ]}
        contentPadding="p-0"
        maxWidth="max-w-none"
      >
        <AccessContent coverImages={coverImages} />
      </Drawer>
    </div>
  )
}
