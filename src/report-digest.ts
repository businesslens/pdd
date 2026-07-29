/**
 * `businesslens/report/digest` — the canonical report digest.
 *
 * A separate entry point from `businesslens/report` because it depends on
 * `node:crypto`. Import it only from server-side code; the schema entry stays
 * bundler-safe for browsers.
 */

export { reportDigest } from './core/report-digest.js'
export { canonicalReportJson } from './core/portable.js'
