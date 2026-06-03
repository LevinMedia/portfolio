'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { normalizeLiteralHtmlBreaksInMarkdown } from '@/lib/markdown-normalize'

interface MarkdownContentProps {
  children: string
  className?: string
}

export default function MarkdownContent({ children, className = '' }: MarkdownContentProps) {
  if (!children?.trim()) return null

  return (
    <div className={`c64-prose max-w-none ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children: c }) => <h1>{c}</h1>,
          h2: ({ children: c }) => <h2>{c}</h2>,
          h3: ({ children: c }) => <h3>{c}</h3>,
          h4: ({ children: c }) => <h4>{c}</h4>,
          h5: ({ children: c }) => <h5>{c}</h5>,
          h6: ({ children: c }) => <h6>{c}</h6>,
          p: ({ children: c }) => <p className="mb-3 last:mb-0">{c}</p>,
          ul: ({ children: c }) => (
            <ul className="mb-3 list-disc list-outside space-y-1.5 pl-6">{c}</ul>
          ),
          ol: ({ children: c }) => (
            <ol className="mb-3 list-decimal list-outside space-y-1.5 pl-6">{c}</ol>
          ),
          li: ({ children: c }) => <li className="pl-0.5">{c}</li>,
          strong: ({ children: c }) => <strong className="font-semibold">{c}</strong>,
          em: ({ children: c }) => <em className="italic">{c}</em>,
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {c}
            </a>
          ),
        }}
      >
        {normalizeLiteralHtmlBreaksInMarkdown(children)}
      </ReactMarkdown>
    </div>
  )
}
