/**
 * The zod-free half of Variations: which types may vary, where each lives, and
 * which set a resource belongs to. Kept apart from `variations.ts` so a browser
 * bundle can answer "is this one of a set?" without the schemas.
 */

export const VARIATION_KINDS = ['experiment', 'configuration', 'version'] as const
export type VariationKind = typeof VARIATION_KINDS[number]

/** The resource types a Variation may vary, spelled as their folder types. */
export const VARIATION_MEMBER_TYPES = [
  'interface', 'experience', 'screen', 'entity', 'capability', 'capability-scenario',
  'journey', 'journey-scenario', 'business-rule'
] as const
export type VariationMemberType = typeof VARIATION_MEMBER_TYPES[number]

/** The model collection that holds each member type. */
export const VARIATION_COLLECTION_OF = {
  interface: 'interfaces',
  experience: 'experiences',
  screen: 'screens',
  entity: 'entities',
  capability: 'capabilities',
  'capability-scenario': 'capabilityScenarios',
  journey: 'journeys',
  'journey-scenario': 'journeyScenarios',
  'business-rule': 'businessRules'
} as const satisfies Record<VariationMemberType, string>
export type VariationCollection = typeof VARIATION_COLLECTION_OF[VariationMemberType]

/** Member key → Variation, for the conditional checks that ask "is this one of a set?". */
export function variationMembership(sets: readonly { id: string, of: string, alternatives: readonly { id: string }[] }[]): Map<string, string> {
  const membership = new Map<string, string>()
  for (const set of sets) {
    const collection = VARIATION_COLLECTION_OF[set.of as VariationMemberType]
    if (!collection) continue
    for (const alternative of set.alternatives) membership.set(`${collection}:${alternative.id}`, set.id)
  }
  return membership
}

/** Member key (`<collection>:<id>`) → Variation id, read from a report's Variations. */
export function reportVariationMembership(model: { variations: readonly { id: string, of: string, alternatives: readonly { resourceId: string }[] }[] }): Map<string, string> {
  return variationMembership(model.variations.map(set => ({
    id: set.id,
    of: set.of,
    alternatives: set.alternatives.map(item => ({ id: item.resourceId }))
  })))
}
