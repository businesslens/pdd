import { createHash } from 'node:crypto'
import { canonicalReportJson } from './portable.js'

/**
 * SHA-256 of the canonical report JSON.
 *
 * Kept apart from the schema module because it needs `node:crypto`: the schema
 * and its validator must stay isomorphic so browser bundles can import them.
 */
export function reportDigest(report: unknown): string {
  return createHash('sha256').update(canonicalReportJson(report)).digest('hex')
}
