import { describe, expect, it } from 'vitest'
const modulePath = '../layers/nuxt/report-viewer/app/utils/coveragePaths.ts'
const { coveragePathContext } = await import(modulePath)

const described = (paths: string[]) => paths.map((path, index) => ({ description: `Represented behavior ${index}`, paths: [path] }))

const workspace = {
  coverage: {
    covered: described(['src/', './notes/']),
    limitations: [{ description: 'A local uncertainty', paths: ['src/a.ts'] }, { description: 'A model-wide uncertainty', paths: [] }],
    exclusions: [{ description: 'An excluded area', paths: ['src/'] }],
    unmapped: [
      { description: 'A missing behavior', paths: ['src/a.ts', 'src/b.ts'] },
      { description: 'Planned behavior', paths: ['future/new.ts'] },
      { description: 'No location yet', paths: [] }
    ]
  },
  references: [
    { ownerKey: 'capability:read', ownerTitle: 'Read', reference: { target: 'src/a.ts#read' } },
    { ownerKey: 'capability:read', ownerTitle: 'Read', reference: { target: 'src/b.ts:20' } },
    { ownerKey: '', ownerTitle: 'Product', reference: { target: 'src/a.ts' } },
    { ownerKey: 'entity:thing', ownerTitle: 'Thing', reference: { target: 'src-other/a.ts' } },
    { ownerKey: '', ownerTitle: 'Product', reference: { target: 'https://example.com/src/a.ts' } }
  ]
}

describe('Coverage path context', () => {
  it('groups recorded descendant context without duplicating gaps or resource owners', () => {
    const context = coveragePathContext(workspace, 'src/')
    expect(context.covered).toEqual([workspace.coverage.covered[0]])
    expect(context.exclusions).toEqual(workspace.coverage.exclusions)
    expect(context.unmapped).toEqual([workspace.coverage.unmapped[0]])
    expect(context.owners.map((owner: any) => [owner.key, owner.references.length])).toEqual([['capability:read', 2], ['', 1]])
  })

  it('does not give a file the annotations of its containing folder', () => {
    const context = coveragePathContext(workspace, 'src/a.ts')
    expect(context.covered).toEqual([])
    expect(context.exclusions).toEqual([])
    expect(context.unmapped).toEqual([workspace.coverage.unmapped[0]])
    expect(context.owners.map((owner: any) => owner.references.length)).toEqual([1, 1])
    expect(coveragePathContext(workspace, 'src/unannotated.ts')).toEqual({ covered: [], exclusions: [], unmapped: [], limitations: [], owners: [] })
  })

  it('reads authored paths without requiring files or a repository inventory', () => {
    expect(coveragePathContext(workspace, 'future/new.ts').unmapped).toEqual([workspace.coverage.unmapped[1]])
    expect(coveragePathContext(workspace, 'notes').covered).toEqual([workspace.coverage.covered[1]])
    expect(coveragePathContext(workspace, './').covered).toEqual(workspace.coverage.covered)
    expect(coveragePathContext(workspace, '.').unmapped).toEqual(workspace.coverage.unmapped)
    expect(coveragePathContext(workspace, '.').limitations).toEqual(workspace.coverage.limitations)
    expect(coveragePathContext(workspace, 'src/a.ts').limitations).toEqual([workspace.coverage.limitations[0]])
  })
})

const treeModule = '../layers/nuxt/report-viewer/app/utils/coverageTree.ts'
const { coverageTree, coverageCounts } = await import(treeModule)
const repositoryModule = '../layers/nuxt/report-viewer/app/utils/repositoryTree.ts'
const { repositoryTreeNodes } = await import(repositoryModule)
const stateModule = '../layers/nuxt/report-viewer/app/utils/coverageState.ts'
const { coverageFromQuery, coverageToQuery } = await import(stateModule)

describe('shared Coverage tree', () => {
  it('merges overlapping annotations and path spellings into one location', () => {
    const coverage = {
      limitations: [],
      covered: described(['src/', './src/', 'src/a.ts']),
      exclusions: [{ description: 'Excluded behavior', paths: ['src/a.ts'] }],
      unmapped: [
        { description: 'First gap', paths: ['src/a.ts'] },
        { description: 'Second gap', paths: ['src/a.ts'] }
      ]
    }
    const nodes = repositoryTreeNodes(coverageTree(coverage))
    expect(nodes.map((node: any) => node.value)).toEqual(['src', 'src/a.ts'])
    expect(coverageCounts(coverage, 'src')).toEqual({ covered: 3, exclusions: 1, unmapped: 2, limitations: 0 })
    expect(coverageCounts(coverage, 'src/a.ts')).toEqual({ covered: 1, exclusions: 1, unmapped: 2, limitations: 0 })
    expect(coveragePathContext({ coverage, references: [] }, 'src').covered).toEqual(coverage.covered)
  })

  it('summarizes distinct entries below folders without inheriting parent annotations', () => {
    const coverage = {
      limitations: [],
      covered: described(['src/']),
      exclusions: [{ description: 'Excluded', paths: ['src', 'src/'] }, { description: 'Archive', paths: ['archive', 'archive/'] }],
      unmapped: [{ description: 'Missing behavior', paths: ['src/jobs/planned.ts', 'src/jobs/later.ts'] }]
    }
    const nodes = repositoryTreeNodes(coverageTree(coverage))
    expect(coverageCounts(coverage, 'src')).toEqual({ covered: 1, exclusions: 1, unmapped: 1, limitations: 0 })
    expect(nodes.find((node: any) => node.value === 'archive').directory).toBe(true)
    expect(coverageCounts(coverage, 'src/jobs/planned.ts')).toEqual({ covered: 0, exclusions: 0, unmapped: 1, limitations: 0 })
  })

  it('counts a multi-path covered entry once and keeps unlocated entries at the root', () => {
    const coverage = { limitations: [], covered: [{ description: 'Checkout', paths: ['src/', 'src/new/file.ts'] }, { description: 'Planned checkout', paths: [] }], exclusions: [], unmapped: [{ description: 'Planned', paths: ['src/new/file.ts'] }] }
    const nodes = repositoryTreeNodes(coverageTree(coverage))
    expect(nodes.map((node: any) => node.value)).toEqual(['src', 'src/new', 'src/new/file.ts'])
    expect(coverageCounts(coverage, '.')).toEqual({ covered: 2, exclusions: 0, unmapped: 1, limitations: 0 })
    expect(coverageCounts(coverage, 'src')).toEqual({ covered: 1, exclusions: 0, unmapped: 1, limitations: 0 })
  })

  it('filters recorded locations while retaining ancestors and overlapping annotations', () => {
    const coverage = { limitations: [], covered: described(['src/']), exclusions: [{ description: 'Excluded', paths: ['src/shared.ts'] }], unmapped: [{ description: 'Missing', paths: ['src/shared.ts', 'future/file.ts'] }] }
    expect(repositoryTreeNodes(coverageTree(coverage, 'exclusions')).map((node: any) => node.value)).toEqual(['src', 'src/shared.ts'])
    expect(coverageCounts(coverage, 'src/shared.ts')).toEqual({ covered: 0, exclusions: 1, unmapped: 1, limitations: 0 })
    expect(repositoryTreeNodes(coverageTree(coverage, 'covered')).map((node: any) => node.value)).toEqual(['src'])
    expect(repositoryTreeNodes(coverageTree(coverage, 'unmapped')).map((node: any) => node.value)).toContain('future/file.ts')
  })

  it('keeps a location recorded only by a limitation reachable without changing category totals', () => {
    const coverage = { covered: [], exclusions: [], unmapped: [], limitations: [{ description: 'Unknown retry policy', paths: ['jobs/retry.ts'] }] }
    expect(repositoryTreeNodes(coverageTree(coverage)).map((node: any) => node.value)).toEqual(['jobs', 'jobs/retry.ts'])
    expect(coverageCounts(coverage, 'jobs')).toEqual({ covered: 0, exclusions: 0, unmapped: 0, limitations: 1 })
    expect(coverageTree(coverage, 'covered')).toEqual([])
  })

  it('does not invent a repository location for unlocated annotations', () => {
    expect(coverageTree({ limitations: [], covered: described([]), exclusions: [{ description: 'Outside scope', paths: [] }], unmapped: [{ description: 'Unlocated gap', paths: [] }] })).toEqual([])
  })
})

it('round-trips the selected Coverage path, including the repository root', () => {
  const reading = { path: 'future/jobs/' }
  expect(coverageFromQuery(coverageToQuery(reading))).toEqual(reading)
  expect(coverageFromQuery({ cp: '.' })).toEqual({ path: '.' })
  expect(coverageFromQuery({ cp: ['src/'] })).toEqual({ path: null })
  expect(coverageToQuery({ path: null })).toEqual({ cp: undefined })
})
