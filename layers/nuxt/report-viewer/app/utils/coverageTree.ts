import type { ReportWorkspace } from './reportWorkspace'
import { normalizeCoveragePath } from './coveragePaths'
import { repositoryTree, type RepositoryTreeNode } from './repositoryTree'
import type { CoverageStatement, CoverageStatementKind } from './coverageStatements'

type CoverageLocations = Pick<ReportWorkspace['coverage'], 'covered' | 'exclusions' | 'unmapped' | 'limitations'>
export type CoverageSourceFilter = 'all' | CoverageStatementKind

/** Recorded locations only; the reading supplies its own Repository root. */
export function coverageTree(coverage: CoverageLocations, filter: CoverageSourceFilter = 'all'): RepositoryTreeNode[] {
  const paths = (['covered', 'exclusions', 'unmapped', 'limitations'] as const)
    .flatMap(kind => filter === 'all' || filter === kind ? coverage[kind].flatMap(area => area.paths) : [])
  return finishCoverageTree(paths)
}

/** The locations of a already-narrowed set of statements. */
export function coverageStatementTree(statements: CoverageStatement[]): RepositoryTreeNode[] {
  return finishCoverageTree(statements.flatMap(statement => statement.paths))
}

function finishCoverageTree(paths: string[]): RepositoryTreeNode[] {
  const directories = new Set(paths.filter(path => path.endsWith('/')).map(normalizeCoveragePath))
  const nodes = repositoryTree([...new Set(paths.map(normalizeCoveragePath))].filter(path => path !== '.'))
  const finish = (nodes: RepositoryTreeNode[]): RepositoryTreeNode[] => nodes.map(node => ({
    ...node, directory: node.directory || directories.has(node.value), children: finish(node.children)
  })).sort((a, b) => Number(b.directory) - Number(a.directory) || a.label.localeCompare(b.label))
  return finish(nodes)
}
