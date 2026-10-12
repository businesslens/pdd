import { describe, expect, it } from 'vitest'
import { resolveTestPort } from '../support/environment'

describe('test server environment', () => {
  it('offsets the test server from the worktree port', () => {
    expect(resolveTestPort({ NUXT_PORT: '3271' })).toBe(4271)
  })

  it('uses the explicit test port when provided', () => {
    expect(resolveTestPort({ NUXT_PORT: '3271', TEST_NUXT_PORT: '5180' })).toBe(5180)
  })

  it('keeps a previously resolved port stable across Playwright processes', () => {
    expect(resolveTestPort({ NUXT_PORT: '4271', PDD_KIT_TEST_PORT: '4271' })).toBe(4271)
  })

  it('rejects invalid port values', () => {
    expect(() => resolveTestPort({ NUXT_PORT: '70000' })).toThrow('NUXT_PORT must contain a valid TCP port')
    expect(() => resolveTestPort({ TEST_NUXT_PORT: 'zero' })).toThrow('TEST_NUXT_PORT must contain a valid TCP port')
  })
})
