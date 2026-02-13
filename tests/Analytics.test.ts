import { describe, it, expect, beforeEach } from 'vitest'
import { trackPageView, trackGamePlay } from '../src/pages/Analytics'

describe('Analytics tracking', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('tracks page views', () => {
    trackPageView('/home')
    trackPageView('/games')
    const events = JSON.parse(localStorage.getItem('analytics-events') || '[]')
    expect(events).toHaveLength(2)
    expect(events[0].type).toBe('pageview')
    expect(events[0].page).toBe('/home')
    expect(events[1].page).toBe('/games')
  })

  it('tracks game plays', () => {
    trackGamePlay('snake')
    const events = JSON.parse(localStorage.getItem('analytics-events') || '[]')
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('game')
    expect(events[0].page).toBe('snake')
  })

  it('includes timestamps', () => {
    const before = Date.now()
    trackPageView('/test')
    const events = JSON.parse(localStorage.getItem('analytics-events') || '[]')
    expect(events[0].timestamp).toBeGreaterThanOrEqual(before)
    expect(events[0].timestamp).toBeLessThanOrEqual(Date.now())
  })

  it('accumulates events', () => {
    for (let i = 0; i < 5; i++) {
      trackPageView(`/page${i}`)
    }
    const events = JSON.parse(localStorage.getItem('analytics-events') || '[]')
    expect(events).toHaveLength(5)
  })
})
