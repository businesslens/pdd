import type { ReportWorkspace } from './reportWorkspace'
import { normalizeCoveragePath } from './coveragePaths'

/**
 * Coverage as one set.
 *
 * `coverage.md` authors four lists that share an entry shape. The report reads
 * them as one set of statements whose category is an attribute, so a category
 * with nothing in it renders nothing at all. Every statement names the code it
 * is about, so every statement has at least one location.
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
  /** One mark per category wherever it appears, each with its own outline. */
  icon: string
  tone: string
}

export const COVERAGE_KIND_META: Record<CoverageStatementKind, CoverageKindMeta> = {
  covered: {
    label: 'Covered',
    singular: 'Covered',
    blurb: 'Code the model describes',
    icon: 'i-lucide-circle-check',
    tone: '[--coverage-accent:var(--blr-coverage-covered)]'
  },
  exclusions: {
    label: 'Exclusions',
    singular: 'Excluded',
    blurb: 'Code that is not product behavior',
    icon: 'i-lucide-square-minus',
    tone: '[--coverage-accent:var(--blr-coverage-exclusions)]'
  },
  unmapped: {
    label: 'Unmapped',
    singular: 'Unmapped',
    blurb: 'Code with behavior not yet modeled',
    icon: 'i-lucide-circle-dashed',
    tone: '[--coverage-accent:var(--blr-coverage-unmapped)]'
  },
  limitations: {
    label: 'Limitations',
    singular: 'Limitation',
    blurb: 'Code whose behavior could not be established',
    icon: 'i-lucide-triangle-alert',
    tone: '[--coverage-accent:var(--blr-coverage-limitations)]'
  }
}

export function coverageStatements(coverage: ReportWorkspace['coverage']): CoverageStatement[] {
  return COVERAGE_KIND_ORDER.flatMap(kind =>
    coverage[kind].map(area => ({ kind, description: area.description, paths: [...area.paths] })))
}

/**
 * The statements recorded at each exact path, in authored order.
 *
 * A folder never inherits what sits beneath it and never totals it: an authored
 * path locates a statement, and a count of "entries at or below" is neither
 * files nor completeness. A statement naming one location in two spellings is
 * recorded there once.
 */
export function coverageStatementIndex(statements: CoverageStatement[]) {
  const index = new Map<string, CoverageStatement[]>()
  for (const statement of statements) {
    for (const path of new Set(statement.paths.map(normalizeCoveragePath))) {
      index.set(path, [...index.get(path) ?? [], statement])
    }
  }
  return index
}

/**
 * A recorded path a search finds: its name contains the query, as in a file
 * finder. It is matched as written, so a folder keeps its trailing `/`.
 */
export function coveragePathMatches(path: string, query: string) {
  const needle = query.trim().toLowerCase()
  return !needle || path.toLowerCase().includes(needle)
}

/**
 * Whether Coverage records any code. A model tied to no code yet — every
 * Blueprint, any model decided before its code — records none, and its reading
 * says so instead of drawing empty cards.
 */
export function coverageRecordsCode(coverage: Pick<ReportWorkspace['coverage'], CoverageStatementKind>) {
  return COVERAGE_KIND_ORDER.some(kind => coverage[kind].length > 0)
}
