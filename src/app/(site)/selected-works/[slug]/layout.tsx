import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getSelectedWorkBySlug } from './data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://levinmedia.com'

function sanitizeDescription(content: string | null | undefined) {
  if (!content) return 'Selected work'
  const stripped = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return stripped.slice(0, 180) || 'Selected work'
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const work = await getSelectedWorkBySlug(slug)

  if (!work) {
    return {
      title: 'Selected work',
      description: 'Selected work not found'
    }
  }

  const description = sanitizeDescription(work.content)
  const ogImageUrl = `${siteUrl}/selected-works/${slug}/opengraph-image`
  const canonicalUrl = `${siteUrl}/selected-works/${slug}`

  return {
    title: work.title,
    description,
    openGraph: {
      title: work.title,
      description,
      url: canonicalUrl,
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: work.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: work.title,
      description,
      images: [ogImageUrl]
    }
  }
}

export default function SelectedWorkLayout({ children }: { children: ReactNode }) {
  return children
}
