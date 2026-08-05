/**
 * A deliberately small Markdown renderer for report prose fragments.
 *
 * Report fragments are constrained by the format: no H1 or H2, and in practice
 * paragraphs, bullet lists, ordered lists, fenced code and simple inline marks.
 * A full Markdown dependency would ship inside the CLI for that, so this
 * handles exactly the authored subset.
 *
 * Target repositories are untrusted, so every fragment is HTML-escaped **first**
 * and only the recognised marks are re-introduced afterwards. Raw HTML in a
 * fragment is rendered as the text it is, never as markup.
 */

export type ProseBlock =
  | { type: 'paragraph', html: string }
  | { type: 'bullets', items: string[] }
  | { type: 'ordered', items: string[] }
  | { type: 'code', text: string }
  | { type: 'quote', html: string }
  | { type: 'heading', html: string }

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function safeHref(value: string): string | null {
  const target = value.trim()
  if (/^https?:\/\//i.test(target)) return target
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return null
  return null
}

/** Inline marks, applied to already-escaped text. */
export function renderInline(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, text: string, href: string) => {
      const url = safeHref(href.replaceAll('&amp;', '&'))
      return url
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`
        : `${text} <span class="blr-prose-target">${href}</span>`
    })
}

/** Split a fragment into the block kinds the report actually authors. */
export function parseProse(value: string): ProseBlock[] {
  const source = (value || '').trim()
  if (!source) return []

  const blocks: ProseBlock[] = []
  const lines = source.split(/\r?\n/)
  let index = 0

  while (index < lines.length) {
    const line = lines[index]!

    if (!line.trim()) {
      index += 1
      continue
    }

    if (/^\s*(```|~~~)/.test(line)) {
      const fence = line.trim().slice(0, 3)
      const body: string[] = []
      index += 1
      while (index < lines.length && !lines[index]!.trim().startsWith(fence)) {
        body.push(lines[index]!)
        index += 1
      }
      index += 1
      blocks.push({ type: 'code', text: body.join('\n') })
      continue
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index]!)) {
        items.push(renderInline(lines[index]!.replace(/^\s*[-*+]\s+/, '')))
        index += 1
      }
      blocks.push({ type: 'bullets', items })
      continue
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index]!)) {
        items.push(renderInline(lines[index]!.replace(/^\s*\d+[.)]\s+/, '')))
        index += 1
      }
      blocks.push({ type: 'ordered', items })
      continue
    }

    if (/^\s*>\s?/.test(line)) {
      const body: string[] = []
      while (index < lines.length && /^\s*>\s?/.test(lines[index]!)) {
        body.push(lines[index]!.replace(/^\s*>\s?/, ''))
        index += 1
      }
      blocks.push({ type: 'quote', html: renderInline(body.join(' ')) })
      continue
    }

    if (/^\s*#{3,6}\s+/.test(line)) {
      blocks.push({ type: 'heading', html: renderInline(line.replace(/^\s*#{3,6}\s+/, '')) })
      index += 1
      continue
    }

    const paragraph: string[] = []
    while (
      index < lines.length
      && lines[index]!.trim()
      && !/^\s*([-*+]\s+|\d+[.)]\s+|>|#{3,6}\s+|```|~~~)/.test(lines[index]!)
    ) {
      paragraph.push(lines[index]!.trim())
      index += 1
    }
    blocks.push({ type: 'paragraph', html: renderInline(paragraph.join(' ')) })
  }

  return blocks
}

/** First sentence or clause, for one-line summaries in dense layouts. */
export function firstSentence(value: string, limit = 160): string {
  const flat = (value || '').replace(/\s+/g, ' ').trim()
  if (!flat) return ''
  const stop = flat.search(/[.!?](\s|$)/)
  const sentence = stop > 0 ? flat.slice(0, stop + 1) : flat
  return sentence.length > limit ? `${sentence.slice(0, limit - 1)}…` : sentence
}
