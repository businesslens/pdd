/**
 * `businesslens/report/selectors` — which Steps a Business Rule's Entity
 * target selects, and which Variation a resource belongs to.
 *
 * The derivations lint and the report validator share, so a consumer
 * reading a report derives the same answer instead of re-deciding it. A
 * separate entry point from `businesslens/report` so a browser bundle can take
 * the selector without the report schemas behind it.
 */

export {
  operationPlaces,
  permissionTargetSelectsOperation,
} from './core/permission-validation.js'

export type {
  PermissionOperation,
  PermissionTarget,
} from './core/permission-validation.js'

export {
  reportVariationMembership,
} from './core/variation-membership.js'
