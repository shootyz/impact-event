import { describe, it, expect, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { checkAdminAuth } from './auth'

const PW = 'super-secret-test-password-1234567890'

// Minimal NextRequest stand-in — checkAdminAuth only reads req.headers.get().
function req(opts: { auth?: string; ip?: string } = {}): NextRequest {
  return {
    headers: {
      get(key: string) {
        const k = key.toLowerCase()
        if (k === 'authorization') return opts.auth ?? null
        if (k === 'x-forwarded-for') return opts.ip ?? null
        return null
      },
    },
  } as unknown as NextRequest
}

describe('checkAdminAuth', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = PW
  })

  it('accepts the correct password via the Bearer header', () => {
    expect(checkAdminAuth(req({ auth: `Bearer ${PW}`, ip: 'auth-ok-1' }))).toBe('ok')
  })

  it('accepts the correct password via body.adminPassword', () => {
    expect(checkAdminAuth(req({ ip: 'auth-ok-2' }), { adminPassword: PW })).toBe('ok')
  })

  it('accepts the correct password via body.password', () => {
    expect(checkAdminAuth(req({ ip: 'auth-ok-3' }), { password: PW })).toBe('ok')
  })

  it('rejects a wrong password', () => {
    expect(checkAdminAuth(req({ auth: 'Bearer wrong-password-same-len-padxxxxx', ip: 'auth-bad-1' }))).toBe('unauthorized')
  })

  it('rejects a password of a different length (timing-safe length guard)', () => {
    expect(checkAdminAuth(req({ auth: 'Bearer short', ip: 'auth-bad-2' }))).toBe('unauthorized')
  })

  it('rejects when no password is supplied at all', () => {
    expect(checkAdminAuth(req({ ip: 'auth-bad-3' }))).toBe('unauthorized')
  })

  it('rejects when ADMIN_PASSWORD is not configured', () => {
    delete process.env.ADMIN_PASSWORD
    expect(checkAdminAuth(req({ auth: `Bearer ${PW}`, ip: 'auth-noenv' }))).toBe('unauthorized')
  })

  it('rate-limits after too many attempts from one IP', () => {
    let result = ''
    for (let i = 0; i < 25; i++) {
      result = checkAdminAuth(req({ auth: 'Bearer x', ip: 'auth-rate-limited-ip' }))
    }
    expect(result).toBe('rate_limited')
  })
})
