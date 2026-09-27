import { z } from 'zod'
import { isQualifiedId } from './ids.js'

export const VARIATION_KINDS = ['experiment', 'configuration', 'version'] as const
export type VariationKind = typeof VARIATION_KINDS[number]

const UsageText = z.string().trim().min(1).refine(value => !/^#{1,2}\s/m.test(value), 'must not contain H1/H2 headings')
export const VariationFactSchema = z.object({ entity: UsageText, fact: UsageText }).strict()
const commonUsage = { selectedWhen: UsageText, takesEffect: UsageText, stability: UsageText }
export const ExperimentUsageSchema = z.object({
  ...commonUsage,
  assignmentUnit: z.union([z.object({ entity: UsageText }).strict(), z.object({ description: UsageText }).strict()]),
  assignmentMethod: UsageText,
  assignmentFact: VariationFactSchema.optional(),
  allocation: UsageText.optional()
}).strict()
export const ConfigurationUsageSchema = z.object({ ...commonUsage, settings: z.array(VariationFactSchema).min(1).optional() }).strict()
export const VersionUsageSchema = z.object({ ...commonUsage, label: UsageText, discriminator: VariationFactSchema.optional() }).strict()
export const VariationUsageSchema = z.union([ExperimentUsageSchema, ConfigurationUsageSchema, VersionUsageSchema])
export type VariationUsage = z.infer<typeof VariationUsageSchema>
export type VariationFact = z.infer<typeof VariationFactSchema>
const usageSchemas = { experiment: ExperimentUsageSchema, configuration: ConfigurationUsageSchema, version: VersionUsageSchema }

/** Author-owned fields. Linked members derive their subtype from the anchor. */
export interface VariationFields {
  variantOf: string | null
  variationKind: string | null
  variationUsage: VariationUsage | null
}

export const VARIATION_COLLECTIONS = [
  'interfaces', 'experiences', 'screens', 'entities', 'capabilities', 'journeys', 'businessRules'
] as const

/** Called separately for each type: ids never resolve across collections. */
export function variationIssues(resources: readonly ({ id: string } & VariationFields)[], entities: readonly { id: string, informationKept: readonly { name: string }[] }[]): { id: string, message: string }[] {
  const byId = new Map(resources.map(resource => [resource.id, resource]))
  const incoming = new Set(resources.flatMap(resource => resource.variantOf === null ? [] : [resource.variantOf]))
  const issues: { id: string, message: string }[] = []
  const entityById = new Map(entities.map(entity => [entity.id, entity]))
  const labels = new Map<string, Set<string>>()
  for (const resource of resources) {
    const fail = (message: string) => issues.push({ id: resource.id, message })
    const linked = resource.variantOf !== null
    const member = linked || incoming.has(resource.id)
    if (linked) {
      const target = byId.get(resource.variantOf!)
      if (!isQualifiedId(resource.variantOf!)) fail('variantOf must name a full resource id of the same type')
      if (resource.variantOf === resource.id) fail('variantOf cannot name itself')
      if (!target) fail(`variantOf references missing resource of the same type "${resource.variantOf}"`)
      else if (target.variantOf !== null) fail('variantOf cannot form a chain or cycle; the target must be an unlinked anchor')
      if (resource.variationKind !== null) fail('variationKind belongs only on the anchor; linked members derive it')
    } else if (member) {
      if (resource.variationKind === null) fail('a Variation anchor needs variationKind: experiment|configuration|version')
    } else if (resource.variationKind !== null) {
      fail('variationKind needs at least one incoming variantOf link')
    }
    if (resource.variationKind !== null && !(VARIATION_KINDS as readonly string[]).includes(resource.variationKind)) {
      fail('variationKind must be experiment|configuration|version')
    }
    if (member && !resource.variationUsage) fail('every Variation, including its anchor, needs variationUsage')
    if (!member && resource.variationUsage !== null) fail('variationUsage is only allowed on a member of a Variation set')
    const kind = linked ? byId.get(resource.variantOf!)?.variationKind : resource.variationKind
    if (!resource.variationUsage || !kind || !Object.hasOwn(usageSchemas, kind)) continue
    const parsed = usageSchemas[kind as VariationKind].safeParse(resource.variationUsage)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) fail(`variationUsage.${issue.path.join('.')}: ${issue.message} (${kind})`)
      continue
    }
    const usage = parsed.data
    if ('assignmentUnit' in usage && 'entity' in usage.assignmentUnit && !entityById.has(usage.assignmentUnit.entity)) {
      fail(`variationUsage.assignmentUnit references missing Entity "${usage.assignmentUnit.entity}"`)
    }
    const facts: VariationFact[] = [
      ...('settings' in usage ? usage.settings ?? [] : []),
      ...('assignmentFact' in usage && usage.assignmentFact ? [usage.assignmentFact] : []),
      ...('discriminator' in usage && usage.discriminator ? [usage.discriminator] : [])
    ]
    const seen = new Set<string>()
    for (const ref of facts) {
      const key = JSON.stringify([ref.entity, ref.fact])
      if (seen.has(key)) fail(`variationUsage repeats fact "${ref.entity}.${ref.fact}"`)
      seen.add(key)
      const entity = entityById.get(ref.entity)
      if (!entity) fail(`variationUsage references missing Entity "${ref.entity}"`)
      else if (!entity.informationKept.some(fact => fact.name === ref.fact)) fail(`variationUsage references missing fact "${ref.fact}" on Entity "${ref.entity}"`)
    }
    if ('label' in usage) {
      const anchorId = resource.variantOf ?? resource.id
      const used = labels.get(anchorId) ?? new Set<string>()
      const label = usage.label.toLowerCase()
      if (used.has(label)) fail(`variationUsage.label "${usage.label}" must be unique within the Version set`)
      used.add(label)
      labels.set(anchorId, used)
    }
  }
  return issues
}

/** Entities playing an explicit role in resource selection. */
export function variationEntityReferences(usage: VariationUsage | null): string[] {
  if (!usage) return []
  const parsed = VariationUsageSchema.safeParse(usage)
  if (!parsed.success) return []
  usage = parsed.data
  return [
    ...('assignmentUnit' in usage && 'entity' in usage.assignmentUnit ? [usage.assignmentUnit.entity] : []),
    ...('assignmentFact' in usage && usage.assignmentFact ? [usage.assignmentFact.entity] : []),
    ...('settings' in usage ? (usage.settings ?? []).map(ref => ref.entity) : []),
    ...('discriminator' in usage && usage.discriminator ? [usage.discriminator.entity] : [])
  ]
}
