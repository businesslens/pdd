import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ElementNode, Node } from 'comark'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import { localMarkdownPreview } from '../src/core/local-markdown-preview.js'
import { highlightedCode } from '../src/core/syntax-highlighting.js'
import { startLocalViewer, type LocalViewer } from '../src/core/local-viewer-server.js'

const fixture = compileReport(loadModel(join(import.meta.dirname, 'fixtures/fixture-shop')), '2026-09-15')
const directories: string[] = []
const viewers: LocalViewer[] = []
afterEach(async () => {
  await Promise.all(viewers.splice(0).map(viewer => viewer.close()))
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})
function setup(source: string) {
  const root = mkdtempSync(join(tmpdir(), 'blr-markdown-preview-'))
  directories.push(root)
  mkdirSync(join(root, 'docs'))
  writeFileSync(join(root, 'docs/guide.md'), source)
  return root
}
function elements(nodes: Node[]): ElementNode[] {
  return nodes.flatMap(node => typeof node === 'string' || node[0] === null ? [] : [node, ...elements(node.slice(2) as Node[])])
}
async function reading(root: string) {
  const result = await localMarkdownPreview(root, 'docs/guide.md')
  expect(result.status).toBe(200)
  if (!('document' in result.data)) throw new Error(result.data.message)
  return { ...result.data, elements: elements(result.data.document.nodes) }
}

describe('local Markdown previews', () => {
  it('produces prose nodes and syntax colors while preserving metadata separately', async () => {
    const root = setup('---\ntitle: Guide\ndescription: <script>metadata</script>\n---\n# Using skills\n\n## Install\n\n## Install\n\n**Strong** and *emphasis*.\n\n- One\n- Two\n\n| Name | Value |\n|---|---|\n| A | B |\n\n```ts\nconst value = "hello"\n```')
    const preview = await reading(root)
    expect(preview.metadata).toBe('title: Guide\ndescription: <script>metadata</script>\n')
    expect(preview.document.frontmatter).toEqual({})
    expect(preview.elements.filter(node => /^h\d$/.test(node[0])).map(node => node[1].id)).toEqual(['using-skills', 'install', 'install-1'])
    for (const tag of ['strong', 'em', 'ul', 'li', 'table', 'thead', 'tbody', 'pre']) expect(preview.elements.some(node => node[0] === tag)).toBe(true)
    const pre = preview.elements.find(node => node[0] === 'pre')!
    expect(pre[1].code).toBe('const value = "hello"')
    expect(preview.elements.some(node => node[1].style && (node[1].style as Record<string, string>)['--shiki-dark'])).toBe(true)
  })

  it('keeps documents without frontmatter, empty metadata and incomplete metadata readable', async () => {
    for (const [source, metadata] of [
      ['# Plain\n\n---\n\nBody', false], ['---\n---\n# Plain', true],
      ['---\ntitle: A\n...\n# Plain', true], ['---\ntitle: A\n# Plain', false]
    ] as const) {
      const preview = await reading(setup(source))
      expect(preview.metadata !== null).toBe(metadata)
      expect(JSON.stringify(preview.document.nodes)).toContain('Plain')
    }
  })

  it('resolves sibling, parent, root, encoded and fragment links and images', async () => {
    const root = setup('[Next](./next.md#install)\n\n[Root](../README.md)\n\n[Spec](/spec/format.md)\n\n[Spaces](./a%20guide.md)\n\n[Anchor](#using-skills)\n\n![Diagram](../images/diagram.png)\n\n[External](https://example.com/docs?a=1&b=2)\n\n[Mail](mailto:team@example.com)')
    const preview = await reading(root)
    const links = preview.elements.filter(node => node[0] === 'a').map(node => node[1])
    for (const href of ['/_businesslens/file/docs/next.md#install', '/_businesslens/file/README.md', '/_businesslens/file/spec/format.md', '/_businesslens/file/docs/a%20guide.md', '#using-skills']) expect(links.some(link => link.href === href)).toBe(true)
    expect(preview.elements.find(node => node[0] === 'img')![1]).toMatchObject({ src: '/_businesslens/file/images/diagram.png', loading: 'lazy', alt: 'Diagram' })
    expect(links.find(link => String(link.href).startsWith('https:'))).toMatchObject({ href: 'https://example.com/docs?a=1&b=2', target: '_blank', rel: 'noopener noreferrer', 'data-external': '' })
    expect(links.some(link => link.href === 'mailto:team@example.com')).toBe(true)
  })

  it('keeps HTML and component directives inert and refuses unsafe links and props', async () => {
    const root = setup('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n::u-button{onClick="evil"}\n\n[Safe](./guide.md){as="UButton" :onClick="data.attack"}\n\n[Bad](javascript:alert(1))\n\n[Entity](jav&#x61;script:alert(1))\n\n[Data](data:text/html,hello)\n\n[File](file:///etc/passwd)\n\n[Outside](../../outside.md)\n\n[Encoded](%2e%2e/%2e%2e/outside.md)\n\n[Code](../src/cli.ts)\n\n![Bad image](data:image/svg+xml,boom)\n\n![Not image](guide.md)')
    const preview = await reading(root)
    expect(preview.elements.map(node => node[0])).not.toEqual(expect.arrayContaining(['script', 'img', 'u-button']))
    expect(preview.elements.some(node => ['script', 'img', 'u-button'].includes(node[0]))).toBe(false)
    expect(JSON.stringify(preview.document.nodes)).toContain('<script>alert(1)</script>')
    for (const node of preview.elements) {
      expect(Object.keys(node[1]).some(key => /^(?:on|:|v-)|^(?:as|innerHTML|is)$/.test(key))).toBe(false)
      if (node[1].href) expect(node[1].href).toBe('/_businesslens/file/docs/guide.md')
    }
    expect(JSON.stringify(preview.document.nodes)).toContain('Not image (image unavailable)')
  })

  it('falls back to plain text for unknown languages and oversized grammar input', async () => {
    for (const [source, language] of [['<script>literal</script>', 'unknown-language'], ['x'.repeat(250_001), 'typescript']] as const) {
      const pre = await highlightedCode(source, language)
      expect(pre[1].code).toBe(source)
      expect(elements([pre]).some(node => node[1].style)).toBe(false)
      expect(elements([pre]).some(node => node[0] === 'script')).toBe(false)
    }
  })

  it('refuses missing, oversized, binary and symlinked Markdown, including directory symlinks', async () => {
    const root = setup('# Guide')
    const outside = setup('# Outside secret')
    writeFileSync(join(root, 'docs/binary.md'), Buffer.from([0, 1]))
    writeFileSync(join(root, 'docs/invalid.md'), Buffer.from([0xc3, 0x28]))
    writeFileSync(join(root, 'docs/large.md'), Buffer.alloc(2 * 1024 * 1024 + 1, 65))
    symlinkSync(join(outside, 'docs/guide.md'), join(root, 'docs/link.md'))
    symlinkSync(outside, join(root, 'linked'), 'dir')
    for (const path of ['docs/missing.md', 'docs/binary.md', 'docs/invalid.md', 'docs/large.md', 'docs/link.md', 'linked/docs/guide.md', '../outside.md', 'docs/code.ts']) {
      const preview = await localMarkdownPreview(root, path)
      expect(preview.status, path).toBe(404)
      expect(JSON.stringify(preview)).not.toContain('Outside secret')
    }
  })

  it('serves preview data, raw source and linked documents without changing the report', async () => {
    const source = '---\ntitle: Guide\n---\n# Guide\n\n[Next](./next.md#next)'
    const root = setup(source)
    writeFileSync(join(root, 'docs/next.md'), '# Next')
    const outside = setup('# Outside secret')
    symlinkSync(outside, join(root, 'linked'), 'dir')
    const viewer = await startLocalViewer({ compile: () => fixture, viewerRoot: root, assetRoot: root })
    viewers.push(viewer)
    const url = new URL('/_businesslens/file/docs/guide.md', viewer.url)
    const response = await fetch(url)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(response.headers.get('cache-control')).toBe('no-store')
    const body = await response.text()
    const head = await fetch(url, { method: 'HEAD' })
    expect(Number(head.headers.get('content-length'))).toBe(Buffer.byteLength(body))
    expect(await head.text()).toBe('')
    expect(await fetch(String(url) + '?raw=1').then(response => response.text())).toBe(source)
    const next = elements(JSON.parse(body).document.nodes).find(node => node[0] === 'a')![1].href as string
    expect(await fetch(new URL(next, viewer.url)).then(response => response.json())).toMatchObject({ kind: 'markdown', document: { nodes: [['h1', { id: 'next' }, 'Next']] } })
    const direct = await fetch(url, { headers: { accept: 'text/html' }, redirect: 'manual' })
    expect(direct.status).toBe(302)
    expect(new URL(direct.headers.get('location')!, viewer.url).searchParams.get('f')).toBe(url.pathname)
    expect((await fetch(new URL('/_businesslens/file/linked/docs/guide.md', viewer.url))).status).toBe(404)
    expect(await fetch(new URL('/_businesslens/report.json', viewer.url)).then(response => response.json())).toEqual(fixture)
  })
})
