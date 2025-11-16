'use client'

import Image from 'next/image'
import Tooltip from './Tooltip'
import { CommandLineIcon, CogIcon } from '@heroicons/react/24/outline'
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
  onSiteSettingsClick?: () => void
}

export default function Howdy({ onSelectedWorksClick, onSiteSettingsClick }: HowdyProps) {
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
          {/* Loading skeleton - invisible but maintains layout */}
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
    <div className="row-start-2 col-span-6 flex flex-col items-center justify-center" style={{ gap: 'calc(var(--grid-major) * 2)' }}>
      
      {/* Horizontal Split Layout */}
      <div className="w-full sm:w-fit border border-blue-200/15 rounded-none backdrop-blur-sm p-8 sm:p-12 lg:p-16 xl:p-20">
        <div className="flex flex-col items-start text-left" style={{ gap: 'calc(var(--grid-major) * 1.5)' }}>
          {/* Heading with inline profile image */}
          <Tooltip 
            codeGenerator={() => {
              return `<h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-geist-mono)] flex items-center gap-4">
  <Image src="[profile-image-url]" alt="${data.image_alt}" width={60} height={60} className="object-cover rounded-full" priority />
  ${data.greeting}
</h1>`
            }} 
            borderRadius={0}
            showBorder={true}
            borderColor="stroke-accent"
            fullWidth={true}
          >
            <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-geist-mono)] flex items-center gap-6" style={{ wordSpacing: '-0.15em' }}>
              <Tooltip 
                codeGenerator={() => {
                  return `<Image 
  src="[profile-image-url]" 
  alt="${data.image_alt}"
  width={60}
  height={60}
  className="object-cover rounded-full"
  priority
/>`
                }} 
                borderRadius={9999}
                showBorder={true}
                borderColor="stroke-accent"
              >
                <div className="relative w-[3rem] h-[3rem] sm:w-[3.75rem] sm:h-[3.75rem] rounded-full overflow-hidden border-2 border-accent/30 flex-shrink-0">
                  <Image src={data.image_src} alt={data.image_alt} fill className="object-cover" priority />
                </div>
              </Tooltip>
              <span>{data.greeting}</span>
            </h1>
          </Tooltip>
            
            <Tooltip 
              codeGenerator={() => {
                const listItemsHtml = listItems.map((item) => {
                  return `  <li className="flex items-center lg:items-start gap-2 text-base sm:text-lg">
    <span className="text-xl">${item.emoji}</span>
    <span>${item.text}</span>
  </li>`
                }).join('\n')
                
                return `<ul className="list-none text-foreground/80 font-[family-name:var(--font-geist-sans)] flex flex-col">
${listItemsHtml}
</ul>`
              }} 
              borderRadius={0}
              showBorder={true}
              borderColor="stroke-accent"
              fullWidth={true}
            >
              <ul className="list-none text-foreground/80 font-[family-name:var(--font-geist-sans)] flex flex-col" style={{ gap: 'calc(var(--grid-major) / 2)' }}>
                {listItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm sm:text-lg">
                    <span className="text-xl">{item.emoji}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </Tooltip>
            
          <div className="flex flex-col sm:flex-row items-stretch w-full" style={{ gap: 'var(--grid-major)', marginTop: 'calc(var(--grid-major) * 0.5)' }}>
            <div className="w-full">
              <ButtonTooltip fullWidth>
                <Button style="solid" color="primary" size="medium" fullWidth iconLeft={<CommandLineIcon className="w-5 h-5" />} onClick={onSelectedWorksClick}>
                  View selected work
                </Button>
              </ButtonTooltip>
            </div>
            <div className="w-full">
              <ButtonTooltip fullWidth>
                <Button style="outline" color="primary" size="medium" fullWidth iconLeft={<CogIcon className="w-5 h-5" />} onClick={onSiteSettingsClick}>
                  Site settings
                </Button>
              </ButtonTooltip>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
