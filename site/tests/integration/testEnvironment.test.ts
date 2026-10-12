import { describe, expect, it } from 'vitest'
import { resolveTestPort } from '../support/environment'

describe('test server environment', () => {
  it('serves the browser suites on a fixed port clear of the dev server', () => {
    expect(resolveTestPort({})).toBe(4200)
    expect(resolveTestPort({ NUXT_PORT: '3271' })).toBe(4200)
  })

  it('uses the explicit test port when provided', () => {
    expect(resolveTestPort({ TEST_NUXT_PORT: '5180' })).toBe(5180)
  })

  it('rejects invalid port values', () => {
    expect(() => resolveTestPort({ TEST_NUXT_PORT: 'zero' })).toThrow('TEST_NUXT_PORT must contain a valid TCP port')
    expect(() => resolveTestPort({ TEST_NUXT_PORT: '70000' })).toThrow('TEST_NUXT_PORT must contain a valid TCP port')
  })
})
