import { z } from 'zod'

/** Workspace paths locate a gap; they make no completeness claim about a file. */
export interface UnmappedArea { description: string, paths: string[] }

export function isCoveragePath(path: string): boolean {
  return path.length > 0 && path.trim() === path
    && !/[\\:#*?\[\]{}\u0000-\u001f\u007f]/.test(path)
    && path.replace(/\/$/, '').split('/').every(part => part !== '' && part !== '.' && part !== '..')
}

export function isUnmappedDescription(description: string): boolean {
  return description.trim().length > 0 && !/[\r\n]/.test(description)
    && !/^\s{0,3}#{1,2}(?:\s|$)/.test(description)
}

export const CoverageAreaSchema = z.strictObject({
  description: z.string().refine(isUnmappedDescription, 'Expected non-empty single-line Markdown without an H1 or H2 heading'),
  paths: z.array(z.string().refine(isCoveragePath, 'Expected a repository-relative POSIX path without traversal, globs, or suffixes'))
    .refine(paths => new Set(paths).size === paths.length, 'Coverage paths must be unique within an entry')
})

/** Parsed Coverage frontmatter and body share the workspace report's shape. */
export const CoverageDocumentSchema = z.strictObject({
  scope: z.string().refine(isUnmappedDescription, 'Scope must be non-empty single-line Markdown without an H1 or H2 heading'),
  exclusions: z.array(CoverageAreaSchema),
  method: z.string().refine(value => value === '' || isUnmappedDescription(value), 'Method must be a single-line authoring note or empty'),
  covered: z.array(CoverageAreaSchema),
  unmapped: z.array(CoverageAreaSchema),
  limitations: z.array(CoverageAreaSchema)
}).superRefine((coverage, ctx) => {
  const descriptions = [...coverage.covered, ...coverage.exclusions, ...coverage.unmapped, ...coverage.limitations].map(area => area.description)
  if (new Set(descriptions).size !== descriptions.length) ctx.addIssue({ code: 'custom', message: 'Coverage descriptions must be unique across covered, exclusions, unmapped and limitations' })
})
export type CoverageDocument = z.infer<typeof CoverageDocumentSchema>
