import { z } from 'zod'
import { containsStructuralHeading } from './markdown.js'

/** Workspace paths locate a gap; they make no completeness claim about a file. */
export interface UnmappedArea { description: string, paths: string[] }

export interface CoverageReviewPolicy { version: 'project-files-v1', includePaths: string[] }
export interface CoverageReviewFile { path: string, digest: string | null, error?: string }
export interface CoverageReviewEntry {
  paths: string[]
  outcome: 'reviewed' | 'excluded' | 'uncertain'
  summary: string
  /** Resource Markdown paths relative to the selected .businesslens/ directory. */
  resources: string[]
  /** Exact descriptions authored in Coverage. */
  exclusions: string[]
  gaps: string[]
}
export interface CoverageReview {
  id: string
  startedAt: string
  completedAt: string | null
  modelDigest: string | null
  policy: CoverageReviewPolicy
  files: CoverageReviewFile[]
  entries: CoverageReviewEntry[]
}
export type CoverageChange = 'unreviewed' | 'added' | 'modified' | 'deleted' | 'unchanged' | 'unreadable' | 'outside-policy'
export interface CoverageComparison {
  policy: CoverageReviewPolicy
  baseline: CoverageReview | null
  pending: CoverageReview | null
  modelChanged: boolean | null
  pendingChanged: boolean | null
  files: Array<{ path: string, change: CoverageChange, error?: string }>
}

export function isCoveragePath(path: string): boolean {
  return path.length > 0 && path.trim() === path
    && !/[\\:#*?\[\]{}\u0000-\u001f\u007f]/.test(path)
    && path.replace(/\/$/, '').split('/').every(part => part !== '' && part !== '.' && part !== '..')
}

export function isUnmappedDescription(description: string): boolean {
  return description.trim().length > 0 && !/[\r\n]/.test(description)
    && !/^\s{0,3}#{1,2}(?:\s|$)/.test(description)
}

/** Live host context, deliberately separate from the serializable Product Report. */
export interface RepositoryInventory {
  paths: string[]
  coverage?: CoverageComparison
  coverageError?: string
}
export type RepositoryInventoryLoader = (includeIgnored: boolean) => Promise<RepositoryInventory>

// Coverage links use the author's exact description, including whitespace.
const text = z.string().refine(value => value.trim().length > 0, 'Expected non-empty text')
const pathSchema = z.string().min(1).refine(path => !path.startsWith('/') && !/^[A-Za-z]:/.test(path) && !path.includes('\\') && !path.includes('\0') && path.split('/').every(part => part && part !== '.' && part !== '..' && part !== '.git'), 'Expected an exact repository-relative POSIX file path')
const strings = z.array(text).refine(values => new Set(values).size === values.length, 'Duplicate values are not allowed')
export const CoverageReviewEntrySchema = z.strictObject({
  paths: z.array(pathSchema).min(1).refine(paths => new Set(paths).size === paths.length, 'Duplicate file paths'),
  outcome: z.enum(['reviewed', 'excluded', 'uncertain']),
  summary: text,
  resources: strings,
  exclusions: strings,
  gaps: strings
}).superRefine((entry, ctx) => {
  if (entry.outcome === 'excluded' && !entry.exclusions.length) ctx.addIssue({ code: 'custom', message: 'Excluded files require an approved Coverage exclusion' })
  if (entry.outcome === 'excluded' && (entry.resources.length || entry.gaps.length)) ctx.addIssue({ code: 'custom', message: 'Partly modeled or missing behavior must be reviewed, not wholly excluded' })
})
export const CoverageReviewPolicySchema = z.strictObject({ version: z.literal('project-files-v1'), includePaths: z.array(z.string().refine(isCoveragePath)) })
const fileSchema = z.strictObject({ path: pathSchema, digest: z.string().regex(/^[a-f0-9]{64}$/).nullable(), error: text.optional() })
export const CoverageReviewSchema = z.strictObject({
  id: z.string().uuid(), startedAt: z.string().datetime(), completedAt: z.string().datetime().nullable(),
  modelDigest: z.string().regex(/^[a-f0-9]{64}$/).nullable(), policy: CoverageReviewPolicySchema,
  files: z.array(fileSchema), entries: z.array(CoverageReviewEntrySchema)
}).superRefine((review, ctx) => {
  const paths = new Set(review.files.map(file => file.path))
  if (paths.size !== review.files.length) ctx.addIssue({ code: 'custom', message: 'Duplicate snapshot paths' })
  const unreadable = new Set(review.files.filter(file => !file.digest).map(file => file.path))
  if (review.files.some(file => !file.digest && !file.error)) ctx.addIssue({ code: 'custom', message: 'Unreadable inputs require an explanation' })
  const recorded = new Set<string>()
  for (const entry of review.entries) for (const path of entry.paths) {
    if (!paths.has(path) || recorded.has(path)) ctx.addIssue({ code: 'custom', message: 'Review entries must name distinct captured files' })
    if (unreadable.has(path) && entry.outcome !== 'uncertain') ctx.addIssue({ code: 'custom', message: 'Unreadable inputs require uncertain conclusions' })
    recorded.add(path)
  }
  if (review.completedAt && (recorded.size !== paths.size || !review.modelDigest)) ctx.addIssue({ code: 'custom', message: 'Completed review is missing accounting or its model fingerprint' })
})

/** Only completed, fully accounted-for reviews can enter a shared model. */
export const CompletedCoverageReviewSchema = CoverageReviewSchema.refine(
  review => review.completedAt !== null && review.modelDigest !== null,
  'Coverage review must be completed and bound to a model fingerprint'
)

export const CoverageAreaSchema = z.strictObject({
  description: z.string().refine(isUnmappedDescription, 'Expected non-empty single-line Markdown without an H1 or H2 heading'),
  paths: z.array(z.string().refine(isCoveragePath, 'Expected a repository-relative POSIX path without traversal, globs, or suffixes'))
    .refine(paths => new Set(paths).size === paths.length, 'Coverage paths must be unique within an entry')
})

/** The committed document and the workspace report share one complete shape. */
export const CoverageDocumentSchema = z.strictObject({
  status: z.enum(['complete', 'partial', 'draft']),
  scope: z.string().refine(isUnmappedDescription, 'Scope must be non-empty single-line Markdown without an H1 or H2 heading'),
  exclusions: z.array(CoverageAreaSchema),
  method: z.array(z.string()),
  sourceAreas: z.array(z.string()),
  unmapped: z.array(CoverageAreaSchema),
  limitations: z.array(z.string()),
  rationale: z.string().refine(value => !containsStructuralHeading(value), 'Rationale must not contain an H1 or H2 heading'),
  review: CompletedCoverageReviewSchema.nullable()
}).superRefine((coverage, ctx) => {
  const descriptions = [...coverage.exclusions, ...coverage.unmapped].map(area => area.description)
  if (new Set(descriptions).size !== descriptions.length) ctx.addIssue({ code: 'custom', message: 'Coverage descriptions must be unique across exclusions and unmapped' })
  if (coverage.status === 'complete' && coverage.unmapped.length) ctx.addIssue({ code: 'custom', message: 'Complete coverage cannot have known unmapped behavior' })
})
export type CoverageDocument = z.infer<typeof CoverageDocumentSchema>
