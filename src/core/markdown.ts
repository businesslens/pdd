export interface MarkdownDoc {
  title: string
  lead: string
  sections: Array<{ heading: string, body: string }>
}

export interface MarkdownDecisionPoint {
  title: string
  question: string
  branches: Array<{ condition: string, outcome: string }>
}

export interface MarkdownScreenState {
  title: string
  description: string
}

export interface MarkdownSupportingSection {
  heading: string
  content: string
}

/** Whether a Markdown fragment contains an unfenced structural H1 or H2. */
export function containsStructuralHeading(value: string): boolean {
  let inFence = false
  for (const line of value.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
    } else if (!inFence && /^#{1,2}\s/.test(line)) {
      return true
    }
  }
  return false
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

/** Preserve all unrecognized H2 sections as structured report content. */
export function supportingSections(
  doc: MarkdownDoc,
  recognizedHeadings: string[]
): MarkdownSupportingSection[] {
  const recognized = new Set(recognizedHeadings.map(heading => heading.toLowerCase()))
  return doc.sections
    .filter(candidate => !recognized.has(candidate.heading.toLowerCase()))
    .map(candidate => ({ heading: candidate.heading, content: candidate.body }))
}

/**
 * Parse the constrained Decision points section:
 * H3 title, question prose, then `condition → outcome` bullet branches.
 */
export function decisionPoints(
  body: string,
  issues: string[],
  label: string
): MarkdownDecisionPoint[] {
  if (!body.trim()) return []
  const lines = body.split('\n')
  const chunks: Array<{ title: string, lines: string[] }> = []
  let current: { title: string, lines: string[] } | undefined

  for (const line of lines) {
    const heading = line.match(/^### (.+)$/)
    if (heading) {
      if (current) chunks.push(current)
      current = { title: heading[1]!.trim(), lines: [] }
      continue
    }
    if (!current) {
      if (line.trim()) issues.push(`${label}: "## Decision points" content must begin with an H3 title`)
      continue
    }
    current.lines.push(line)
  }
  if (current) chunks.push(current)

  return chunks.map((chunk) => {
    const questionLines: string[] = []
    const branches: Array<{ condition: string, outcome: string }> = []
    for (const line of chunk.lines) {
      const bullet = line.match(/^\s*[-*]\s+(.+)$/)
      if (!bullet) {
        if (!branches.length) questionLines.push(line)
        else if (line.trim()) issues.push(`${label}: decision "${chunk.title}" has prose after its branches`)
        continue
      }
      const branch = bullet[1]!.split(/\s*(?:→|->)\s*/, 2)
      if (branch.length !== 2 || !branch[0]?.trim() || !branch[1]?.trim()) {
        issues.push(`${label}: decision "${chunk.title}" branch must use "condition → outcome"`)
        continue
      }
      branches.push({ condition: branch[0].trim(), outcome: branch[1].trim() })
    }
    const question = questionLines.join('\n').trim()
    if (!question) issues.push(`${label}: decision "${chunk.title}" needs a question`)
    if (branches.length < 2) issues.push(`${label}: decision "${chunk.title}" needs at least two branches`)
    return { title: chunk.title, question, branches }
  })
}

/** Parse Screen product states: one H3 name followed by non-empty prose. */
export function screenStates(
  body: string,
  issues: string[],
  label: string,
  heading = 'Product states',
  noun = 'product state'
): MarkdownScreenState[] {
  if (!body.trim()) return []
  const lines = body.split('\n')
  const chunks: Array<{ title: string, lines: string[] }> = []
  let current: { title: string, lines: string[] } | undefined

  for (const line of lines) {
    const heading = line.match(/^### (.+)$/)
    if (heading) {
      if (current) chunks.push(current)
      current = { title: heading[1]!.trim(), lines: [] }
      continue
    }
    if (!current) {
      if (line.trim()) issues.push(`${label}: "## ${heading}" content must begin with an H3 title`)
      continue
    }
    current.lines.push(line)
  }
  if (current) chunks.push(current)

  return chunks.map((chunk) => {
    const description = chunk.lines.join('\n').trim()
    if (!chunk.title) issues.push(`${label}: ${noun} needs a title`)
    if (!description) issues.push(`${label}: ${noun} "${chunk.title}" needs a description`)
    return { title: chunk.title, description }
  })
}
