import { describe, expect, it } from 'vitest'
import { parseCodeRef, formatCodeRef } from '../src/core/coderefs.js'
import { splitFrontmatter, entryPointsField } from '../src/core/frontmatter.js'
import { isId, slugify, stem } from '../src/core/ids.js'
import { bulletList, orderedList, parseMarkdown, section } from '../src/core/markdown.js'

describe('ids', () => {
  it('accepts kebab-case and rejects everything else', () => {
    expect(isId('browse-and-buy')).toBe(true)
    expect(isId('Browse')).toBe(false)
    expect(isId('a--b')).toBe(false)
    expect(isId('-a')).toBe(false)
  })
  it('slugifies and stems', () => {
    expect(slugify('Acme Shop!')).toBe('acme-shop')
    expect(stem('actors/shopper.md')).toBe('shopper')
  })
})

describe('coderefs', () => {
  const parse = (value: string) => {
    const issues: string[] = []
    const ref = parseCodeRef(value, issues, 't')
    return { ref, issues }
  }
  it('parses path only', () => {
    expect(parse('src/app.ts').ref).toEqual({ path: 'src/app.ts', symbol: undefined, startLine: undefined, endLine: undefined })
  })
  it('parses symbol and line ranges', () => {
    expect(parse('src/app.ts#App.run').ref).toMatchObject({ path: 'src/app.ts', symbol: 'App.run' })
    expect(parse('src/app.ts:42-88').ref).toMatchObject({ path: 'src/app.ts', startLine: 42, endLine: 88 })
    expect(parse('src/app.ts#App:7').ref).toMatchObject({ path: 'src/app.ts', symbol: 'App', startLine: 7 })
  })
  it('keeps colons that are not line suffixes in the path', () => {
    expect(parse('src/a:b.ts').ref).toMatchObject({ path: 'src/a:b.ts' })
  })
  it('rejects absolute paths and inverted ranges', () => {
    expect(parse('/etc/passwd').ref).toBeUndefined()
    expect(parse('src/app.ts:9-3').ref).toBeUndefined()
  })
  it('round-trips through format', () => {
    for (const value of ['src/app.ts', 'src/app.ts#App.run', 'src/app.ts:42-88', 'src/app.ts#App:7-9']) {
      const { ref } = parse(value)
      expect(formatCodeRef(ref!)).toBe(value)
    }
  })
})

describe('frontmatter', () => {
  it('splits data and body', () => {
    const issues: string[] = []
    const { data, body } = splitFrontmatter('---\nkind: primary\n---\n# T\n', issues, 't')
    expect(data.kind).toBe('primary')
    expect(body).toContain('# T')
    expect(issues).toEqual([])
  })
  it('parses compact entry points and flags bad shapes', () => {
    const issues: string[] = []
    const points = entryPointsField({ entryPoints: [{ web: '/x' }, 'bad'] }, issues, 't')
    expect(points).toEqual([{ type: 'web', path: '/x' }])
    expect(issues).toHaveLength(1)
  })
  it('handles CRLF line endings', () => {
    const issues: string[] = []
    const { data, body } = splitFrontmatter('---\r\nkind: primary\r\n---\r\n# T\r\n\r\nLead.\r\n', issues, 't')
    expect(data.kind).toBe('primary')
    expect(issues).toEqual([])
    const doc = parseMarkdown(body)
    expect(doc.title).toBe('T')
    expect(doc.lead).toBe('Lead.')
  })
})

describe('markdown', () => {
  const doc = parseMarkdown('# Title\n\nLead paragraph.\n\n## Steps\n\n1. one\n2. two\n\n## Edge cases\n\n- boom\n')
  it('extracts title, lead, and sections', () => {
    expect(doc.title).toBe('Title')
    expect(doc.lead).toBe('Lead paragraph.')
    expect(orderedList(section(doc, 'Steps')!)).toEqual(['one', 'two'])
    expect(bulletList(section(doc, 'Edge cases')!)).toEqual(['boom'])
  })
  it('treats fenced code as content, not structure', () => {
    const fenced = parseMarkdown('# Title\n\nLead.\n\n## Notes\n\n```sh\n# a comment\n## another comment\n```\n\nAfter.\n')
    expect(fenced.title).toBe('Title')
    expect(fenced.lead).toBe('Lead.')
    expect(fenced.sections).toHaveLength(1)
    expect(section(fenced, 'Notes')).toContain('# a comment')
    expect(section(fenced, 'Notes')).toContain('After.')
  })
  it('handles a fence in the lead before any section', () => {
    const fenced = parseMarkdown('# Title\n\nLead.\n\n```\n## trap\n```\n\n## Real\n\nBody.\n')
    expect(fenced.sections.map(entry => entry.heading)).toEqual(['Real'])
    expect(fenced.lead).toContain('## trap')
  })
})
