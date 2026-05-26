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
    <div className={`c64-prose max-w-none text-foreground leading-snug ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children: c }) => (
            <h1 className="mb-3 mt-4 text-xl font-bold">{c}</h1>
          ),
          h2: ({ children: c }) => (
            <h2 className="mb-3 mt-4 text-lg font-bold">{c}</h2>
          ),
          h3: ({ children: c }) => (
            <h3 className="mb-2 mt-3 text-base font-semibold">{c}</h3>
          ),
          h4: ({ children: c }) => (
            <h4 className="mb-2 mt-3 text-base font-semibold">{c}</h4>
          ),
          p: ({ children: c }) => <p className="mb-3 last:mb-0 text-foreground">{c}</p>,
          ul: ({ children: c }) => (
            <ul className="mb-3 list-disc list-outside space-y-2 pl-6">{c}</ul>
          ),
          ol: ({ children: c }) => (
            <ol className="mb-3 list-decimal list-outside space-y-2 pl-6">{c}</ol>
          ),
          li: ({ children: c }) => <li className="pl-1 text-foreground">{c}</li>,
          strong: ({ children: c }) => <strong className="font-semibold text-foreground">{c}</strong>,
          em: ({ children: c }) => <em className="italic">{c}</em>,
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
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
