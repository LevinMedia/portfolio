import { Suspense } from 'react'
import HomePageClient from './components/HomePageClient'
import { getSelectedWorksServer } from '@/lib/selected-works-server'

export default async function Home() {
  const initialSelectedWorks = await getSelectedWorksServer()

  return (
    <Suspense fallback={null}>
      <HomePageClient initialSelectedWorks={initialSelectedWorks} />
    </Suspense>
  )
}
