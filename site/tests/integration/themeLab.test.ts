import { describe, expect, it } from 'vitest'
import { themeLabChoice, themeLabEnabled } from '../../app/utils/themeLab'

describe('theme lab availability', () => {
  it('requires both an explicit configuration and a loopback host', () => {
    expect(themeLabEnabled(true, 'localhost')).toBe(true)
    expect(themeLabEnabled(true, 'preview.localhost')).toBe(true)
    expect(themeLabEnabled(true, '127.0.0.1')).toBe(true)
    expect(themeLabEnabled(true, '[::1]')).toBe(true)

    expect(themeLabEnabled(false, 'localhost')).toBe(false)
    expect(themeLabEnabled(undefined, 'localhost')).toBe(false)
    expect(themeLabEnabled(true, 'pdd-kit.dev')).toBe(false)
    expect(themeLabEnabled(true, 'pdd-kit.dev.evil.example')).toBe(false)
  })

  it('forces defaults when the lab is unavailable', () => {
    expect(themeLabChoice(false, 'audition', 'default')).toBe('default')
    expect(themeLabChoice(true, 'audition', 'default')).toBe('audition')
    expect(themeLabChoice(true, undefined, 'default')).toBe('default')
  })
})
