import { describe, expect, it } from 'vitest'
import { DEFAULT_CATALOG_URL, resolveCatalogUrl, trustedCatalogUrl } from '../src/core/catalog-url.js'

describe('catalog origin', () => {
  it('accepts any https origin', () => {
    // The allowlist that used to be here existed to protect BUSINESSLENS_API_KEY.
    // Pulling is anonymous, so there is no secret to leak and anyone may run
    // their own catalog.
    expect(trustedCatalogUrl('https://businesslens.io')).toBe('https://businesslens.io')
    expect(trustedCatalogUrl('https://catalog.example.com')).toBe('https://catalog.example.com')
    expect(trustedCatalogUrl('https://mirror.example.com:8443')).toBe('https://mirror.example.com:8443')
  })

  it('accepts plaintext only on a loopback host', () => {
    expect(trustedCatalogUrl('http://localhost:3200')).toBe('http://localhost:3200')
    expect(trustedCatalogUrl('http://127.0.0.1:3200')).toBe('http://127.0.0.1:3200')
    expect(trustedCatalogUrl('http://[::1]:3200')).toBe('http://[::1]:3200')
    expect(() => trustedCatalogUrl('http://catalog.example.com')).toThrow(/must use https/)
  })

  it('rejects anything that is not a bare origin', () => {
    expect(() => trustedCatalogUrl('https://example.com/api')).toThrow(/bare origin/)
    expect(() => trustedCatalogUrl('https://example.com/?a=b')).toThrow(/bare origin/)
    expect(() => trustedCatalogUrl('https://example.com/#frag')).toThrow(/bare origin/)
    expect(() => trustedCatalogUrl('https://user:pass@example.com')).toThrow(/bare origin/)
    expect(() => trustedCatalogUrl('not a url')).toThrow(/not a valid catalog origin/)
  })

  it('resolves the flag first, then the environment, then the public catalog', () => {
    expect(resolveCatalogUrl(undefined, {})).toBe(DEFAULT_CATALOG_URL)
    expect(resolveCatalogUrl(undefined, { BUSINESSLENS_CATALOG_URL: 'https://env.example.com' }))
      .toBe('https://env.example.com')
    expect(resolveCatalogUrl('https://flag.example.com', { BUSINESSLENS_CATALOG_URL: 'https://env.example.com' }))
      .toBe('https://flag.example.com')
  })
})
