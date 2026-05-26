import type { ReactNode } from 'react'
import {
  c64DrawerCardClass,
  c64DrawerSectionHeadingClass,
} from '@/lib/c64-drawer-classes'

type DrawerSectionProps = {
  title?: string
  titleId?: string
  headingLevel?: 'h2' | 'h3'
  children: ReactNode
  className?: string
  compact?: boolean
  ariaLabel?: string
}

export default function DrawerSection({
  title,
  titleId,
  headingLevel: Heading = 'h2',
  children,
  className = '',
  compact = false,
  ariaLabel,
}: DrawerSectionProps) {
  const cardClass = compact
    ? `${c64DrawerCardClass} c64-drawer-card--compact`
    : c64DrawerCardClass

  return (
    <section
      className={`${cardClass}${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
      aria-labelledby={title ? titleId : undefined}
    >
      {title && (
        <Heading id={titleId} className={c64DrawerSectionHeadingClass}>
          {title}
        </Heading>
      )}
      {children}
    </section>
  )
}
