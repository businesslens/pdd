import { describe, expect, it } from 'vitest'
import { trustedPlatformUrl } from '../src/core/platform-url.js'

describe('trusted platform URLs', () => {
  it('accepts the official platform origin', () => {
    expect(trustedPlatformUrl('https://app.businesslens.io/')).toBe('https://app.businesslens.io')
    expect(trustedPlatformUrl('https://app.businesslens.io:443')).toBe('https://app.businesslens.io')
  })

  it('accepts HTTP and custom ports only on loopback development hosts', () => {
    expect(trustedPlatformUrl('http://localhost:3000')).toBe('http://localhost:3000')
    expect(trustedPlatformUrl('http://127.0.0.42:8787')).toBe('http://127.0.0.42:8787')
    expect(trustedPlatformUrl('http://[::1]:4000')).toBe('http://[::1]:4000')
  })

  it('rejects remote, ambiguous, and non-origin URLs', () => {
    for (const value of [
      'https://attacker.example',
      'http://app.businesslens.io',
      'http://localhost.attacker.example',
      'https://app.businesslens.io/api',
      'https://app.businesslens.io?next=evil',
      'https://user:pass@app.businesslens.io'
    ]) {
      expect(() => trustedPlatformUrl(value)).toThrow()
    }
  })
})
