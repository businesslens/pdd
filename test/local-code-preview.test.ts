import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
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
  return { root, report }
}
const codeUrl = (target: string) => `/_businesslens/code?target=${encodeURIComponent(target)}`

describe('local code previews', () => {
  it('opens the declared symbol, excludes partial identifier matches, and escapes source and titles', () => {
    const { root, report } = setup()
    const preview = localCodePreview(report, root, 'src/main.ts#target')
    expect(preview.status).toBe(200)
    expect(preview.html).toContain('class="line highlight" id="L2"')
    expect(preview.html).not.toContain('class="line highlight" id="L1"')
    expect(preview.html).toContain('First text match for target.')
    expect(preview.html).toContain('Named &lt;source&gt;')
    expect(preview.html).toContain('&lt;script&gt;globalThis.pwned = true&lt;/script&gt;')
    expect(preview.html).not.toContain('<script>')
    expect(preview.html).toContain('src/main.ts · 3 lines')
    expect(preview.html).not.toContain('id="L4"')
  })

  it('uses authored line ranges ahead of symbols and highlights each requested line', () => {
    const { root, report } = setup('src/main.ts#target:2-3', 'target\r\nsecond\r\nthird\r\nfourth\r\n')
    const preview = localCodePreview(report, root, 'src/main.ts#target:2-3')
    expect(preview.html).toContain('class="line highlight" id="L2"><span id="reference">')
    expect(preview.html).toContain('class="line highlight" id="L3"')
    expect(preview.html).not.toContain('class="line highlight" id="L1"')
    expect(preview.html).not.toContain('class="line highlight" id="L4"')
    expect(preview.html).toContain('4 lines · Lines 2–3.')
  })

  it('explains unmatched locators and supports qualified symbols and file-only targets', () => {
    const { root, report } = setup()
    for (const [target, message] of [
      ['src/main.ts#Service.target', 'First text match for Service.target.'],
      ['src/main.ts#missing', 'No text match for missing in this file.'],
      ['src/main.ts:500', 'The requested line is outside this file.'],
      ['src/main.ts:2-500', 'The range extends beyond this file.'],
      ['src/main.ts#...', 'No text match for ... in this file.'],
      ['src/main.ts', '3 lines']
    ]) {
      report.references[0]!.target = target!
      const preview = localCodePreview(report, root, target!)
      expect(preview.status).toBe(200)
      expect(preview.html).toContain(message)
      expect(preview.html).toContain('id="reference"')
    }
  })

  it('requires an exact current workspace Code Reference and a configured repository', () => {
    const { root, report } = setup()
    expect(localCodePreview(report, root, 'src/main.ts').status).toBe(404)
    expect(localCodePreview(report, root, 'src/main.ts#different').status).toBe(404)
    expect(localCodePreview(report, undefined, 'src/main.ts#target').status).toBe(404)
    expect(localCodePreview(undefined, root, 'src/main.ts#target').status).toBe(404)
    report.referenceProfile = 'portable'
    expect(localCodePreview(report, root, 'src/main.ts#target').status).toBe(404)
    report.referenceProfile = 'workspace'
    report.references[0]!.kind = 'doc'
    expect(localCodePreview(report, root, 'src/main.ts#target').status).toBe(404)
  })

  it('refuses undeclared files, traversal, symlinks, binaries, oversized files and missing files', () => {
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
    expect(localCodePreview(report, root, 'src/private.ts').status).toBe(404)
    for (const target of ['../secret.ts', join(outside, 'secret.ts'), 'src/link.ts', 'src/linked-directory/secret.ts', 'src/binary.ts', 'src/invalid.ts', 'src/large.ts', 'src/missing.ts', 'src']) {
      report.references[0]!.target = target
      const preview = localCodePreview(report, root, target)
      expect(preview.status, target).toBe(404)
      expect(preview.html).not.toContain('secret source')
    }
  })

  it('serves inert GET and HEAD previews, preserves the report and revokes removed targets', async () => {
    const { root, report } = setup()
    let current = report
    const viewer = await startLocalViewer({ compile: () => current, viewerRoot: root, assetRoot: root })
    viewers.push(viewer)
    const url = new URL(codeUrl('src/main.ts#target'), viewer.url)
    const response = await fetch(url)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(response.headers.get('content-security-policy')).toContain("script-src 'none'")
    expect(response.headers.get('cache-control')).toBe('no-store')
    const body = await response.text()
    const head = await fetch(url, { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(Number(head.headers.get('content-length'))).toBe(Buffer.byteLength(body))
    expect(await head.text()).toBe('')
    expect(await fetch(new URL('/_businesslens/report.json', viewer.url)).then(response => response.json())).toEqual(report)
    expect((await fetch(new URL('/_businesslens/file/src/main.ts', viewer.url))).status).toBe(404)
    current = structuredClone(report)
    current.references = []
    viewer.refresh()
    expect((await fetch(url)).status).toBe(404)
  })
})
