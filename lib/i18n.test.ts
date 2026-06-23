import { describe, it, expect } from 'vitest'
import { getLang, T } from './i18n'

const params = (lang: string | null) => ({ get: (k: string) => (k === 'lang' ? lang : null) })

describe('getLang', () => {
  it('returns de / fr when explicitly requested', () => {
    expect(getLang(params('de'))).toBe('de')
    expect(getLang(params('fr'))).toBe('fr')
  })

  it('falls back to en for missing, unknown, or en', () => {
    expect(getLang(params(null))).toBe('en')
    expect(getLang(params('en'))).toBe('en')
    expect(getLang(params('es'))).toBe('en')
  })
})

describe('T (translations)', () => {
  it('exposes exactly en, de, fr', () => {
    expect(Object.keys(T).sort()).toEqual(['de', 'en', 'fr'])
  })

  it('every language defines the identical set of keys (guards against missing translations)', () => {
    const en = Object.keys(T.en).sort()
    expect(Object.keys(T.de).sort()).toEqual(en)
    expect(Object.keys(T.fr).sort()).toEqual(en)
  })

  it('welcome() interpolates the name in every language', () => {
    for (const lang of ['en', 'de', 'fr'] as const) {
      expect(T[lang].welcome('Maria')).toContain('Maria')
    }
  })
})
