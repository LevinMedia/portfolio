import { getPortfolioCoverImagesServer } from '@/lib/portfolio-cover-images-server'
import AccessPageClient from '@/app/components/AccessPageClient'

export default async function AccessPage() {
  const coverImages = await getPortfolioCoverImagesServer()

  return <AccessPageClient coverImages={coverImages} />
}
