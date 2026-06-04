import { Suspense } from 'react'
import HomePageClient from '@/app/components/HomePageClient'
import { getSelectedWorksServer } from '@/lib/selected-works-server'
import { getPortfolioCoverImagesServer } from '@/lib/portfolio-cover-images-server'

export default async function Home() {
  const [initialSelectedWorks, signInCoverImages] = await Promise.all([
    getSelectedWorksServer(),
    getPortfolioCoverImagesServer(),
  ])

  return (
    <Suspense fallback={null}>
      <HomePageClient
        initialSelectedWorks={initialSelectedWorks}
        signInCoverImages={signInCoverImages}
      />
    </Suspense>
  )
}
