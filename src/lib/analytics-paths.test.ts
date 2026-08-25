import { describe, expect, it } from 'vitest'
import {
  isExcludedFromStatsReporting,
  normalizeAnalyticsPathForDisplay,
} from './analytics-paths'

const workSlugs = new Set(['betterlist', 'designing-a-new-modeling-paradigm'])

describe('normalizeAnalyticsPathForDisplay', () => {
  it('keeps drawer and site paths', () => {
    expect(normalizeAnalyticsPathForDisplay('/work-history', workSlugs)).toBe('/work-history')
    expect(normalizeAnalyticsPathForDisplay('/selected-works', workSlugs)).toBe('/selected-works')
    expect(normalizeAnalyticsPathForDisplay('/about', workSlugs)).toBe('/about')
  })

  it('repairs incorrect selected-works prefixes from legacy normalization', () => {
    expect(normalizeAnalyticsPathForDisplay('/selected-works/work-history', workSlugs)).toBe(
      '/work-history',
    )
    expect(normalizeAnalyticsPathForDisplay('/selected-works/selected-works', workSlugs)).toBe(
      '/selected-works',
    )
    expect(normalizeAnalyticsPathForDisplay('/selected-works/about', workSlugs)).toBe('/about')
  })

  it('keeps real featured work detail paths', () => {
    expect(normalizeAnalyticsPathForDisplay('/selected-works/betterlist', workSlugs)).toBe(
      '/selected-works/betterlist',
    )
  })

  it('prefixes bare work slugs', () => {
    expect(normalizeAnalyticsPathForDisplay('betterlist', workSlugs)).toBe(
      '/selected-works/betterlist',
    )
  })
})

describe('isExcludedFromStatsReporting', () => {
  const publicSlugs = {
    workSlugs: new Set(['betterlist', 'woocommerce-analytics']),
    noteSlugs: new Set(['c64-homepage']),
  }

  it('excludes auth routes from top-pages stats', () => {
    expect(isExcludedFromStatsReporting('/sign-in', publicSlugs)).toBe(true)
    expect(isExcludedFromStatsReporting('/access', publicSlugs)).toBe(true)
    expect(isExcludedFromStatsReporting('/about', publicSlugs)).toBe(false)
    expect(isExcludedFromStatsReporting('/selected-works', publicSlugs)).toBe(false)
  })

  it('excludes private featured work and field notes from top-pages stats', () => {
    expect(isExcludedFromStatsReporting('/selected-works/secret-client', publicSlugs)).toBe(true)
    expect(isExcludedFromStatsReporting('/field-notes/hiring-notes', publicSlugs)).toBe(true)
    expect(isExcludedFromStatsReporting('secret-client', publicSlugs)).toBe(true)
    expect(isExcludedFromStatsReporting('/selected-works/betterlist', publicSlugs)).toBe(false)
    expect(isExcludedFromStatsReporting('/field-notes/c64-homepage', publicSlugs)).toBe(false)
    expect(isExcludedFromStatsReporting('/field-notes', publicSlugs)).toBe(false)
    expect(isExcludedFromStatsReporting('/selected-works', publicSlugs)).toBe(false)
  })

  it('excludes leftover old-site URLs from top-pages stats', () => {
    expect(isExcludedFromStatsReporting('/shop', publicSlugs)).toBe(true)
    expect(isExcludedFromStatsReporting('/fb', publicSlugs)).toBe(true)
    expect(isExcludedFromStatsReporting('/portfolio/sharethis-audience-builder', publicSlugs)).toBe(
      true,
    )
    expect(isExcludedFromStatsReporting('/portfolio/coastline-android-app', publicSlugs)).toBe(true)
    expect(isExcludedFromStatsReporting('/portfolio/woocommerce-analytics', publicSlugs)).toBe(true)
    expect(isExcludedFromStatsReporting('/selected-works/woocommerce-analytics', publicSlugs)).toBe(
      false,
    )
  })
})
