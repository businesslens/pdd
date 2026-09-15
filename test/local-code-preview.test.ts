import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ElementNode, Node } from 'comark'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import { localCodePreview } from '../src/core/local-code-preview.js'
import { startLocalViewer, type LocalViewer } from '../src/core/local-viewer-server.js'

const fixture = compileReport(loadModel(join(import.meta.dirname, 'fixtures/fixture-shop')), '2026-09-15')
const directories: string[] = []
const viewers: LocalViewer[] = []
afterEach(async () => {
  await Promise.all(viewers.splice(0).map(viewer => viewer.close()))
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})
function setup(target = 'src/main.ts#target', source = 'const targeted = 0;\nexport function target() {}\nconst html = "<script>globalThis.pwned = true</script>";\n') {
  const root = mkdtempSync(join(tmpdir(), 'blr-code-preview-'))
  directories.push(root)
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'src/main.ts'), source)
  const report = structuredClone(fixture)
  report.references = [{ kind: 'code', role: 'implementation', target, title: 'Named <source>' }]
  return { root, report, source }
}
function elements(nodes: Node[]): ElementNode[] {
  return nodes.flatMap(node => typeof node === 'string' || node[0] === null ? [] : [node, ...elements(node.slice(2) as Node[])])
}
async function reading(report: typeof fixture, root: string, target = report.references[0]!.target) {
  const preview = await localCodePreview(report, root, target)
  expect(preview.status).toBe(200)
  if (!('document' in preview.data)) throw new Error(preview.data.message)
  return { ...preview.data, elements: elements(preview.data.document.nodes) }
}
const codeUrl = (target: string) => '/_businesslens/code?target=' + encodeURIComponent(target)

describe('local code previews', () => {
  it('colors syntax in both themes, preserves exact source and targets complete symbol matches', async () => {
    const { root, report, source } = setup()
    const preview = await reading(report, root)
    expect(preview.elements.filter(node => node[1].class === 'line highlight').map(node => node[1].id)).toEqual(['L2'])
    expect(preview.details).toBe('3 lines · First text match for target.')
    expect(preview.elements.find(node => node[0] === 'pre')![1].code).toBe(source)
    expect(preview.elements.map(node => node[0])).not.toContain('script')
    const tokens = preview.elements.filter(node => node[0] === 'span' && node[1].style)
    expect(new Set(tokens.map(node => (node[1].style as Record<string, string>)['--shiki-light'])).size).toBeGreaterThan(2)
    expect(tokens.every(node => (node[1].style as Record<string, string>)['--shiki-dark'])).toBe(true)
    expect(preview.elements.some(node => node[1].id === 'L4')).toBe(false)
  })

  it('uses authored line ranges ahead of symbols and retains line anchors', async () => {
    const { root, report } = setup('src/main.ts#target:2-3', 'target\r\nsecond\r\nthird\r\nfourth\r\n')
    const preview = await reading(report, root)
    expect(preview.elements.filter(node => node[1].class === 'line highlight').map(node => node[1].id)).toEqual(['L2', 'L3'])
    expect(preview.elements.find(node => node[1].id === 'L2')?.slice(2)).toContainEqual(['span', { id: 'reference' }])
    expect(preview.elements.filter(node => node[0] === 'a').map(node => node[1].href)).toEqual(['#L1', '#L2', '#L3', '#L4'])
    expect(preview.details).toBe('4 lines · Lines 2–3.')
  })

  it('explains unmatched locators and supports qualified symbols and file-only targets', async () => {
    const { root, report } = setup()
    for (const [target, message] of [
      ['src/main.ts#Service.target', 'First text match for Service.target.'],
      ['src/main.ts#missing', 'No text match for missing in this file.'],
      ['src/main.ts:500', 'The requested line is outside this file.'],
      ['src/main.ts:2-500', 'The range extends beyond this file.'],
      ['src/main.ts#...', 'No text match for ... in this file.'],
      ['src/main.ts', '3 lines']
    ] as const) {
      report.references[0]!.target = target
      const preview = await reading(report, root)
      expect(preview.details).toContain(message)
      expect(preview.elements.some(node => node[1].id === 'reference')).toBe(true)
    }
  })

  it('requires an exact current workspace Code Reference and a configured repository', async () => {
    const { root, report } = setup()
    expect((await localCodePreview(report, root, 'src/main.ts')).status).toBe(404)
    expect((await localCodePreview(report, root, 'src/main.ts#different')).status).toBe(404)
    expect((await localCodePreview(report, undefined, 'src/main.ts#target')).status).toBe(404)
    expect((await localCodePreview(undefined, root, 'src/main.ts#target')).status).toBe(404)
    report.referenceProfile = 'portable'
    expect((await localCodePreview(report, root, 'src/main.ts#target')).status).toBe(404)
    report.referenceProfile = 'workspace'
    report.references[0]!.kind = 'doc'
    expect((await localCodePreview(report, root, 'src/main.ts#target')).status).toBe(404)
  })

  it('refuses undeclared files, traversal, symlinks, binaries, oversized files and missing files', async () => {
    const { root, report } = setup()
    const outside = mkdtempSync(join(tmpdir(), 'blr-code-outside-'))
    directories.push(outside)
    writeFileSync(join(outside, 'secret.ts'), 'secret source')
    writeFileSync(join(root, 'src/private.ts'), 'undeclared source')
    writeFileSync(join(root, 'src/binary.ts'), Buffer.from([0, 1, 2]))
    writeFileSync(join(root, 'src/invalid.ts'), Buffer.from([0xc3, 0x28]))
    writeFileSync(join(root, 'src/large.ts'), Buffer.alloc(2 * 1024 * 1024 + 1, 65))
    symlinkSync(join(outside, 'secret.ts'), join(root, 'src/link.ts'))
    symlinkSync(outside, join(root, 'src/linked-directory'), 'dir')
    expect((await localCodePreview(report, root, 'src/private.ts')).status).toBe(404)
    for (const target of ['../secret.ts', join(outside, 'secret.ts'), 'src/link.ts', 'src/linked-directory/secret.ts', 'src/binary.ts', 'src/invalid.ts', 'src/large.ts', 'src/missing.ts', 'src']) {
      report.references[0]!.target = target
      const preview = await localCodePreview(report, root, target)
      expect(preview.status, target).toBe(404)
      expect(JSON.stringify(preview)).not.toContain('secret source')
    }
  })

  it('serves GET and HEAD data, routes direct browser visits into the app and revokes removed targets', async () => {
    const { root, report } = setup()
    let current = report
    const viewer = await startLocalViewer({ compile: () => current, viewerRoot: root, assetRoot: root })
    viewers.push(viewer)
    const url = new URL(codeUrl('src/main.ts#target'), viewer.url)
    const response = await fetch(url, { headers: { accept: 'application/json' } })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(response.headers.get('cache-control')).toBe('no-store')
    const body = await response.text()
    const head = await fetch(url, { method: 'HEAD' })
    expect(Number(head.headers.get('content-length'))).toBe(Buffer.byteLength(body))
    expect(await head.text()).toBe('')
    const direct = await fetch(url, { headers: { accept: 'text/html' }, redirect: 'manual' })
    expect(direct.status).toBe(302)
    expect(new URL(direct.headers.get('location')!, viewer.url).searchParams.get('f')).toBe(url.pathname + url.search + '#reference')
    expect(await fetch(new URL('/_businesslens/report.json', viewer.url)).then(response => response.json())).toEqual(report)
    expect((await fetch(new URL('/_businesslens/file/src/main.ts', viewer.url))).status).toBe(404)
    current = structuredClone(report)
    current.references = []
    viewer.refresh()
    expect((await fetch(url)).status).toBe(404)
  })
})
