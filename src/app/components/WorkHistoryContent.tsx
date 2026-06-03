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

function getCompanyDateSpan(positions: WorkPosition[]): { start: Date; end: Date } | null {
  if (!positions.length) return null
  const starts = positions.map(p => parseDateOnly(p.start_date))
  const ends = positions.map(p => (p.end_date ? parseDateOnly(p.end_date) : new Date()))
  return {
    start: new Date(Math.min(...starts.map(d => d.getTime()))),
    end: new Date(Math.max(...ends.map(d => d.getTime()))),
  }
}

function humanizeDuration(start: Date, end: Date): string {
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (end.getDate() < start.getDate()) months -= 1
  months = Math.max(0, months)

  const years = Math.floor(months / 12)
  const remMonths = months % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`)
  if (remMonths > 0) parts.push(`${remMonths} ${remMonths === 1 ? 'month' : 'months'}`)
  if (!parts.length) return 'Less than 1 month'
  return parts.join(', ')
}

function formatCompanyDuration(positions: WorkPosition[]): string {
  const span = getCompanyDateSpan(positions)
  if (!span) return ''
  return humanizeDuration(span.start, span.end)
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
      {companies.map((company) => {
        const companyYears = formatCompanyYears(company.positions)
        const companyDuration = formatCompanyDuration(company.positions)

        return (
        <DrawerSection key={company.id} ariaLabel={company.company_name}>
          <div className={c64DrawerSectionHeaderClass}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 sm:gap-4">
                <div className="chrome-work-history-logo">
                  {company.company_name === 'Levin Media' ? (
                    <LevinMediaLogo size={48} fillBackground className="chrome-work-history-logo__mark" />
                  ) : company.company_logo_url ? (
                    <Image
                      src={company.company_logo_url}
                      alt={`${company.company_name} logo`}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--chrome-muted)]"
                      aria-hidden
                    >
                      {company.company_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 pt-0.5">
                  <h2 className={`${c64DrawerSectionHeadingClass} chrome-work-history-company-name`}>
                    {company.company_name}
                  </h2>
                  <p className={`${c64DrawerMetaClass} mt-0.5`}>
                    {companyYears}
                    {companyDuration ? (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span>{companyDuration}</span>
                      </>
                    ) : null}
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
          <div className="space-y-6 c64-prose c64-work-history-positions">
            {(company.positions ?? []).map((position) => (
              <div key={position.id} className="c64-work-history-position">
                <h3 className={c64DrawerEntryHeadingClass}>{position.position_title}</h3>
                <p className={`${c64DrawerMetaClass} c64-work-history-position-dates mb-2 mt-0.5`}>
                  {formatDateRange(position.start_date, position.end_date)}
                </p>
                {position.position_description && (
                  <MarkdownContent>{position.position_description}</MarkdownContent>
                )}
              </div>
            ))}
          </div>
        </DrawerSection>
        )
      })}
      <footer className={c64DrawerFooterClass}>
        <p className="m-0">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </footer>
    </div>
  )
}
