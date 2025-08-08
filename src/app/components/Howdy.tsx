'use client'

import Image from 'next/image'
import Tooltip from './Tooltip'
import { CommandLineIcon } from '@heroicons/react/24/outline'
import Button from './Button'
import ButtonTooltip from './ButtonTooltip'
import { useEffect, useState } from 'react'

interface HowdyData {
  image_src: string
  image_alt: string
  greeting: string
  li_1: string | null
  li_2: string | null
}

interface HowdyProps {
  onSelectedWorksClick?: () => void
}

export default function Howdy({ onSelectedWorksClick }: HowdyProps) {
  const [data, setData] = useState<HowdyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHowdyData() {
      try {
        console.log('Fetching howdy data from API...')
        
        const response = await fetch('/api/howdy')
        const result = await response.json()

        console.log('API response:', result)

        if (!response.ok) {
          console.error('API error:', result.error)
          setError(`Failed to load content: ${result.error}`)
          return
        }

        if (!result) {
          console.error('No data returned from API')
          setError('No content available')
          return
        }

        console.log('Setting data:', result)
        setData(result)
      } catch (err) {
        console.error('Error fetching howdy data:', err)
        setError(`Failed to load content: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchHowdyData()
  }, [])

  if (loading) {
    return (
      <div className="row-start-2 col-span-6 flex flex-col lg:flex-row items-center lg:items-start" style={{ gap: 'var(--grid-major)' }}>
        <div className="w-full text-center text-foreground/60">
          Loading...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="row-start-2 col-span-6 flex flex-col lg:flex-row items-center lg:items-start" style={{ gap: 'var(--grid-major)' }}>
        <div className="w-full text-center text-foreground/60">
          {error || 'No content available'}
        </div>
      </div>
    )
  }

  // Convert database fields to component format
  const listItems: { emoji: string; text: string }[] = []
  if (data.li_1) {
    const [emoji, ...textParts] = data.li_1.split(' ')
    listItems.push({
      emoji: emoji || '•',
      text: textParts.join(' ')
    })
  }
  if (data.li_2) {
    const [emoji, ...textParts] = data.li_2.split(' ')
    listItems.push({
      emoji: emoji || '•',
      text: textParts.join(' ')
    })
  }

  return (
    <div className="row-start-2 col-span-6 flex flex-col lg:flex-row items-center lg:items-start" style={{ gap: 'var(--grid-major)' }}>
      {/* Image Box */}
      <Tooltip 
        codeGenerator={() => {
          return `<img 
  src="${data.image_src}" 
  alt="${data.image_alt}"
  className="w-full h-full object-cover"
/>`
        }} 
        borderRadius={0}
        showBorder={true}
        borderColor="stroke-accent"
      >
        <div 
          className="relative border border-blue-200/15 rounded-none lg:flex-shrink-0 mx-auto lg:mx-0 image-container" 
          style={{ 
            padding: 'var(--grid-major)'
          }}
        >
          <Image 
            src={data.image_src} 
            alt={data.image_alt}
            fill
            className="object-cover"
            priority
          />
        </div>
      </Tooltip>

      <main className="relative flex flex-col items-center sm:items-start border border-blue-200/15 rounded-none w-full lg:flex-grow" style={{ gap: 'var(--grid-major)', padding: 'var(--grid-major)' }}>
        <Tooltip 
          codeGenerator={() => {
            return `<div className="w-full text-2xl sm:text-5xl font-extrabold tracking-wide text-foreground font-[family-name:var(--font-geist-mono)] border border-blue-200/10 rounded-none" style={{ padding: 'var(--grid-major)' }}>
  ${data.greeting}
</div>`
          }} 
          borderRadius={0}
          showBorder={true}
          borderColor="stroke-accent"
          fullWidth={true}
        >
          <div className="w-full text-2xl sm:text-5xl font-extrabold tracking-wide text-foreground font-[family-name:var(--font-geist-mono)] border border-blue-200/10 rounded-none" style={{ padding: 'var(--grid-major)' }}>
            {data.greeting}
          </div>
        </Tooltip>
        
        <Tooltip 
          codeGenerator={() => {
            const listItemsHtml = listItems.map((item, index) => {
              const marginBottom = index < listItems.length - 1 ? 'var(--grid-major)' : '0'
              return `  <li className="tracking-[-.01em] flex items-start gap-2" style={{ marginBottom: '${marginBottom}' }}>
    <span className="text-lg">${item.emoji}</span>
    <span>${item.text}</span>
  </li>`
            }).join('\n')
            
            return `<ul className="w-full list-none text-xs sm:text-sm/6 text-left font-[family-name:var(--font-geist-mono)] border border-blue-200/10 rounded-none" style={{ padding: 'var(--grid-major)' }}>
${listItemsHtml}
</ul>`
          }} 
          borderRadius={0}
          showBorder={true}
          borderColor="stroke-accent"
          fullWidth={true}
        >
          <ul className="w-full list-none text-xs sm:text-sm/6 text-left font-[family-name:var(--font-geist-mono)] border border-blue-200/10 rounded-none" style={{ padding: 'var(--grid-major)' }}>
            {listItems.map((item, index) => (
              <li 
                key={index}
                className="tracking-[-.01em] flex items-start gap-2" 
                style={{ marginBottom: index < listItems.length - 1 ? 'var(--grid-major)' : '0' }}
              >
                <span className="text-lg">{item.emoji}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </Tooltip>

        <div className="w-full flex items-stretch flex-row border border-blue-200/15 rounded-none" style={{ gap: 'var(--grid-major)', padding: 'var(--grid-major)' }}>
          <ButtonTooltip>
            <Button
              style="solid"
              color="primary"
              size="small"
              className="sm:h-10 sm:px-4 sm:text-sm"
              iconLeft={<CommandLineIcon className="w-5 h-5" />}
              onClick={onSelectedWorksClick}
            >
              View selected work
            </Button>
          </ButtonTooltip>
          <ButtonTooltip>
            <Button
              style="outline"
              color="primary"
              size="small"
              className="sm:h-10 sm:px-4 sm:text-sm"
            >
              Site settings
            </Button>
          </ButtonTooltip>
        </div>
      </main>
    </div>
  )
}
