import { normalizeCoveragePath } from './coveragePaths'
import { locationTree, type RepositoryTreeNode } from './repositoryTree'
import type { CoverageStatement } from './coverageStatements'

/** The locations of an already-narrowed set of statements. */
export function coverageStatementTree(statements: CoverageStatement[]): RepositoryTreeNode[] {
  const paths = statements.flatMap(statement => statement.paths)
  const directories = new Set(paths.filter(path => path.endsWith('/')).map(normalizeCoveragePath))
  return locationTree(paths.map(normalizeCoveragePath), directories)
}
