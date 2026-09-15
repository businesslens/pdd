import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import { localMarkdownPreview } from '../src/core/local-markdown-preview.js'
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

describe('local Markdown previews', () => {
  it('renders complete documents and separates escaped frontmatter from the body', () => {
    const root = setup('\uFEFF---\r\ntitle: "<script>metadata</script>"\r\n---\r\n# Guide\r\n\r\n## Using `skills`\r\n\r\n| Skill | Purpose |\r\n| --- | --- |\r\n| **map** | *Describe* |\r\n\r\n1. First\r\n   - Nested\r\n\r\n> Quote\r\n\r\n```ts\r\nconst tag = "<script>"\r\n```\r\n\r\n## Using `skills`\r\n')
    const preview = localMarkdownPreview(root, 'docs/guide.md')
    expect(preview.status).toBe(200)
    expect(preview.html).toContain('<details class="metadata"><summary>Document metadata</summary>')
    expect(preview.html).toContain('&lt;script&gt;metadata&lt;/script&gt;')
    const article = preview.html.split('<article aria-label="Document">')[1]!
    expect(article).not.toContain('metadata')
    expect(article).toContain('<h1 id="guide">Guide</h1>')
    expect(article).toContain('<h2 id="using-skills">Using <code>skills</code></h2>')
    expect(article).toContain('<h2 id="using-skills-1">')
    expect(article).toContain('<table>')
    expect(article).toContain('<strong>map</strong>')
    expect(article).toContain('<em>Describe</em>')
    expect(article).toContain('<ol>')
    expect(article).toContain('<ul>')
    expect(article).toContain('<blockquote>')
    expect(article).toContain('<code class="language-ts">const tag = &quot;&lt;script&gt;&quot;')
    expect(preview.html).toContain('href="/_businesslens/file/docs/guide.md?raw=1"')
  })

  it('keeps documents without frontmatter, empty metadata and incomplete metadata readable', () => {
    for (const [source, metadata] of [
      ['# Plain\n\n---\n\nBody', false],
      ['---\n---\n# Plain', true],
      ['---\ntitle: A\n...\n# Plain', true],
      ['---\ntitle: A\n# Plain', false]
    ] as const) {
      const html = localMarkdownPreview(setup(source), 'docs/guide.md').html
      expect(html.includes('<details class="metadata">')).toBe(metadata)
      expect(html).toContain('Plain')
    }
  })

  it('resolves sibling, parent, root, encoded and fragment links and images', () => {
    const root = setup('[Next](./next.md#install)\n\n[Root](../README.md)\n\n[Spec](/spec/format.md)\n\n[Spaces](./a%20guide.md)\n\n[Anchor](#using-skills)\n\n![Diagram](../images/diagram.png)\n\n[External](https://example.com/docs?a=1&b=2)\n\n[Mail](mailto:team@example.com)')
    const html = localMarkdownPreview(root, 'docs/guide.md').html
    for (const href of ['/_businesslens/file/docs/next.md#install', '/_businesslens/file/README.md', '/_businesslens/file/spec/format.md', '/_businesslens/file/docs/a%20guide.md', '#using-skills']) {
      expect(html).toContain(`href="${href}"`)
    }
    expect(html).toContain('src="/_businesslens/file/images/diagram.png"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('href="https://example.com/docs?a=1&amp;b=2" target="_blank" rel="noopener noreferrer"')
    expect(html).toContain('href="mailto:team@example.com"')
  })

  it('never executes raw HTML or unsafe links, including encoded protocols and traversal', () => {
    const root = setup('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[Bad](javascript:alert(1))\n\n[Entity](jav&#x61;script:alert(1))\n\n[Data](data:text/html,hello)\n\n[File](file:///etc/passwd)\n\n[Outside](../../outside.md)\n\n[Encoded](%2e%2e/%2e%2e/outside.md)\n\n[Code](../src/cli.ts)\n\n![Bad image](data:image/svg+xml,boom)\n\n![Not image](guide.md)')
    const html = localMarkdownPreview(root, 'docs/guide.md').html
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    for (const href of ['javascript:', 'data:', 'file:', '../../', '/_businesslens/file/outside.md', '/_businesslens/file/src/cli.ts']) {
      expect(html).not.toContain(`href="${href}`)
    }
    expect(html).toContain('Not image (image unavailable)')
  })

  it('refuses missing, oversized, binary and symlinked Markdown, including directory symlinks', () => {
    const root = setup('# Guide')
    const outside = setup('# Outside secret')
    writeFileSync(join(root, 'docs/binary.md'), Buffer.from([0, 1]))
    writeFileSync(join(root, 'docs/invalid.md'), Buffer.from([0xc3, 0x28]))
    writeFileSync(join(root, 'docs/large.md'), Buffer.alloc(2 * 1024 * 1024 + 1, 65))
    symlinkSync(join(outside, 'docs/guide.md'), join(root, 'docs/link.md'))
    symlinkSync(outside, join(root, 'linked'), 'dir')
    for (const path of ['docs/missing.md', 'docs/binary.md', 'docs/invalid.md', 'docs/large.md', 'docs/link.md', 'linked/docs/guide.md', '../outside.md', 'docs/code.ts']) {
      const preview = localMarkdownPreview(root, path)
      expect(preview.status, path).toBe(404)
      expect(preview.html).not.toContain('Outside secret')
    }
  })

  it('serves previews, raw source and linked documents over HTTP without changing the report', async () => {
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
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(response.headers.get('content-security-policy')).toContain("script-src 'none'")
    expect(response.headers.get('cache-control')).toBe('no-store')
    const html = await response.text()
    const head = await fetch(url, { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(Number(head.headers.get('content-length'))).toBe(Buffer.byteLength(html))
    expect(await head.text()).toBe('')
    expect(await fetch(`${url}?raw=1`).then(response => response.text())).toBe(source)
    const next = /href="([^"]+)">Next/.exec(html)![1]!
    expect(await fetch(new URL(next, viewer.url)).then(response => response.text())).toContain('<h1 id="next">Next</h1>')
    expect((await fetch(new URL('/_businesslens/file/linked/docs/guide.md', viewer.url))).status).toBe(404)
    expect(await fetch(new URL('/_businesslens/report.json', viewer.url)).then(response => response.json())).toEqual(fixture)
  })
})
