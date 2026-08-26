import { describe, expect, it } from 'vitest'
import { formatCodeTarget, parseCodeTarget } from '../src/core/coderefs.js'
import { entryPointsField, referencesField, repositoryReferencePath, splitFrontmatter } from '../src/core/frontmatter.js'
import { isId, slugify, stem } from '../src/core/ids.js'
import {
  bulletList, decisionPoints, orderedList, parseMarkdown, screenStates, section, supportingSections
} from '../src/core/markdown.js'

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

describe('code reference targets', () => {
  const parse = (value: string) => {
    const issues: string[] = []
    const ref = parseCodeTarget(value, issues, 't')
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
    expect(parse('../outside.ts').ref).toBeUndefined()
    expect(parse('https://example.com/app.ts').ref).toBeUndefined()
    expect(parse('src/app.ts:9-3').ref).toBeUndefined()
  })
  it('round-trips through format', () => {
    for (const value of ['src/app.ts', 'src/app.ts#App.run', 'src/app.ts:42-88', 'src/app.ts#App:7-9']) {
      const { ref } = parse(value)
      expect(formatCodeTarget(ref!)).toBe(value)
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
  it('accepts typed references and validates targets', () => {
    const issues: string[] = []
    const references = referencesField({ references: [
      { kind: 'prd', role: 'intent', target: 'docs/prds/checkout.md', title: 'Checkout PRD' },
      { kind: 'visual', role: 'intent', target: 'docs/ui/screen.png#empty', title: 'Empty state' },
      { kind: 'research', role: 'context', target: 'https://example.com/research' },
      { kind: 'code', role: 'implementation', target: 'src/screen.ts#render' }
    ] }, issues, 't')
    expect(references).toHaveLength(4)
    expect(repositoryReferencePath(references[0]!)).toBe('docs/prds/checkout.md')
    expect(repositoryReferencePath(references[1]!)).toBe('docs/ui/screen.png')
    expect(repositoryReferencePath(references[3]!)).toBe('src/screen.ts')
    expect(issues).toEqual([])

    const unsafe: string[] = []
    expect(referencesField({ references: [
      { kind: 'visual', role: 'intent', target: 'file:///tmp/screen.png' }
    ] }, unsafe, 't')).toEqual([])
    expect(unsafe.join('\n')).toContain('must use HTTP(S) or a repository-relative path')
  })

  it('rejects missing, unknown, and extra reference fields', () => {
    const issues: string[] = []
    expect(referencesField({ references: [
      { kind: 'visual', target: 'https://example.com' },
      { kind: 'binary', role: 'context', target: 'https://example.com' },
      { kind: 'doc', role: 'context', target: 'https://example.com', verified: true }
    ] }, issues, 't')).toEqual([])
    expect(issues.join('\n')).toContain('needs string "kind", "role", and "target"')
    expect(issues.join('\n')).toContain('reference kind "binary"')
    expect(issues.join('\n')).toContain('unknown key "verified"')
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
  it('parses decision points and preserves unrecognized sections', () => {
    const withDecision = parseMarkdown(
      '# Scenario\n\n## Decision points\n\n### Access\n\nCan the actor continue?\n\n'
      + '- allowed → continue\n- denied -> stop\n\n## Notes\n\nKeep this context.\n'
    )
    const issues: string[] = []
    expect(decisionPoints(section(withDecision, 'Decision points')!, issues, 'scenario')).toEqual([{
      title: 'Access',
      question: 'Can the actor continue?',
      branches: [
        { condition: 'allowed', outcome: 'continue' },
        { condition: 'denied', outcome: 'stop' }
      ]
    }])
    expect(issues).toEqual([])
    expect(supportingSections(withDecision, ['Decision points'])).toEqual([
      { heading: 'Notes', content: 'Keep this context.' }
    ])
  })
  it('parses embedded Screen view states', () => {
    const body = '### Available\n\nThe item can be selected.\n\n### Unavailable\n\nThe reason is shown.'
    const issues: string[] = []
    expect(screenStates(body, issues, 'screen')).toEqual([
      { title: 'Available', description: 'The item can be selected.' },
      { title: 'Unavailable', description: 'The reason is shown.' }
    ])
    expect(issues).toEqual([])

    const invalid: string[] = []
    screenStates('Prose before a state.', invalid, 'screen')
    expect(invalid.join('\n')).toContain('must begin with an H3 title')
  })
})
