'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import LevinMediaLogo from './LevinMediaLogo'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-foreground/60">
        Loading work history…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        {error}
      </div>
    )
  }

  if (!companies.length) {
    return (
      <div className="py-8 text-center text-foreground/60">
        No work history to show yet.
      </div>
    )
  }

  const boxClass =
    'border-4 border-[var(--c64-accent)] bg-[var(--c64-screen-bg)] c64-petscii-frame c64-screen-grid'

  return (
    <div className="c64-work-history-content c64-drawer-copy">
      <div className="space-y-6 sm:space-y-8">
        {companies.map((company) => (
          <section
            key={company.id}
            className={`${boxClass} p-5 sm:p-7`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 relative flex-shrink-0 border-2 border-[var(--c64-accent)] bg-[var(--c64-border-bg)]/40 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]">
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
                      className="w-full h-full flex items-center justify-center text-lg font-semibold text-foreground/70 bg-muted/50"
                      aria-hidden
                    >
                      {company.company_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-[0.08em] text-[var(--c64-accent)] mb-2 border-b-4 border-[var(--c64-accent)] pb-2">
                    {company.company_name}
                  </h2>
                  <p className="text-sm text-foreground/65 mt-1">
                    {formatCompanyYears(company.positions)}
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-foreground/70 uppercase tracking-wide">
                  {company.employment_type || '—'}
                </p>
              </div>
            </div>
            {company.employment_type && (
              <div className="sm:hidden pl-1 text-foreground/70 mb-4 uppercase tracking-wide">
                {company.employment_type}
              </div>
            )}
            <div className="space-y-6 c64-prose">
              {(company.positions ?? []).map((position) => (
                <div key={position.id} className="pl-1 sm:pl-2 border-l-4 border-[var(--c64-accent)]/35">
                  <h3 className="text-lg font-semibold text-foreground">
                    {position.position_title}
                  </h3>
                  <p className="text-foreground/65 mb-2">
                    {formatDateRange(position.start_date, position.end_date)}
                  </p>
                  {position.position_description && (
                    <p className="text-foreground/85 leading-snug">
                      {position.position_description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
        <footer className="border-t-4 border-[var(--c64-accent)]/35 pt-4 uppercase tracking-wider text-[var(--c64-accent)]/85">
          <p className="m-0 text-[var(--foreground)]/70">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </footer>
      </div>
    </div>
  )
}
