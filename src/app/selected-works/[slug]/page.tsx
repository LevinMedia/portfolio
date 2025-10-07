'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import SelectedWorkDetail from '@/app/components/SelectedWorkDetail'
import Drawer from '@/app/components/Drawer'
import { CommandLineIcon } from '@heroicons/react/24/outline'

export default function SelectedWorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const handleClose = () => {
    router.push('/?selected-works=true')
  }

  return (
    <Drawer
      isOpen={true}
      onClose={handleClose}
      title="Selected work"
      icon={<CommandLineIcon className="w-6 h-6" />}
      contentPadding="p-0"
      maxWidth=""
    >
      <div className="px-4 pb-4">
        <SelectedWorkDetail slug={slug} />
      </div>
    </Drawer>
  )
}

