import { normalizeCoveragePath } from './coveragePaths'
import { repositoryTree, type RepositoryTreeNode } from './repositoryTree'
import type { CoverageStatement } from './coverageStatements'

/** The locations of an already-narrowed set of statements. */
export function coverageStatementTree(statements: CoverageStatement[]): RepositoryTreeNode[] {
  const paths = statements.flatMap(statement => statement.paths)
  const directories = new Set(paths.filter(path => path.endsWith('/')).map(normalizeCoveragePath))
  const nodes = repositoryTree([...new Set(paths.map(normalizeCoveragePath))])
  const finish = (nodes: RepositoryTreeNode[]): RepositoryTreeNode[] => nodes.map(node => ({
    ...node, directory: node.directory || directories.has(node.value), children: finish(node.children)
  })).sort((a, b) => Number(b.directory) - Number(a.directory) || a.label.localeCompare(b.label))
  return finish(nodes)
}
