import type { ReportWorkspace } from './reportWorkspace'
import { normalizeCoveragePath } from './coveragePaths'

/**
 * Coverage as one set.
 *
 * `coverage.md` authors four lists that share an entry shape. The report reads
 * them as one set of statements whose category is an attribute, so a category
 * with nothing in it renders nothing at all, and a statement with no paths is
 * simply one with no locations rather than a section of its own.
 */
export type CoverageStatementKind = 'covered' | 'exclusions' | 'unmapped' | 'limitations'

export interface CoverageStatement {
  kind: CoverageStatementKind
  description: string
  paths: string[]
}

export const COVERAGE_KIND_ORDER: CoverageStatementKind[] = ['covered', 'exclusions', 'unmapped', 'limitations']

export interface CoverageKindMeta {
  /** Heading over a count of these statements. */
  label: string
  /** Badge on one statement, where no heading names its category. */
  singular: string
  /** What the category means, in the format's own terms. */
  blurb: string
  icon: string
  tone: string
}

export const COVERAGE_KIND_META: Record<CoverageStatementKind, CoverageKindMeta> = {
  covered: {
    label: 'Covered',
    singular: 'Covered',
    blurb: 'Represented in the model',
    icon: 'i-lucide-circle-check',
    tone: '[--coverage-accent:var(--ui-color-success-800)] dark:[--coverage-accent:var(--ui-color-success-300)]'
  },
  exclusions: {
    label: 'Exclusions',
    singular: 'Excluded',
    blurb: 'Approved omissions',
    icon: 'i-lucide-circle-slash',
    tone: '[--coverage-accent:var(--ui-color-info-800)] dark:[--coverage-accent:var(--ui-color-info-300)]'
  },
  unmapped: {
    label: 'Unmapped',
    singular: 'Unmapped',
    blurb: 'Known modeling gaps',
    icon: 'i-lucide-circle-dashed',
    tone: '[--coverage-accent:var(--ui-color-warning-800)] dark:[--coverage-accent:var(--ui-color-warning-300)]'
  },
  limitations: {
    label: 'Limitations',
    singular: 'Limitation',
    blurb: 'Uncertainty in what could be established',
    icon: 'i-lucide-circle-help',
    tone: '[--coverage-accent:var(--ui-color-secondary-800)] dark:[--coverage-accent:var(--ui-color-secondary-300)]'
  }
}

export function coverageStatements(coverage: ReportWorkspace['coverage']): CoverageStatement[] {
  return COVERAGE_KIND_ORDER.flatMap(kind =>
    coverage[kind].map(area => ({ kind, description: area.description, paths: [...area.paths] })))
}

/**
 * The statements recorded at exactly this path.
 *
 * A folder never inherits what sits beneath it and never totals it: an authored
 * path locates a statement, and a count of "entries at or below" is neither
 * files nor completeness.
 */
export function coverageStatementsAt(statements: CoverageStatement[], path: string) {
  const selected = normalizeCoveragePath(path)
  return statements.filter(statement =>
    statement.paths.some(location => normalizeCoveragePath(location) === selected))
}

/** Statements a search matches, by their own words or by where they are recorded. */
export function coverageStatementMatches(statement: CoverageStatement, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return statement.description.toLowerCase().includes(needle)
    || statement.paths.some(location => location.toLowerCase().includes(needle))
}
