import { describe, expect, it } from 'vitest'

const statementsModule = '../layers/nuxt/report-viewer/app/utils/coverageStatements.ts'
const { coverageStatements, coverageStatementIndex, coverageStatementMatches } = await import(statementsModule)
const treeModule = '../layers/nuxt/report-viewer/app/utils/coverageTree.ts'
const { coverageStatementTree } = await import(treeModule)
const repositoryModule = '../layers/nuxt/report-viewer/app/utils/repositoryTree.ts'
const { repositoryTreeNodes } = await import(repositoryModule)
const stateModule = '../layers/nuxt/report-viewer/app/utils/coverageState.ts'
const { coverageFromQuery, coverageToQuery } = await import(stateModule)

const described = (paths: string[]) => paths.map((path, index) => ({ description: `Represented behavior ${index}`, paths: [path] }))
const at = (coverage: any, path: string) => coverageStatementIndex(coverageStatements(coverage)).get(path.replace(/^\.\//, '').replace(/\/$/, '')) ?? []
const tree = (coverage: any, kind?: string) => coverageStatementTree(coverageStatements(coverage).filter((statement: any) => !kind || statement.kind === kind))

const coverage = {
  covered: described(['src/', './notes/']),
  limitations: [{ description: 'A local uncertainty', paths: ['src/a.ts'] }, { description: 'A model-wide uncertainty', paths: [] }],
  exclusions: [{ description: 'An excluded area', paths: ['src/'] }],
  unmapped: [
    { description: 'A missing behavior', paths: ['src/a.ts', 'src/b.ts'] },
    { description: 'Planned behavior', paths: ['future/new.ts'] },
    { description: 'No location yet', paths: [] }
  ]
}

describe('Coverage as one set of statements', () => {
  it('reads the four authored lists as one set whose category is an attribute', () => {
    const statements = coverageStatements(coverage)
    expect(statements).toHaveLength(8)
    expect(statements.map((statement: any) => statement.kind)).toEqual([
      'covered', 'covered', 'exclusions', 'unmapped', 'unmapped', 'unmapped', 'limitations', 'limitations'
    ])
    expect(statements.filter((statement: any) => !statement.paths.length).map((statement: any) => statement.description))
      .toEqual(['No location yet', 'A model-wide uncertainty'])
  })

  it('gives a folder only what is recorded at it, never what sits beneath it', () => {
    expect(at(coverage, 'src/').map((statement: any) => statement.description))
      .toEqual(['Represented behavior 0', 'An excluded area'])
    // The folder's own annotations never reach the file inside it.
    expect(at(coverage, 'src/a.ts').map((statement: any) => statement.description))
      .toEqual(['A missing behavior', 'A local uncertainty'])
    expect(at(coverage, 'src/unannotated.ts')).toEqual([])
  })

  it('matches authored path spellings without requiring a file or an inventory', () => {
    expect(at(coverage, 'src').map((statement: any) => statement.kind)).toEqual(['covered', 'exclusions'])
    expect(at(coverage, './src/').map((statement: any) => statement.kind)).toEqual(['covered', 'exclusions'])
    expect(at(coverage, 'notes').map((statement: any) => statement.description)).toEqual(['Represented behavior 1'])
    expect(at(coverage, 'future/new.ts').map((statement: any) => statement.description)).toEqual(['Planned behavior'])
  })

  it('writes a multi-path statement under each path it names', () => {
    expect(at(coverage, 'src/a.ts').map((statement: any) => statement.description)).toContain('A missing behavior')
    expect(at(coverage, 'src/b.ts').map((statement: any) => statement.description)).toEqual(['A missing behavior'])
  })

  it('never resolves the repository root to everything recorded', () => {
    expect(at(coverage, '.')).toEqual([])
  })

  it('finds a statement by its own words or by where it is recorded', () => {
    const [missing] = coverageStatements(coverage).filter((statement: any) => statement.description === 'A missing behavior')
    expect(coverageStatementMatches(missing, '')).toBe(true)
    expect(coverageStatementMatches(missing, 'MISSING behavior')).toBe(true)
    expect(coverageStatementMatches(missing, 'src/b.ts')).toBe(true)
    expect(coverageStatementMatches(missing, 'future')).toBe(false)
  })
})

describe('Coverage location tree', () => {
  it('merges overlapping annotations and path spellings into one location', () => {
    const merged = {
      limitations: [],
      covered: described(['src/', './src/', 'src/a.ts']),
      exclusions: [{ description: 'Excluded behavior', paths: ['src/a.ts'] }],
      unmapped: [
        { description: 'First gap', paths: ['src/a.ts'] },
        { description: 'Second gap', paths: ['src/a.ts'] }
      ]
    }
    expect(repositoryTreeNodes(tree(merged)).map((node: any) => node.value)).toEqual(['src', 'src/a.ts'])
    expect(at(merged, 'src')).toHaveLength(2)
    expect(at(merged, 'src/a.ts').map((statement: any) => statement.kind)).toEqual(['covered', 'exclusions', 'unmapped', 'unmapped'])
  })

  it('records a statement once at a location it names in two spellings', () => {
    const doubled = { limitations: [], covered: [], unmapped: [], exclusions: [{ description: 'Excluded', paths: ['src', 'src/'] }] }
    expect(at(doubled, 'src')).toHaveLength(1)
  })

  it('keeps a directory a directory and locates statements written below one', () => {
    const nested = {
      limitations: [],
      covered: described(['src/']),
      exclusions: [{ description: 'Excluded', paths: ['src', 'src/'] }, { description: 'Archive', paths: ['archive', 'archive/'] }],
      unmapped: [{ description: 'Missing behavior', paths: ['src/jobs/planned.ts', 'src/jobs/later.ts'] }]
    }
    const nodes = repositoryTreeNodes(tree(nested))
    expect(nodes.find((node: any) => node.value === 'archive').directory).toBe(true)
    // `src/jobs/` is structure only; nothing is recorded at it.
    expect(at(nested, 'src/jobs')).toEqual([])
    expect(at(nested, 'src/jobs/planned.ts').map((statement: any) => statement.description)).toEqual(['Missing behavior'])
  })

  it('draws every location a narrowed set of statements names', () => {
    const narrowed = { limitations: [], covered: described(['src/']), exclusions: [{ description: 'Excluded', paths: ['src/shared.ts'] }], unmapped: [{ description: 'Missing', paths: ['src/shared.ts', 'future/file.ts'] }] }
    const statements = coverageStatements(narrowed)
    const only = (kind: string) => statements.filter((statement: any) => statement.kind === kind)
    expect(repositoryTreeNodes(coverageStatementTree(only('exclusions'))).map((node: any) => node.value)).toEqual(['src', 'src/shared.ts'])
    expect(repositoryTreeNodes(coverageStatementTree(only('covered'))).map((node: any) => node.value)).toEqual(['src'])
    expect(repositoryTreeNodes(coverageStatementTree(only('unmapped'))).map((node: any) => node.value)).toContain('future/file.ts')
  })

  it('filters Limitations alongside the other three categories', () => {
    const uncertain = { covered: [], exclusions: [], unmapped: [], limitations: [{ description: 'Unknown retry policy', paths: ['jobs/retry.ts'] }] }
    expect(repositoryTreeNodes(tree(uncertain)).map((node: any) => node.value)).toEqual(['jobs', 'jobs/retry.ts'])
    expect(repositoryTreeNodes(tree(uncertain, 'limitations')).map((node: any) => node.value)).toEqual(['jobs', 'jobs/retry.ts'])
    expect(tree(uncertain, 'covered')).toEqual([])
    expect(at(uncertain, 'jobs/retry.ts').map((statement: any) => statement.kind)).toEqual(['limitations'])
  })

  it('does not invent a repository location for unlocated statements', () => {
    const unlocated = { limitations: [], covered: described([]), exclusions: [{ description: 'Outside scope', paths: [] }], unmapped: [{ description: 'Unlocated gap', paths: [] }] }
    expect(tree(unlocated)).toEqual([])
  })
})

it('round-trips the focused Coverage path, including the repository root', () => {
  const reading = { path: 'future/jobs/' }
  expect(coverageFromQuery(coverageToQuery(reading))).toEqual(reading)
  expect(coverageFromQuery({ cp: '.' })).toEqual({ path: '.' })
  expect(coverageFromQuery({ cp: ['src/'] })).toEqual({ path: null })
  expect(coverageToQuery({ path: null })).toEqual({ cp: undefined })
})
