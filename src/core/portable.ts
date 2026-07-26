import * as z from 'zod'

// Vendored from the BusinessLens platform's shared/projects/schemas.ts (V3 shape).
// Keep byte-compatible with the platform: the compiled document must satisfy
// the platform's PortableProjectV3Schema exactly.

export const PROJECT_SCHEMA_VERSION = '3.0.0'

export const CodeReferenceSchema = z.strictObject({
  path: z.string(),
  symbol: z.string().optional(),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional()
})

export const TaxonomyEntrySchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  colorSlot: z.number().int().optional()
})

export const ProjectSummarySchema = z.strictObject({
  actors: z.number().int().min(0),
  experiences: z.number().int().min(0),
  domains: z.number().int().min(0),
  journeys: z.number().int().min(0),
  scenarios: z.number().int().min(0)
})

export const ProjectGeneratorSchema = z.strictObject({
  name: z.string().min(1),
  version: z.string().min(1)
})

export const ProjectActorSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  codeRefs: z.array(CodeReferenceSchema).default([])
})

export const ProjectDomainSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  colorSlot: z.number().int().optional(),
  codeRefs: z.array(CodeReferenceSchema).default([])
})

export const ProjectEntryPointSchema = z.strictObject({
  type: z.string().min(1),
  path: z.string().min(1)
})

export const ProjectExperienceSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  actorIds: z.array(z.string()),
  accessMode: z.enum(['public', 'authenticated', 'restricted']),
  capabilities: z.string(),
  entryPoints: z.array(ProjectEntryPointSchema),
  exitContract: z.string(),
  codeRefs: z.array(CodeReferenceSchema).default([])
})

export const ProjectJourneySchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  domainId: z.string().min(1),
  actorIds: z.array(z.string()),
  experienceIds: z.array(z.string()),
  entryPoints: z.array(ProjectEntryPointSchema),
  codeRefs: z.array(CodeReferenceSchema)
})

export const ProjectScenarioSchema = z.strictObject({
  id: z.string().min(1),
  journeyId: z.string().min(1),
  title: z.string().min(1),
  kindId: z.string().min(1),
  trigger: z.string(),
  steps: z.array(z.string()),
  outcome: z.string(),
  edgeCases: z.array(z.string()),
  codeRefs: z.array(CodeReferenceSchema).default([])
})

const SubmissionDateSchema = z.string().refine(value => !Number.isNaN(Date.parse(value)), 'Expected a Git commit date')

export const ProjectSubmissionCoverageSchema = z.strictObject({
  status: z.enum(['complete', 'partial', 'draft']),
  method: z.array(z.string()),
  sourceAreas: z.array(z.string()),
  counts: z.record(z.string(), z.number()),
  mapped: z.record(z.string(), z.number()),
  unmapped: z.array(z.string()),
  limitations: z.array(z.string())
})

export const PortableProjectSourceSchema = z.strictObject({
  repository: z.string().min(1),
  repositoryUrl: z.url().refine(value => value.startsWith('https://'), 'Repository URL must use HTTPS'),
  logoUrl: z.url().optional(),
  branch: z.string().min(1),
  commit: z.string().regex(/^[a-f0-9]{7,64}$/),
  committedAt: SubmissionDateSchema,
  analyzedAt: z.iso.date()
})

export const PortableProjectV3Schema = z.strictObject({
  schemaVersion: z.literal(PROJECT_SCHEMA_VERSION),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(160),
  description: z.string().max(1000),
  tags: z.array(z.string().min(1).max(48)).max(24),
  generatedAt: z.iso.date(),
  source: PortableProjectSourceSchema,
  generator: ProjectGeneratorSchema,
  summary: ProjectSummarySchema,
  limitations: z.array(z.string()),
  model: z.strictObject({
    taxonomies: z.strictObject({
      scenarioKinds: z.array(TaxonomyEntrySchema)
    }),
    actors: z.array(ProjectActorSchema),
    experiences: z.array(ProjectExperienceSchema).min(1),
    domains: z.array(ProjectDomainSchema),
    journeys: z.array(ProjectJourneySchema.extend({
      actorIds: z.array(z.string()).min(1),
      experienceIds: z.array(z.string()).min(1),
      codeRefs: z.array(CodeReferenceSchema).min(1)
    })),
    scenarios: z.array(ProjectScenarioSchema.extend({
      codeRefs: z.array(CodeReferenceSchema).min(1)
    }))
  }),
  coverage: ProjectSubmissionCoverageSchema
})

export type PortableProjectV3 = z.infer<typeof PortableProjectV3Schema>
