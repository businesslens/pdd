import { describe, expect, it } from 'vitest'
const modulePath = '../layers/nuxt/report-viewer/app/utils/fileDiff.ts'
const { fileDiff, diffBlocks, splitDiffLines } = await import(modulePath)

const restore = (lines: any[], side: 'before' | 'after') => lines.filter(line => line[side] !== null)
  .map(line => line.text + ({ lf: '\n', crlf: '\r\n', none: '' } as const)[line.ending as 'lf']).join('')

describe('file review diff', () => {
  it.each([
    ['', 'new file\n'], ['deleted\n', ''], ['', ''],
    ['same\n', 'same\n'], ['trailing\n', 'trailing'],
    ['  name: old\n\nend\n', '  name: new\n\nend\n'],
    ['a\r\nb\r\n', 'a\nb\n'], ['x\nx\nx\n', 'x\ny\nx\n'],
    ['α🙂\n<script>alert(1)</script>', 'α🙃\n<img src=x>'],
    ['name: a b\n', 'name: a  b\n']
  ])('preserves both exact inputs (%j → %j)', (before, after) => {
    const diff = fileDiff(before, after)
    expect(restore(diff.lines, 'before')).toBe(before)
    expect(restore(diff.lines, 'after')).toBe(after)
    for (const line of diff.lines) expect(line.segments.map((part: any) => part.text).join('')).toBe(line.text)
    expect(splitDiffLines(diff.lines).flatMap((row: any) => row.before ? [row.before] : []).map((line: any) => line.before)).toEqual(diff.lines.filter((line: any) => line.before !== null).map((line: any) => line.before))
  })

  it('highlights only edited words within paired lines and counts added/removed lines', () => {
    const diff = fileDiff('title: Old title\nkeep\n', 'title: New title\nkeep\nextra\n')
    expect(diff).toMatchObject({ added: 2, removed: 1, coarse: false })
    expect(diff.lines[0].segments.filter((part: any) => part.changed).map((part: any) => part.text).join('')).toBe('Old')
    expect(diff.lines[1].segments.filter((part: any) => part.changed).map((part: any) => part.text).join('')).toBe('New')
  })

  it('folds only unchanged context and keeps every edit and line number', () => {
    const before = Array.from({ length: 70 }, (_, i) => `line ${i}\n`).join('')
    const after = before.replace('line 20\n', 'changed 20\n').replace('line 50\n', 'changed 50\n')
    const diff = fileDiff(before, after), blocks = diffBlocks(diff.lines)
    expect(blocks.filter((block: any) => block.hidden)).toHaveLength(3)
    expect(blocks.flatMap((block: any) => block.lines)).toEqual(diff.lines)
    expect(blocks.filter((block: any) => block.hidden).every((block: any) => block.lines.every((line: any) => line.kind === 'context'))).toBe(true)
    expect(diff.lines.find((line: any) => line.text === 'changed 20').after).toBe(21)
  })

  it('keeps a bounded large-rewrite fallback lossless', () => {
    const before = Array.from({ length: 2200 }, (_, i) => `before-${i}\n`).join('')
    const after = Array.from({ length: 2200 }, (_, i) => `after-${i}\n`).join('')
    const diff = fileDiff(before, after)
    expect(diff.coarse).toBe(true)
    expect(restore(diff.lines, 'before')).toBe(before)
    expect(restore(diff.lines, 'after')).toBe(after)
  })
})
