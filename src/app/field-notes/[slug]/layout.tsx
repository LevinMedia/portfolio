import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getFieldNoteBySlug } from './data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://levinmedia.com'

function sanitizeDescription(content: string | null | undefined) {
  if (!content) return 'Field note'
  const stripped = content
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links text
    .replace(/[#>*_`~\-]+/g, ' ') // markdown tokens
    .replace(/\s+/g, ' ')
    .trim()

  return stripped.slice(0, 180) || 'Field note'
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const note = await getFieldNoteBySlug(slug)

  if (!note) {
    return {
      title: 'Field note',
      description: 'Field note not found'
    }
  }

  const description = sanitizeDescription(note.content)
  const ogImageUrl = `${siteUrl}/field-notes/${slug}/opengraph-image`
  const canonicalUrl = `${siteUrl}/field-notes/${slug}`

  return {
    title: note.title,
    description,
    openGraph: {
      title: note.title,
      description,
      url: canonicalUrl,
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: note.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: note.title,
      description,
      images: [ogImageUrl]
    }
  }
}

export default function FieldNoteLayout({ children }: { children: ReactNode }) {
  return children
}

