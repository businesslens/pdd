import { posix } from 'node:path'
import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import { escapeHtml, previewDocument, previewText } from './local-preview.js'

const fileHref = (path: string) => `/_businesslens/file/${path.split('/').map(encodeURIComponent).join('/')}`
const imageExtension = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i
const assetExtension = /\.(?:avif|gif|jpe?g|md|pdf|png|svg|txt|webp)$/i

/** Markdown links resolve against the document, inside the repository's asset mount. */
function linkTarget(href: string, path: string, image = false): string | undefined {
  if (/^[\s]*\/\//.test(href)) href = `https:${href}`
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

function inlineText(tokens: Token[]): string {
  return tokens.map(token => token.children ? inlineText(token.children)
    : ['text', 'code_inline'].includes(token.type) ? token.content : '').join('')
}

function renderMarkdown(body: string, path: string): string {
  // Raw HTML stays text. Markdown-it decodes entities before validating URLs.
  const markdown = new MarkdownIt({ html: false, linkify: true })
  markdown.validateLink = href => linkTarget(href, path) !== undefined
  const tokens = markdown.parse(body, {})
  const headings = new Set<string>()
  const visit = (items: Token[]) => {
    for (const [index, token] of items.entries()) {
      if (token.type === 'heading_open') {
        const text = inlineText(items[index + 1]?.children ?? [])
        const base = text.toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '').replace(/\s/g, '-') || 'section'
        let slug = base
        let duplicate = 0
        while (headings.has(slug)) slug = `${base}-${++duplicate}`
        headings.add(slug)
        token.attrSet('id', slug)
      }
      if (token.type === 'link_open') {
        const href = linkTarget(token.attrGet('href') ?? '', path)!
        token.attrSet('href', href)
        if (/^(?:https?:|mailto:)/i.test(href)) {
          token.attrSet('target', '_blank')
          token.attrSet('rel', 'noopener noreferrer')
        }
      }
      if (token.type === 'image') {
        const href = linkTarget(token.attrGet('src') ?? '', path, true)
        if (href) {
          token.attrSet('src', href)
          token.attrSet('loading', 'lazy')
        } else {
          token.type = 'text'
          token.content = `${inlineText(token.children ?? []) || 'Image'} (image unavailable)`
          token.children = null
        }
      }
      if (token.children) visit(token.children)
    }
  }
  visit(tokens)
  // Keep wide tables scrollable independently of the page on small screens.
  markdown.renderer.rules.table_open = () => '<div class="table-scroll" tabindex="0" role="region" aria-label="Table"><table>\n'
  markdown.renderer.rules.table_close = () => '</table></div>\n'
  return markdown.renderer.render(tokens, markdown.options, {})
}

const styles = `
main{max-width:960px;margin:0 auto;padding:28px 32px 64px;font-size:16px;line-height:1.75;overflow-wrap:anywhere}
article>:first-child{margin-top:0}article h1,article h2,article h3,article h4,article h5,article h6{line-height:1.3;scroll-margin-top:9rem;color:var(--text)}
article h1{font-size:32px;letter-spacing:-.025em;margin:0 0 24px}article h2{font-size:24px;margin:36px 0 16px;border-bottom:1px solid var(--border);padding-bottom:8px}
article h3{font-size:20px;margin:28px 0 12px}article h4,article h5,article h6{font-size:17px;margin:24px 0 12px}
article p,article ul,article ol,article blockquote{margin:0 0 18px}article ul,article ol{padding-left:26px}article li>ul,article li>ol{margin-bottom:0}
article a{color:var(--link);text-underline-offset:3px}article a:hover{text-decoration-thickness:2px}
code{font: .86em/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;background:var(--surface);border-radius:4px;padding:2px 5px}
pre{overflow:auto;max-width:100%;margin:0 0 22px;padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--surface);tab-size:2;line-height:1.6}
pre code{padding:0;border:0;background:none;font-size:13px}article blockquote{border-left:3px solid var(--border);padding:4px 0 4px 20px;color:var(--muted)}article blockquote>:last-child{margin-bottom:0}
.table-scroll{max-width:100%;overflow:auto;margin:0 0 24px;border:1px solid var(--border);border-radius:8px}table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.6}
th,td{padding:10px 14px;text-align:left;vertical-align:top;border-bottom:1px solid var(--border)}th{font-weight:600;background:var(--surface)}tr:last-child td{border-bottom:0}th code,td code{white-space:nowrap}
article img{display:block;max-width:100%;height:auto;border-radius:6px}article hr{border:0;border-top:1px solid var(--border);margin:32px 0}
.metadata{margin:0 0 24px;font-size:13px;color:var(--muted)}.metadata summary{cursor:pointer;width:fit-content}.metadata pre{margin:10px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}
:focus-visible{outline:2px solid var(--link);outline-offset:4px}
@media(max-width:600px){.preview-header{padding:12px 16px;gap:12px}.preview-title{font-size:14px}.preview-actions{font-size:12px}main{padding:22px 18px 48px;font-size:15px}article h1{font-size:27px}article h2{font-size:22px}th,td{min-width:140px;padding:9px 12px}}
`

export function localMarkdownPreview(root: string, path: string): { status: number, html: string } {
  const source = /\.md$/i.test(path) ? previewText(root, path) : undefined
  if (source === undefined) return {
    status: 404,
    html: previewDocument({ title: 'Document unavailable', kind: 'Document', styles,
      body: '<p>This document is unavailable. Open it from the local report with its repository files present.</p>' })
  }
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  // Display frontmatter separately without interpreting YAML or discarding any metadata.
  const frontmatter = normalized.startsWith('---\n')
    ? /^---\n([\s\S]*?)^(?:---|\.\.\.)[ \t]*(?:\n|$)/m.exec(normalized) : null
  const metadata = frontmatter
    ? `<details class="metadata"><summary>Document metadata</summary><pre>${escapeHtml(frontmatter[1]!)}</pre></details>` : ''
  const body = frontmatter ? normalized.slice(frontmatter[0].length) : normalized
  return { status: 200, html: previewDocument({ title: path, kind: 'Document', styles,
    actions: `<a href="${escapeHtml(fileHref(path))}?raw=1">View source</a>`,
    body: `${metadata}<article aria-label="Document">${renderMarkdown(body, path)}</article>` }) }
}
