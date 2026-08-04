import { describe, expect, it } from 'vitest'
import {
  MAX_PRODUCT_LOGO_BYTES,
  PRODUCT_LOGO_FILENAME,
  validateProductLogo
} from '../src/logo.js'

const valid = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M0 0h32v32H0z"/></svg>'

describe('Product logo contract', () => {
  it('has one fixed filename and accepts a self-contained scalable SVG', () => {
    expect(PRODUCT_LOGO_FILENAME).toBe('logo.svg')
    expect(validateProductLogo(valid)).toEqual([])
  })

  it('rejects active, remote, and oversized SVG content', () => {
    expect(validateProductLogo('<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>'))
      .toContain('logo.svg must not contain active or embedded content')
    expect(validateProductLogo('<svg viewBox="0 0 1 1"><use href="https://example.com/a.svg#x"/></svg>'))
      .toContain('logo.svg must not contain external references')
    expect(validateProductLogo(new Uint8Array(MAX_PRODUCT_LOGO_BYTES + 1)))
      .toContain('logo.svg must be at most 256 KiB')
  })

  it('requires svg to be the document root and permits only fragment CSS URLs', () => {
    expect(validateProductLogo('<html><svg viewBox="0 0 1 1"></svg>'))
      .toContain('logo.svg must have an SVG root with a viewBox')
    expect(validateProductLogo('<svg viewBox="0 0 1 1"><style>.a{fill:url("https://example.com/a")}</style></svg>'))
      .toContain('logo.svg must not contain external CSS URLs')
    expect(validateProductLogo('<svg viewBox="0 0 1 1"><style>.a{fill:url("#paint")}</style></svg>'))
      .toEqual([])
  })
})
