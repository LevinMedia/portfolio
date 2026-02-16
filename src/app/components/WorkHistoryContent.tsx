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

function formatDateRange(start: string, end?: string | null): string {
  const startDate = new Date(start)
  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const endStr = end
    ? new Date(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Present'
  return `${startStr} - ${endStr}`
}

function formatCompanyYears(positions: WorkPosition[]): string {
  if (!positions.length) return ''
  const starts = positions.map(p => new Date(p.start_date).getFullYear())
  const ends = positions
    .map(p => (p.end_date ? new Date(p.end_date).getFullYear() : new Date().getFullYear()))
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

  const accentClasses = [
    'text-accent',
    'text-secondary',
    'text-primary',
    'text-destructive',
    'text-accent',
    'text-primary',
    'text-secondary',
  ]

  return (
    <div>
      <div className="space-y-8">
        {companies.map((company, index) => (
          <section
            key={company.id}
            className="bg-background border border-neutral-100/6 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 relative flex-shrink-0 border border-neutral-200/20">
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
                  <h2
                    className={`text-xl font-semibold font-[family-name:var(--font-geist-mono)] mb-2 ${accentClasses[index % accentClasses.length]}`}
                  >
                    {company.company_name}
                  </h2>
                  <p className="text-sm text-foreground/50 mt-1">
                    {formatCompanyYears(company.positions)}
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm text-foreground/60">
                  {company.employment_type || '—'}
                </p>
              </div>
            </div>
            {company.employment_type && (
              <div className="sm:hidden pl-4 text-sm text-foreground/60 mb-4">
                {company.employment_type}
              </div>
            )}
            <div className="space-y-6">
              {(company.positions ?? []).map((position) => (
                <div key={position.id} className="pl-4">
                  <h3 className="text-lg font-medium text-foreground">
                    {position.position_title}
                  </h3>
                  <p className="text-sm text-foreground/60 mb-2">
                    {formatDateRange(position.start_date, position.end_date)}
                  </p>
                  {position.position_description && (
                    <p className="text-foreground/80 leading-relaxed">
                      {position.position_description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
        <section className="pt-4 border-t border-neutral-100/6">
          <p className="text-sm text-foreground/60">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </section>
      </div>
    </div>
  )
}
