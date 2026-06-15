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
  it('excludes auth routes from top-pages stats', () => {
    expect(isExcludedFromStatsReporting('/sign-in')).toBe(true)
    expect(isExcludedFromStatsReporting('/access')).toBe(true)
    expect(isExcludedFromStatsReporting('/about')).toBe(false)
    expect(isExcludedFromStatsReporting('/selected-works')).toBe(false)
  })
})
