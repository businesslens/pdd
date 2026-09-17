import { describe, expect, it } from 'vitest'
const modulePath = '../layers/nuxt/report-viewer/app/utils/coverageRepository.ts'
const { coverageRepository, coverageTreeNodes, filterCoverageTree } = await import(modulePath)

describe('repository annotations', () => {
  it('keeps inspection, gaps, and references independent and counts distinct resources and gaps', () => {
    const workspace = {
      coverage: { exclusions: [], sourceAreas: ['src/'], unmapped: [{ description: 'Some behavior remains unmapped.', paths: ['src/', 'src/a.ts'] }, { description: 'No location yet.', paths: [] }] },
      references: [
        { ownerKey: 'capability:read', reference: { kind: 'code', target: 'src/a.ts#read' } },
        { ownerKey: 'capability:read', reference: { kind: 'code', target: 'src/b.ts:20' } },
        { ownerKey: 'entity:thing', reference: { kind: 'code', target: 'src/a.ts:10' } },
        { ownerKey: 'product', reference: { kind: 'doc', target: 'https://example.com/' } }
      ]
    }
    const tree = coverageRepository(workspace, ['src/a.ts', 'src/b.ts', 'unreviewed/file.ts'])
    const nodes = coverageTreeNodes(tree)
    const src = nodes.find((node: any) => node.value === 'src')
    expect(src.sources).toEqual([0])
    expect(src.gaps).toEqual([0])
    expect(src.owners.sort()).toEqual(['capability:read', 'entity:thing'])
    const file = nodes.find((node: any) => node.value === 'src/a.ts')
    expect(file.sources).toEqual([])
    expect(file.gaps).toEqual([0])
    expect(nodes.find((node: any) => node.value === 'unreviewed/file.ts')).toMatchObject({ sources: [], gaps: [], owners: [] })
    expect(nodes.some((node: any) => node.value.includes('https:'))).toBe(false)
    expect(filterCoverageTree(tree, 'b.ts')[0].children.map((node: any) => node.value)).toEqual(['src/b.ts'])
    expect(filterCoverageTree(tree, 'nothing')).toEqual([])
  })

  it('retains annotations absent from the live inventory and all exact source-area entries', () => {
    const workspace = { coverage: { exclusions: [], sourceAreas: ['src/', 'src', './notes/', 'design notes'], unmapped: [{ description: 'Planned', paths: ['future/jobs/'] }] }, references: [] }
    const nodes = coverageTreeNodes(coverageRepository(workspace, []))
    expect(nodes.find((node: any) => node.value === 'src').sources).toEqual([0, 1])
    expect(nodes.find((node: any) => node.value === 'notes').sources).toEqual([2])
    expect(nodes.find((node: any) => node.value === 'future/jobs').gaps).toEqual([0])
    expect(nodes.find((node: any) => node.value === 'design notes').sources).toEqual([3])
  })
})

it('keeps exclusions independent, retains deleted review paths and aggregates exact file changes', () => {
  const workspace = { coverage: { exclusions: [{ description: 'Excluded contract', paths: ['src/'] }], sourceAreas: ['src/'], unmapped: [{ description: 'Known gap', paths: ['src/current.ts'] }] }, references: [] }
  const review = { files: [{ path: 'src/current.ts', change: 'modified' }, { path: 'src/removed.ts', change: 'deleted' }], pending: null }
  const nodes = coverageTreeNodes(coverageRepository(workspace, ['src/current.ts', 'src/new.ts'], review))
  expect(nodes.find((node: any) => node.value === 'src')).toMatchObject({ exclusions: [0], changes: { modified: 1, deleted: 1 }, reviewPaths: ['src/current.ts', 'src/removed.ts'] })
  expect(nodes.find((node: any) => node.value === 'src/removed.ts')).toMatchObject({ changes: { deleted: 1 }, sources: [], exclusions: [] })
  expect(nodes.find((node: any) => node.value === 'src/new.ts')).toMatchObject({ changes: {}, reviewPaths: [], exclusions: [] })
})

it('shows saved review paths without claiming current file states when no live comparison exists', () => {
  const workspace = { coverage: { exclusions: [], sourceAreas: [], unmapped: [] }, references: [] }
  const review = { baseline: { files: [{ path: 'history/only-in-review.ts' }] }, files: [], pending: null }
  const nodes = coverageTreeNodes(coverageRepository(workspace, [], review))
  expect(nodes.find((node: any) => node.value === 'history/only-in-review.ts')).toMatchObject({ changes: {}, reviewPaths: ['history/only-in-review.ts'] })
})
