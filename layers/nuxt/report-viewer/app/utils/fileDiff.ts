import { diffLines, diffWordsWithSpace } from 'diff'

export interface DiffLine {
  kind: 'context' | 'added' | 'removed'
  before: number | null
  after: number | null
  text: string
  ending: 'lf' | 'crlf' | 'none'
  segments: Array<{ text: string, changed: boolean }>
}
export interface DiffBlock { key: number, hidden: boolean, lines: DiffLine[] }

/** Preserve exact whitespace and final newlines; bound expensive rewrites. */
export function fileDiff(before: string, after: string) {
  const changes = diffLines(before, after, { timeout: 60, maxEditLength: 2000 })
  const parts = changes ?? [{ value: before, removed: true, added: false }, { value: after, added: true, removed: false }]
  let left = 1, right = 1
  const lines: DiffLine[] = parts.flatMap(part => {
    const kind = part.added ? 'added' : part.removed ? 'removed' : 'context'
    return (part.value.match(/[^\n]*\n|[^\n]+$/g) ?? []).map(raw => {
      const ending = raw.endsWith('\r\n') ? 'crlf' : raw.endsWith('\n') ? 'lf' : 'none'
      const text = raw.slice(0, raw.length - (ending === 'crlf' ? 2 : ending === 'lf' ? 1 : 0))
      return { kind, before: kind === 'added' ? null : left++, after: kind === 'removed' ? null : right++, text, ending,
        segments: [{ text, changed: false }] }
    })
  })
  const deadline = Date.now() + 60
  for (let start = 0; start < lines.length;) {
    if (lines[start]!.kind === 'context') { start++; continue }
    let end = start
    while (end < lines.length && lines[end]!.kind !== 'context') end++
    const removed = lines.slice(start, end).filter(line => line.kind === 'removed')
    const added = lines.slice(start, end).filter(line => line.kind === 'added')
    for (let index = 0; index < Math.min(removed.length, added.length) && Date.now() < deadline; index++) {
      const from = removed[index]!, to = added[index]!
      if (from.text.length + to.text.length > 4000) continue
      const words = diffWordsWithSpace(from.text, to.text, { timeout: 5, maxEditLength: 200 })
      if (!words) continue
      from.segments = words.filter(word => !word.added).map(word => ({ text: word.value, changed: !!word.removed }))
      to.segments = words.filter(word => !word.removed).map(word => ({ text: word.value, changed: !!word.added }))
    }
    start = end
  }
  return { lines, coarse: !changes, added: right - 1 - lines.filter(line => line.kind === 'context').length,
    removed: left - 1 - lines.filter(line => line.kind === 'context').length }
}

/** Only unchanged lines can fold; gaps keep their exact original positions. */
export function diffBlocks(lines: DiffLine[], context = 3): DiffBlock[] {
  const visible = new Set<number>()
  lines.forEach((line, index) => {
    if (line.kind !== 'context') for (let at = Math.max(0, index - context); at <= Math.min(lines.length - 1, index + context); at++) visible.add(at)
  })
  const blocks: DiffBlock[] = []
  lines.forEach((line, index) => {
    const hidden = !visible.has(index)
    let block = blocks.at(-1)
    if (!block || block.hidden !== hidden) { block = { key: index, hidden, lines: [] }; blocks.push(block) }
    block.lines.push(line)
  })
  return blocks
}

/** Pair changed runs without introducing a second, independently scrolling pane. */
export function splitDiffLines(lines: DiffLine[]): Array<{ before: DiffLine | null, after: DiffLine | null }> {
  const rows: Array<{ before: DiffLine | null, after: DiffLine | null }> = []
  for (let index = 0; index < lines.length;) {
    const line = lines[index]!
    if (line.kind === 'context') { rows.push({ before: line, after: line }); index++; continue }
    const removed: DiffLine[] = [], added: DiffLine[] = []
    while (index < lines.length && lines[index]!.kind !== 'context') {
      const next = lines[index++]!
      ;(next.kind === 'removed' ? removed : added).push(next)
    }
    for (let at = 0; at < Math.max(removed.length, added.length); at++) rows.push({ before: removed[at] ?? null, after: added[at] ?? null })
  }
  return rows
}
