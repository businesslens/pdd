import { posix } from 'node:path'
import { createMarkdownParser } from 'comark/parse'
import type { ElementNode, Node } from 'comark'
import type { ReferencePreview } from '../../layers/nuxt/report-viewer/app/utils/referencePreview.js'
import { previewText } from './local-preview.js'
import { highlightedCode } from './syntax-highlighting.js'

const fileHref = (path: string) => '/_businesslens/file/' + path.split('/').map(encodeURIComponent).join('/')
const imageExtension = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i
const assetExtension = /\.(?:avif|gif|jpe?g|md|pdf|png|svg|txt|webp)$/i

/** Markdown links resolve against the document, inside the repository's asset mount. */
function linkTarget(href: string, path: string, image = false): string | undefined {
  if (/^[\s]*\/\//.test(href)) href = 'https:' + href
  if (/^https?:\/\//i.test(href) || (!image && /^mailto:/i.test(href))) return href
  if (!image && href.startsWith('#')) return href
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || /[\\\u0000-\u0020]/.test(href)) return undefined
  const end = href.search(/[?#]/)
  const suffix = end < 0 ? '' : href.slice(end)
  let target: string
  try { target = decodeURIComponent(end < 0 ? href : href.slice(0, end)) } catch { return undefined }
  if (/[\\\u0000-\u001f]/.test(target)) return undefined
  const resolved = target.startsWith('/')
    ? posix.normalize(target.slice(1)) : posix.join(posix.dirname(path), target)
  if (resolved === '..' || resolved.startsWith('../') || resolved.startsWith('/')) return undefined
  if (!(image ? imageExtension : assetExtension).test(resolved)) return undefined
  return fileHref(resolved) + suffix
}

// Repository documents are ordinary Markdown: HTML, component syntax and bindings stay text.
const parse = createMarkdownParser({ registerDefaultPlugins: false, autoUnwrap: false, autoClose: false, linkify: true })
const tags = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 's', 'del', 'ul', 'ol', 'li', 'blockquote', 'hr', 'br', 'a', 'img', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td'])
const text = (nodes: Node[]): string => nodes.map(node => typeof node === 'string' ? node : text(node.slice(2) as Node[])).join('')

async function readingNodes(nodes: Node[], path: string): Promise<Node[]> {
  const result: Node[] = []
  for (const node of nodes) {
    if (typeof node === 'string') { result.push(node); continue }
    const [tag, attrs, ...children] = node
    if (!tag) continue
    if (!tags.has(tag)) { result.push(...await readingNodes(children, path)); continue }
    if (tag === 'pre') {
      result.push(await highlightedCode(text(children), String(attrs.language ?? 'text'), {
        filename: typeof attrs.filename === 'string' ? attrs.filename : undefined
      }))
      continue
    }
    // Only parser-owned presentation attributes cross into the Vue renderer.
    const safe: ElementNode[1] = {}
    if (/^h[1-6]$/.test(tag) && typeof attrs.id === 'string') safe.id = attrs.id
    if (tag === 'ol' && Number.isInteger(Number(attrs.start))) safe.start = Number(attrs.start)
    if ((tag === 'th' || tag === 'td') && /^(?:text-align:\s*)?(?:left|right|center);?$/.test(String(attrs.style))) safe.style = attrs.style
    if (tag === 'a' || tag === 'img') {
      const target = linkTarget(String(attrs[tag === 'a' ? 'href' : 'src'] ?? ''), path, tag === 'img')
      if (!target) {
        result.push(tag === 'img' ? String(attrs.alt || text(children) || 'Image') + ' (image unavailable)' : text(children))
        continue
      }
      safe[tag === 'a' ? 'href' : 'src'] = target
      if (typeof attrs.title === 'string') safe.title = attrs.title
      if (tag === 'img') { safe.alt = String(attrs.alt ?? text(children)); safe.loading = 'lazy' }
      else if (/^(?:https?:|mailto:)/i.test(target)) {
        safe.target = '_blank'; safe.rel = 'noopener noreferrer'; safe['data-external'] = ''
        safe['aria-description'] = 'Opens in a new tab'
      }
    }
    result.push([tag, safe, ...await readingNodes(children, path)])
  }
  return result
}

export async function localMarkdownPreview(root: string, path: string): Promise<{ status: number, data: ReferencePreview | { message: string } }> {
  const source = /\.md$/i.test(path) ? previewText(root, path) : undefined
  if (source === undefined) return { status: 404, data: { message: 'This document is unavailable in the local repository.' } }
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  // Preserve frontmatter verbatim, without evaluating or passing it to Vue components.
  const frontmatter = normalized.startsWith('---\n')
    ? /^---\n([\s\S]*?)^(?:---|\.\.\.)[ \t]*(?:\n|$)/m.exec(normalized) : null
  const body = frontmatter ? normalized.slice(frontmatter[0].length) : normalized
  const parsed = await parse(body)
  return { status: 200, data: {
    kind: 'markdown', path, metadata: frontmatter?.[1] ?? null,
    document: { nodes: await readingNodes(parsed.nodes, path), frontmatter: {}, meta: {} }
  } }
}
