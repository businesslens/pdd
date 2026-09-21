import type { ComputedRef, InjectionKey } from 'vue'
import type { ComparisonSide } from './resourceComparison'
import { comparisonFingerprint, comparisonRows } from './resourceComparison'
import type { AnyResourceView } from './reportWorkspace'
import type { ScenarioStep } from './scenarioSteps'

/** Optional context for annotations in the ordinary resource reading. */
export interface ResourceReview {
  before: ComparisonSide | null
  after: ComparisonSide | null
  resourceKey: string
  inspect: (key: string, state: string) => void
}
export const resourceReviewKey: InjectionKey<ComputedRef<ResourceReview | null>> = Symbol('businesslens:resource-review')
export function reviewResource(review: ResourceReview | null, side: 'before' | 'after', key: string): AnyResourceView | undefined {
  return review?.[side]?.workspace.byKey.get(key)
}
const present = (value: unknown) => value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)
export function reviewValueChange(before: unknown, after: unknown) {
  if (!present(before) && !present(after)) return null
  if (!present(before)) return 'added' as const
  if (!present(after)) return 'deleted' as const
  return comparisonFingerprint(before) === comparisonFingerprint(after) ? null : 'modified' as const
}
export function reviewRows<T>(before: T[] | undefined, after: T[], enabled: boolean, value: (item: T) => unknown = item => item, identity?: (item: T) => string) {
  return enabled ? comparisonRows(before ?? [], after, value, identity)
    : after.map((item, index) => ({ before: item, after: item, beforeIndex: index, afterIndex: index, change: null }))
}

/** A renamed linked place must not destroy the anchors in the authored sequence. */
export function reviewStepValue(step: ScenarioStep) {
  return { ...step, contexts: step.contexts.map(item => ({ routeId: item.routeId, place: item.context.boundary.placeId })) }
}
