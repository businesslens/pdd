const DEFINITION = /^ {0,3}\[([^\]\n]+)\]:[ \t]/gm
const FENCE = /^ {0,3}(`{3,}|~{3,})/
// Not the second half of `[text][label]`, an escape, or an image; not followed
// by a link, a reference, a definition's colon, or MDC attributes.
const SHORTCUT = /(?<![\]\\!])\[([^[\]\n]+)\](?![[(:{])/g

function normalizeLabel(label: string) {
  return label.trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Spell every shortcut reference with a matching definition (`[0.23.0]`) as its
 * collapsed form (`[0.23.0][]`). CommonMark renders both identically; MDC reads
 * the shortcut form as a span. Code spans and fenced code are left alone.
 */
export function collapseShortcutReferences(markdown: string): string {
  const labels = new Set([...markdown.matchAll(DEFINITION)].map(([, label]) => normalizeLabel(label!)))
  if (!labels.size) return markdown

  let fence: string | undefined
  return markdown.split('\n').map((line) => {
    const marker = FENCE.exec(line)?.[1]
    if (marker && (!fence || marker.startsWith(fence))) {
      fence = fence ? undefined : marker
      return line
    }
    if (fence) return line
    // Odd segments sit between backtick runs, inside a code span.
    return line.split(/(`+[^`]*`+)/).map((segment, index) => index % 2
      ? segment
      : segment.replace(SHORTCUT, (reference, label: string) =>
          labels.has(normalizeLabel(label)) ? `${reference}[]` : reference)).join('')
  }).join('\n')
}
