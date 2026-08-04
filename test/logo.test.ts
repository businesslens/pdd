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
      .toContain('logo.svg must not contain unsupported <script> elements')
    expect(validateProductLogo(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><s:script>alert(1)</s:script></svg>'
    )).toEqual(expect.arrayContaining([
      'logo.svg must use only unprefixed SVG elements',
      'logo.svg must not contain unsupported <s:script> elements',
      'logo.svg must not declare prefixed or non-SVG namespaces'
    ]))
    expect(validateProductLogo('<svg viewBox="0 0 1 1"><use href="https://example.com/a.svg#x"/></svg>'))
      .toContain('logo.svg must not contain external or escaped references')
    expect(validateProductLogo('<svg viewBox="0 0 1 1"><path style="fill:u\\72l(https://example.com/a)"/></svg>'))
      .toEqual(expect.arrayContaining([
        'logo.svg must not contain unsupported "style" attributes'
      ]))
    expect(validateProductLogo(new Uint8Array(MAX_PRODUCT_LOGO_BYTES + 1)))
      .toContain('logo.svg must be at most 256 KiB')
  })

  it('requires svg to be the document root and keeps references inside the document', () => {
    expect(validateProductLogo('<html><svg viewBox="0 0 1 1"></svg>'))
      .toContain('logo.svg must have an SVG root with a viewBox')
    expect(validateProductLogo('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><defs><linearGradient id="paint"><stop offset="0" stop-color="#fff"/></linearGradient></defs><path fill="url(#paint)" d="M0 0h1v1z"/></svg>'))
      .toEqual([])
    expect(validateProductLogo('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><use href="#shape"/><path id="shape" d="M0 0h1v1z"/></svg>'))
      .toEqual([])
  })
})
