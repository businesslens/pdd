/** Local comparison data; never part of a portable Product Report. */
import { parseCodeTarget } from './coderefs.js'
import type { ProductReportV16, ReportReference } from './portable.js'
import { reportResourceCollections } from './portable.js'

export type ReferenceFileSnapshot =
  | { status: 'present', digest: string, bytes: number, text: string | null, omitted: 'binary' | 'large' | null }
  | { status: 'missing' }
  | { status: 'unavailable', reason: string }

export type ReportReferenceFiles = Record<string, ReferenceFileSnapshot>

/** Symbols and line ranges still refer to the same whole local file. */
export function localReferencePath(reference: Pick<ReportReference, 'kind' | 'target'>): string | undefined {
  if (/^https?:\/\//i.test(reference.target)) return undefined
  const path = reference.kind === 'code'
    ? parseCodeTarget(reference.target, [], 'reference')?.path
    : reference.target
  if (!path || /^(?:\/|~\/|[a-z][a-z0-9+.-]*:)/i.test(path)
    || /[\\\x00-\x1f]/.test(path) || path.split('/').includes('..')) return undefined
  const normalized = path.split('/').filter(part => part && part !== '.').join('/')
  return normalized || undefined
}

export function referencePaths(references: ReportReference[]): string[] {
  return [...new Set(references.flatMap(reference => {
    const path = localReferencePath(reference)
    return path ? [path] : []
  }))].sort()
}

export function reportReferencePaths(report: ProductReportV16): string[] {
  return referencePaths([
    ...report.references,
    ...Object.values(reportResourceCollections(report.model)).flatMap(resources => resources.flatMap(resource => resource.references))
  ])
}

/** Do not let a Reference recursively capture generated history or Git internals. */
export function excludedReferencePath(path: string): boolean {
  const parts = path.toLowerCase().split('/')
  return parts.includes('.git') || parts.some((part, index) =>
    part === '.businesslens' && ['cache', 'build'].includes(parts[index + 1] ?? '')
  )
}
