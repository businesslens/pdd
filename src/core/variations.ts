import { z } from 'zod'
import { isQualifiedId } from './ids.js'

export const VARIATION_KINDS = ['experiment', 'configuration', 'version'] as const
export type VariationKind = typeof VARIATION_KINDS[number]

/** The resource types a Variation may vary, spelled as their folder types. */
export const VARIATION_MEMBER_TYPES = [
  'interface', 'experience', 'screen', 'entity', 'capability', 'journey', 'business-rule'
] as const
export type VariationMemberType = typeof VARIATION_MEMBER_TYPES[number]

/** The model collection that holds each member type. */
export const VARIATION_COLLECTION_OF = {
  interface: 'interfaces',
  experience: 'experiences',
  screen: 'screens',
  entity: 'entities',
  capability: 'capabilities',
  journey: 'journeys',
  'business-rule': 'businessRules'
} as const satisfies Record<VariationMemberType, string>
export type VariationCollection = typeof VARIATION_COLLECTION_OF[VariationMemberType]
export const VARIATION_COLLECTIONS = Object.values(VARIATION_COLLECTION_OF) as VariationCollection[]

const UsageText = z.string().trim().min(1).refine(value => !/^#{1,2}\s/m.test(value), 'must not contain H1/H2 headings')
export const VariationFactSchema = z.object({ entity: UsageText, fact: UsageText }).strict()
export const AssignmentUnitSchema = z.union([z.object({ entity: UsageText }).strict(), z.object({ description: UsageText }).strict()])
export type VariationFact = z.infer<typeof VariationFactSchema>
export type AssignmentUnit = z.infer<typeof AssignmentUnitSchema>

/**
 * One alternative. `label` names a Version and exists only on Version sets.
 * Everything else about selection belongs to the set, written once.
 */
export interface VariationAlternative {
  id: string
  selectedWhen: string
  label: string | null
}

/**
 * The set, as both the folder and the wire carry it.
 *
 * Each selection field lives at exactly one level. The mechanism, `takesEffect`
 * and `stability` describe the set; `selectedWhen` and a Version's `label`
 * describe one alternative. Nothing is inherited or overridden.
 */
export interface VariationSet {
  id: string
  kind: string
  of: string
  takesEffect: string
  stability: string
  assignmentUnit: AssignmentUnit | null
  assignmentMethod: string | null
  assignmentFact: VariationFact | null
  allocation: string | null
  settings: VariationFact[]
  discriminator: VariationFact | null
  alternatives: VariationAlternative[]
}

const SET_FIELDS: Record<VariationKind, readonly string[]> = {
  experiment: ['assignmentUnit', 'assignmentMethod', 'assignmentFact', 'allocation'],
  configuration: ['settings'],
  version: ['discriminator']
}
const MECHANISM_FIELDS = ['assignmentUnit', 'assignmentMethod', 'assignmentFact', 'allocation', 'settings', 'discriminator'] as const

function present(set: VariationSet, field: typeof MECHANISM_FIELDS[number]): boolean {
  const value = set[field]
  return Array.isArray(value) ? value.length > 0 : value !== null
}

function textIssue(value: string, field: string): string | undefined {
  const parsed = UsageText.safeParse(value)
  return parsed.success ? undefined : `${field}: ${parsed.error.issues[0]!.message}`
}

/** Fact references a set uses to choose, in authored order. */
export function variationFacts(set: Pick<VariationSet, 'settings' | 'assignmentFact' | 'discriminator'>): VariationFact[] {
  return [
    ...set.settings,
    ...(set.assignmentFact ? [set.assignmentFact] : []),
    ...(set.discriminator ? [set.discriminator] : [])
  ]
}

/** Entities playing an explicit role in selection. */
export function variationEntityReferences(set: Pick<VariationSet, 'settings' | 'assignmentFact' | 'discriminator' | 'assignmentUnit'>): string[] {
  return [
    ...(set.assignmentUnit && 'entity' in set.assignmentUnit ? [set.assignmentUnit.entity] : []),
    ...variationFacts(set).map(ref => ref.entity)
  ]
}

export interface VariationScope {
  /** Ids per member collection. Ids never resolve across collections. */
  members: Record<VariationCollection, ReadonlySet<string>>
  entities: readonly { id: string, informationKept: readonly { name: string }[] }[]
}

/**
 * Every structural finding about a set of Variations, shared by folder `lint`
 * and report validation so both reject the same shapes.
 */
export function variationIssues(sets: readonly VariationSet[], scope: VariationScope): { id: string, message: string }[] {
  const issues: { id: string, message: string }[] = []
  const entityById = new Map(scope.entities.map(entity => [entity.id, entity]))
  const owner = new Map<string, string>()
  for (const set of sets) {
    const fail = (message: string) => issues.push({ id: set.id, message })
    const kind = (VARIATION_KINDS as readonly string[]).includes(set.kind) ? set.kind as VariationKind : null
    const type = (VARIATION_MEMBER_TYPES as readonly string[]).includes(set.of) ? set.of as VariationMemberType : null
    if (!kind) fail('kind must be experiment|configuration|version')
    if (!type) fail(`of must be ${VARIATION_MEMBER_TYPES.join('|')}`)
    for (const [field, value] of [['takesEffect', set.takesEffect], ['stability', set.stability]] as const) {
      const issue = textIssue(value, field)
      if (issue) fail(issue)
    }
    if (kind) {
      for (const field of MECHANISM_FIELDS) {
        if (present(set, field) && !SET_FIELDS[kind].includes(field)) fail(`${field} does not belong on a ${kind} Variation`)
      }
      if (kind === 'experiment') {
        if (!set.assignmentUnit) fail('an experiment Variation needs assignmentUnit')
        if (set.assignmentMethod === null) fail('an experiment Variation needs assignmentMethod')
      }
    }
    for (const [field, value] of [['assignmentMethod', set.assignmentMethod], ['allocation', set.allocation]] as const) {
      if (value === null) continue
      const issue = textIssue(value, field)
      if (issue) fail(issue)
    }
    if (set.assignmentUnit) {
      const parsed = AssignmentUnitSchema.safeParse(set.assignmentUnit)
      if (!parsed.success) fail('assignmentUnit must be { entity: <id> } or { description: <text> }')
      else if ('entity' in parsed.data && !entityById.has(parsed.data.entity)) fail(`assignmentUnit references missing Entity "${parsed.data.entity}"`)
    }
    const seenFacts = new Set<string>()
    for (const ref of variationFacts(set)) {
      const key = JSON.stringify([ref.entity, ref.fact])
      if (seenFacts.has(key)) fail(`repeats fact "${ref.entity}.${ref.fact}"`)
      seenFacts.add(key)
      const entity = entityById.get(ref.entity)
      if (!entity) fail(`references missing Entity "${ref.entity}"`)
      else if (!entity.informationKept.some(fact => fact.name === ref.fact)) fail(`references missing fact "${ref.fact}" on Entity "${ref.entity}"`)
    }

    if (set.alternatives.length < 2) fail('a Variation needs at least two alternatives')
    const ids = new Set<string>()
    const labels = new Set<string>()
    const collection = type ? VARIATION_COLLECTION_OF[type] : null
    for (const alternative of set.alternatives) {
      const where = `alternative "${alternative.id}"`
      if (ids.has(alternative.id)) fail(`${where} is listed twice`)
      ids.add(alternative.id)
      if (!isQualifiedId(alternative.id)) fail(`${where} must be a full ${type ?? 'resource'} id`)
      else if (collection && !scope.members[collection].has(alternative.id)) fail(`${where} references missing ${type} "${alternative.id}"`)
      const issue = textIssue(alternative.selectedWhen, `${where} selectedWhen`)
      if (issue) fail(issue)
      if (kind === 'version') {
        if (alternative.label === null) fail(`${where} needs a label on a version Variation`)
        else {
          const labelIssue = textIssue(alternative.label, `${where} label`)
          if (labelIssue) fail(labelIssue)
          const label = alternative.label.toLowerCase()
          if (labels.has(label)) fail(`${where} label "${alternative.label}" must be unique within the Variation`)
          labels.add(label)
        }
      } else if (kind && alternative.label !== null) {
        fail(`${where} label belongs only on a version Variation`)
      }
      if (collection) {
        const memberKey = `${collection}:${alternative.id}`
        const previous = owner.get(memberKey)
        if (previous && previous !== set.id) fail(`${where} already belongs to Variation "${previous}"; a resource joins at most one`)
        else owner.set(memberKey, set.id)
      }
    }
  }
  return issues
}

/** Member key → Variation, for the conditional checks that ask "is this one of a set?". */
export function variationMembership(sets: readonly Pick<VariationSet, 'id' | 'of' | 'alternatives'>[]): Map<string, string> {
  const membership = new Map<string, string>()
  for (const set of sets) {
    const collection = VARIATION_COLLECTION_OF[set.of as VariationMemberType]
    if (!collection) continue
    for (const alternative of set.alternatives) membership.set(`${collection}:${alternative.id}`, set.id)
  }
  return membership
}
