import { z } from 'zod'

/**
 * Coverage records which of the repository's code the model accounts for, so
 * every entry names its code; paths locate an area and make no completeness
 * claim about a file.
 */
export interface UnmappedArea { description: string, paths: string[] }

export function isCoveragePath(path: string): boolean {
  return path.length > 0 && path.trim() === path
    // Brackets and braces are file names in dynamic-route frameworks, not globs.
    && !/[\\:#*?\u0000-\u001f\u007f]/.test(path)
    && path.replace(/\/$/, '').split('/').every(part => part !== '' && part !== '.' && part !== '..')
}

export function isUnmappedDescription(description: string): boolean {
  return description.trim().length > 0 && !/[\r\n]/.test(description)
    && !/^\s{0,3}#{1,2}(?:\s|$)/.test(description)
}

export const CoverageAreaSchema = z.strictObject({
  description: z.string().refine(isUnmappedDescription, 'Expected non-empty single-line Markdown without an H1 or H2 heading'),
  paths: z.array(z.string().refine(isCoveragePath, 'Expected a repository-relative POSIX path without traversal, * or ? wildcards, or suffixes'))
    .min(1, 'A Coverage entry names the code it is about; give it at least one path')
    .refine(paths => new Set(paths).size === paths.length, 'Coverage paths must be unique within an entry')
})

/** Parsed Coverage frontmatter and body share the workspace report's shape. */
export const CoverageDocumentSchema = z.strictObject({
  scope: z.string().refine(value => value === '' || isUnmappedDescription(value), 'Scope must be single-line Markdown without an H1 or H2 heading'),
  exclusions: z.array(CoverageAreaSchema),
  method: z.string().refine(value => value === '' || isUnmappedDescription(value), 'Method must be a single-line authoring note or empty'),
  covered: z.array(CoverageAreaSchema),
  unmapped: z.array(CoverageAreaSchema),
  limitations: z.array(CoverageAreaSchema)
}).superRefine((coverage, ctx) => {
  const areas = [...coverage.covered, ...coverage.exclusions, ...coverage.unmapped, ...coverage.limitations]
  /* A model tied to no code has empty coverage, scope included; once a mapping
     records code, the scope says how far it reaches. */
  if (areas.length && coverage.scope === '') {
    ctx.addIssue({ code: 'custom', path: ['scope'], message: 'Scope is required once Coverage records code; say the breadth of code the model accounts for' })
  }
  const descriptions = areas.map(area => area.description)
  if (new Set(descriptions).size !== descriptions.length) ctx.addIssue({ code: 'custom', message: 'Coverage descriptions must be unique across covered, exclusions, unmapped and limitations' })
})
export type CoverageDocument = z.infer<typeof CoverageDocumentSchema>
