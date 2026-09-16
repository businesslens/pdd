import { describe, expect, it } from 'vitest'
import { localReferenceHref, referenceHref, referenceTrail } from '../layers/nuxt/report-viewer/app/utils/referenceNavigation.js'

describe('reference navigation boundaries', () => {
  it('preserves code locators and document fragments inside the local preview routes', () => {
    const code = referenceHref({ kind: 'code', role: 'implementation', target: 'src/main.ts#start:3-5' })
    expect(new URL(code, 'http://localhost').searchParams.get('target')).toBe('src/main.ts#start:3-5')
    expect(localReferenceHref(code)).toBe(code)
    expect(localReferenceHref('/_businesslens/file/docs/guide.md?raw=1#setup')).toBe('/_businesslens/file/docs/guide.md?raw=1#setup')
    expect(referenceHref({ kind: 'doc', role: 'context', target: 'docs/a guide.md' })).toBe('/_businesslens/file/docs/a%20guide.md')
  })
  it('refuses external, executable, report-data and escaped preview addresses', () => {
    for (const value of [null, {}, 'https://example.com/a.md', '//example.com/_businesslens/file/a.md', 'javascript:alert(1)', '/_businesslens/report.json', '/_businesslens/file/../report.json', '/_businesslens/file/%2e%2e/report.json', '/_businesslens/file/../../', '/_businesslens/code-other']) {
      expect(localReferenceHref(value), String(value)).toBeNull()
    }
    expect(referenceHref({ kind: 'doc', role: 'context', target: 'https://example.com/guide.md' })).toBe('https://example.com/guide.md')
  })
  it('restores only well-formed history visits and allows returning to the resource', () => {
    const valid = [{ href: null, position: 2 }, { href: '/_businesslens/file/docs/guide.md', position: 3 }]
    expect(referenceTrail([...valid, { href: 'https://example.com', position: 4 }, { href: null, position: '2' }, null])).toEqual(valid)
    expect(referenceTrail({})).toEqual([])
  })
})
