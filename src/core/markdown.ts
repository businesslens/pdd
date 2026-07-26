export interface MarkdownDoc {
  title: string
  lead: string
  sections: Array<{ heading: string, body: string }>
}

/**
 * Deterministic parser for the constrained entity-markdown shape:
 * one H1, a lead paragraph, then optional `##` sections.
 * Lines inside ``` fences are content, never structure.
 */
export function parseMarkdown(body: string): MarkdownDoc {
  const lines = body.split('\n')
  let title = ''
  const leadLines: string[] = []
  const sections: Array<{ heading: string, body: string }> = []
  let current: { heading: string, lines: string[] } | null = null
  let seenTitle = false
  let inFence = false

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      if (current) current.lines.push(line)
      else if (seenTitle) leadLines.push(line)
      continue
    }
    if (inFence) {
      if (current) current.lines.push(line)
      else if (seenTitle) leadLines.push(line)
      continue
    }
    const h1 = line.match(/^# (.+)$/)
    const h2 = line.match(/^## (.+)$/)
    if (h1 && !seenTitle) {
      title = h1[1]!.trim()
      seenTitle = true
      continue
    }
    if (h2) {
      if (current) sections.push({ heading: current.heading, body: current.lines.join('\n').trim() })
      current = { heading: h2[1]!.trim(), lines: [] }
      continue
    }
    if (current) current.lines.push(line)
    else if (seenTitle) leadLines.push(line)
  }
  if (current) sections.push({ heading: current.heading, body: current.lines.join('\n').trim() })

  return { title, lead: leadLines.join('\n').trim(), sections }
}

export function section(doc: MarkdownDoc, heading: string): string | undefined {
  return doc.sections.find(candidate => candidate.heading.toLowerCase() === heading.toLowerCase())?.body
}

/** Ordered-list items ("1. step") from a section body. */
export function orderedList(body: string): string[] {
  return body.split('\n')
    .map(line => line.match(/^\s*\d+[.)]\s+(.*)$/)?.[1]?.trim())
    .filter((item): item is string => Boolean(item))
}

/** Bullet-list items ("- item") from a section body. */
export function bulletList(body: string): string[] {
  return body.split('\n')
    .map(line => line.match(/^\s*[-*]\s+(.*)$/)?.[1]?.trim())
    .filter((item): item is string => Boolean(item))
}
