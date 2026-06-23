import { describe, it, expect, vi } from 'vitest'
import { rateLimit } from './rate-limit'

// Unique IP per test so the shared in-memory map doesn't leak state between tests.
const ip = (label: string) => `${label}-${Math.random().toString(36).slice(2)}`

describe('rateLimit', () => {
  it('allows requests up to the max within the window', () => {
    const k = ip('allow')
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(k, { max: 5, windowMs: 60_000 })).toBe(true)
    }
  })

  it('blocks the request that exceeds the max', () => {
    const k = ip('block')
    for (let i = 0; i < 3; i++) rateLimit(k, { max: 3, windowMs: 60_000 })
    expect(rateLimit(k, { max: 3, windowMs: 60_000 })).toBe(false)
  })

  it('tracks IPs independently', () => {
    const a = ip('a')
    const b = ip('b')
    expect(rateLimit(a, { max: 1, windowMs: 60_000 })).toBe(true)
    expect(rateLimit(a, { max: 1, windowMs: 60_000 })).toBe(false)
    // b has its own budget
    expect(rateLimit(b, { max: 1, windowMs: 60_000 })).toBe(true)
  })

  it('allows again once the window has passed', () => {
    vi.useFakeTimers()
    try {
      const k = ip('reset')
      expect(rateLimit(k, { max: 1, windowMs: 1000 })).toBe(true)
      expect(rateLimit(k, { max: 1, windowMs: 1000 })).toBe(false)
      vi.advanceTimersByTime(1500) // move past the window
      expect(rateLimit(k, { max: 1, windowMs: 1000 })).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
