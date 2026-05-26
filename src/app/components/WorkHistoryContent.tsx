'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import LevinMediaLogo from './LevinMediaLogo'
import MarkdownContent from './MarkdownContent'
import DrawerSection from './DrawerSection'
import { C64LoadingScreen, useC64LoaderVisible } from './C64SpriteLoader'
import {
  c64DrawerEntryHeadingClass,
  c64DrawerFooterClass,
  c64DrawerMetaClass,
  c64DrawerSectionHeaderClass,
  c64DrawerSectionHeadingClass,
  c64DrawerStackClass,
} from '@/lib/c64-drawer-classes'

interface WorkPosition {
  id: string
  position_title: string
  position_description?: string
  start_date: string
  end_date?: string
  position_order: number
}

interface WorkCompany {
  id: string
  company_name: string
  company_logo_url?: string
  employment_type?: string
  display_order: number
  positions: WorkPosition[]
}

/** Parse YYYY-MM-DD (or ISO with time) as local date to avoid UTC shift in display. */
function parseDateOnly(isoDate: string): Date {
  const parts = isoDate.split('-')
  if (parts.length < 3) return new Date(isoDate)
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return new Date(isoDate)
  return new Date(y, m, d)
}

function formatDateRange(start: string, end?: string | null): string {
  const startStr = parseDateOnly(start).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
  const endStr = end
    ? parseDateOnly(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Present'
  return `${startStr} - ${endStr}`
}

function formatCompanyYears(positions: WorkPosition[]): string {
  if (!positions.length) return ''
  const starts = positions.map(p => parseDateOnly(p.start_date).getFullYear())
  const ends = positions
    .map(p => (p.end_date ? parseDateOnly(p.end_date).getFullYear() : new Date().getFullYear()))
  const min = Math.min(...starts)
  const max = Math.max(...ends)
  return min === max ? `${min}` : `${min} - ${max}`
}

export default function WorkHistoryContent() {
  const [companies, setCompanies] = useState<WorkCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/work-history')
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || res.statusText)
        }
        const data = await res.json()
        if (!cancelled) setCompanies(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load work history')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const showLoader = useC64LoaderVisible(loading)
  if (showLoader) {
    return <C64LoadingScreen label="Loading work history" />
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    )
  }

  if (!companies.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No work history to show yet.
      </div>
    )
  }

  return (
    <div className={`c64-work-history-content c64-drawer-copy ${c64DrawerStackClass}`}>
      {companies.map((company) => (
        <DrawerSection key={company.id} ariaLabel={company.company_name}>
          <div className={c64DrawerSectionHeaderClass}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 relative flex-shrink-0 border-2 border-[var(--c64-accent)] bg-[var(--c64-border-bg)]/40">
                  {company.company_name === 'Levin Media' ? (
                    <LevinMediaLogo size={48} />
                  ) : company.company_logo_url ? (
                    <Image
                      src={company.company_logo_url}
                      alt={`${company.company_name} logo`}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-lg font-semibold text-muted-foreground bg-muted/50"
                      aria-hidden
                    >
                      {company.company_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className={c64DrawerSectionHeadingClass}>{company.company_name}</h2>
                  <p className={`${c64DrawerMetaClass} mt-1`}>
                    {formatCompanyYears(company.positions)}
                  </p>
                </div>
              </div>
              <p className={`${c64DrawerMetaClass} text-right hidden sm:block shrink-0`}>
                {company.employment_type || '—'}
              </p>
            </div>
          </div>
          {company.employment_type && (
            <p className={`${c64DrawerMetaClass} sm:hidden mb-4`}>
              {company.employment_type}
            </p>
          )}
          <div className="space-y-6 c64-prose">
            {(company.positions ?? []).map((position) => (
              <div key={position.id} className="border-l-2 border-[var(--c64-accent)]/20 pl-4 sm:pl-5">
                <h3 className={c64DrawerEntryHeadingClass}>{position.position_title}</h3>
                <p className={`${c64DrawerMetaClass} mb-2 mt-1`}>
                  {formatDateRange(position.start_date, position.end_date)}
                </p>
                {position.position_description && (
                  <MarkdownContent>{position.position_description}</MarkdownContent>
                )}
              </div>
            ))}
          </div>
        </DrawerSection>
      ))}
      <footer className={c64DrawerFooterClass}>
        <p className="m-0">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </footer>
    </div>
  )
}
