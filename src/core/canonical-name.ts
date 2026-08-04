import { UsageError } from './usage-error.js'

export const CANONICAL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const CANONICAL_NAME_MAX_LENGTH = 80

export class CanonicalNameError extends UsageError {}

/**
 * A Blueprint's canonical name — its catalog slug.
 *
 * Shared by `pull` and `contribute` so the name a contributor proposes is
 * validated by exactly the rule the catalog will enforce.
 */
export function parseCanonicalName(value: string): string {
  if (!CANONICAL_NAME.test(value) || value.length > CANONICAL_NAME_MAX_LENGTH) {
    throw new CanonicalNameError(
      'Blueprint name must be its lowercase kebab-case canonical name.'
    )
  }
  return value
}
