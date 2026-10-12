import type { Element, ElementContent, Properties } from 'hast'
import { toHtml } from 'hast-util-to-html'

/**
 * MiniMark bodies rendered as standalone HTML for `content:encoded`.
 *
 * Two things make this more than a serializer call.
 *
 * A MiniMark body is a tuple tree — `[tag, props, ...children]`, with text as a
 * plain string — and it is walked directly, the way `app/utils/blogContent.ts`
 * walks it for the reading-time count. `minimark/hast` exists but only rewraps
 * each tuple as `{ tag, props }`, which is MDC's node shape rather than hast's
 * `{ tagName, properties }`; every node would still have to be rebuilt here, so
 * it buys a second traversal and a version coupling to @nuxt/content's private
 * AST package, and nothing else.
 *
 * The stored body is also the *site's* markup, not portable HTML. Nuxt Content
 * runs Shiki at parse time, so a fenced block arrives as dozens of
 * `<span class="sg1QC">` whose colors live in this site's stylesheet, followed
 * by a `<style>` element carrying the generated CSS variables. In a reader that
 * is unhighlighted noise at ten times the byte count, so code blocks are rebuilt
 * from the raw source MDC keeps on the `pre` node and the stylesheet is dropped.
 */

/** Mirrors `minimark`'s tree types, which the package declares but does not export. */
type MinimarkElement = [string, Record<string, unknown>, ...MinimarkNode[]]
type MinimarkNode = string | MinimarkElement

interface MinimarkBody {
  type: 'minimark'
  value: MinimarkNode[]
}

/**
 * Rendered as themselves. Anything outside this list is unwrapped rather than
 * dropped: an MDC component such as `::note` should still contribute its prose
 * to the feed, and a leftover highlight `span` should contribute its text.
 */
const ALLOWED_TAGS = new Set([
  'p', 'a', 'strong', 'em', 'del', 'code', 'pre', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'img', 'figure', 'figcaption', 'br', 'hr', 'sup', 'sub'
])

/** Dropped with their children. `style` is Shiki's; `script` should never appear. */
const DROPPED_TAGS = new Set(['style', 'script'])

/**
 * Everything else is discarded. The site's own hooks — `className`, `line`,
 * `language`, `__ignoreMap` — mean nothing outside this origin, and dropping
 * them is what keeps an item's markup portable.
 */
const ALLOWED_ATTRIBUTES: Record<string, readonly string[]> = {
  a: ['href', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  ol: ['start'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan', 'scope']
}

/** Resolved against the article URL so a reader can follow them off-site. */
const URL_ATTRIBUTES: Record<string, string> = { a: 'href', img: 'src' }

/**
 * @param body the `body` column of a blog collection entry
 * @param articleUrl absolute URL of the post, the base for its relative links
 */
export function renderPostHtml(body: unknown, articleUrl: string): string {
  if (!isMinimarkBody(body)) return ''

  const children = body.value.flatMap(node => convertNode(node, articleUrl))

  return toHtml({ type: 'root', children })
}

function isMinimarkBody(body: unknown): body is MinimarkBody {
  if (typeof body !== 'object' || body === null) return false
  const candidate = body as Partial<MinimarkBody>
  return candidate.type === 'minimark' && Array.isArray(candidate.value)
}

function isElement(node: unknown): node is MinimarkElement {
  return Array.isArray(node) && typeof node[0] === 'string'
}

/**
 * Everything from index 2 on. `slice` widens a tuple to include its head types,
 * so the element type is restated here rather than at each call site.
 */
function childrenOf(node: MinimarkElement): MinimarkNode[] {
  return node.slice(2) as MinimarkNode[]
}

function convertNode(node: MinimarkNode, base: string): ElementContent[] {
  if (typeof node === 'string') return [{ type: 'text', value: node }]
  if (!isElement(node)) return []

  const tag = node[0].toLowerCase()
  if (DROPPED_TAGS.has(tag)) return []
  if (tag === 'pre') return [codeBlock(node)]

  const children = childrenOf(node).flatMap(child => convertNode(child, base))
  if (!ALLOWED_TAGS.has(tag)) return children

  return [{
    type: 'element',
    tagName: tag,
    properties: elementProperties(tag, node[1] ?? {}, base),
    children
  }]
}

/**
 * MDC keeps the pre-highlight source on `props.code`, which is the only reason
 * a portable code block is recoverable at all. `plainText` covers a `pre` that
 * never went through Shiki.
 */
function codeBlock(node: MinimarkElement): Element {
  const props = node[1] ?? {}
  const raw = props.code
  const source = typeof raw === 'string' ? raw : plainText(node)
  const language = props.language

  return {
    type: 'element',
    tagName: 'pre',
    properties: {},
    children: [{
      type: 'element',
      tagName: 'code',
      properties: typeof language === 'string' && language
        ? { className: [`language-${language}`] }
        : {},
      // Shiki's trailing newline would render as a blank final line.
      children: [{ type: 'text', value: source.replace(/\n+$/, '') }]
    }]
  }
}

function plainText(node: MinimarkNode): string {
  if (typeof node === 'string') return node
  if (!isElement(node)) return ''
  return childrenOf(node).map(plainText).join('')
}

function elementProperties(tag: string, props: Record<string, unknown>, base: string): Properties {
  const allowed = ALLOWED_ATTRIBUTES[tag] ?? []
  const urlAttribute = URL_ATTRIBUTES[tag]
  const properties: Properties = {}

  for (const name of allowed) {
    const value = props[name]

    if (name === urlAttribute) {
      const resolved = absoluteUrl(value, base)
      if (resolved) properties[name] = resolved
      continue
    }

    // Anything richer than a scalar is an MDC binding, not an HTML attribute.
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      // Empty alt text marks an image as decorative; omitting it changes that meaning.
      if (value !== '' || name === 'alt') properties[name] = value
    }
  }

  return properties
}

/**
 * A syndicated link leaves this origin and lands in software we do not control,
 * so the scheme is checked rather than trusted. `new URL` happily parses
 * `javascript:` — a markdown author could write one, and a reader that renders
 * `content:encoded` without sanitizing would honour it.
 */
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

export function absoluteUrl(value: unknown, base: string): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined

  try {
    const url = new URL(value, base)
    return SAFE_PROTOCOLS.has(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}
