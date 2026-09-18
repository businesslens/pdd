import type { ReportWorkspace } from './reportWorkspace'
import { normalizeCoveragePath } from './coveragePaths'
import { repositoryTree, type RepositoryTreeNode } from './repositoryTree'

type CoverageLocations = Pick<ReportWorkspace['coverage'], 'covered' | 'exclusions' | 'unmapped' | 'limitations'>
export type CoverageSourceFilter = 'all' | 'covered' | 'exclusions' | 'unmapped'
const contains = (parent: string, path: string) => parent === '.' || path === parent || path.startsWith(`${parent}/`)

/** Recorded locations only. Shared repository drawing supplies its own root. */
export function coverageTree(coverage: CoverageLocations, filter: CoverageSourceFilter = 'all'): RepositoryTreeNode[] {
  const paths = (['covered', 'exclusions', 'unmapped', 'limitations'] as const)
    .flatMap(kind => filter === 'all' || filter === kind ? coverage[kind].flatMap(area => area.paths) : [])
  const directories = new Set(paths.filter(path => path.endsWith('/')).map(normalizeCoveragePath))
  const nodes = repositoryTree([...new Set(paths.map(normalizeCoveragePath))].filter(path => path !== '.'))
  const finish = (nodes: RepositoryTreeNode[]): RepositoryTreeNode[] => nodes.map(node => ({
    ...node, directory: node.directory || directories.has(node.value), children: finish(node.children)
  })).sort((a, b) => Number(b.directory) - Number(a.directory) || a.label.localeCompare(b.label))
  return finish(nodes)
}

/** Distinct authored entries at or below a location, never inherited from a parent. */
export function coverageCounts(coverage: CoverageLocations, path: string) {
  const selected = normalizeCoveragePath(path)
  const includes = (path: string) => contains(selected, normalizeCoveragePath(path))
  const count = (kind: keyof CoverageLocations) => coverage[kind].filter(area => selected === '.' || area.paths.some(includes)).length
  return { covered: count('covered'), exclusions: count('exclusions'), unmapped: count('unmapped'), limitations: count('limitations') }
}
