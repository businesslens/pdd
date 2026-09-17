/**
 * What changed between two Product Reports.
 *
 * The report is the right level to compare at: every resource has a stable id
 * and its own page, so a difference here is a link, and the derived facts the
 * report carries — which Screens a Scenario reaches, which Rules attach where —
 * show up as changes no file diff could name. Free of Node built-ins so the
 * viewer can import the types and the browser could run it if it needed to.
 */
import type { ProductReportV16, ReportCollectionName } from './portable.js'
import { canonicalReportJson, reportResourceCollections } from './portable.js'
import type { ReportReference } from './portable.js'
import { referencePaths, type ReferenceFileSnapshot, type ReportReferenceFiles } from './report-reference-files.js'

export type ChangeKind = 'added' | 'removed' | 'changed'

export interface FieldChange {
  /** Report field path, with one-based list positions, such as `steps[1].text`. */
  field: string
  change: ChangeKind
  /** Full leaf value; objects and lists use canonical JSON. */
  before: string | null
  after: string | null
  /** Local file content comparison, separate from authored Reference fields. */
  referenceFile?: string
}

export interface ResourceChange {
  collection: ReportCollectionName
  id: string
  /** The current title, or the last title a removed resource had. */
  title: string
  change: ChangeKind
  /** Empty for an addition or a removal: the whole resource is the change. */
  fields: FieldChange[]
}

export interface ReportDiff {
  /** Product-level changes, including coverage, References and taxonomies. */
  product: FieldChange[]
  resources: ResourceChange[]
  counts: { added: number, removed: number, changed: number }
}

/** Git identities used by the read-only Review page. */
export type ReportBaseline =
  | { id: 'head', kind: 'committed', available: true, at: string, detail: string }
  | { id: 'head', kind: 'committed', available: false, reason: string }
  | { id: 'working', kind: 'working', available: true }
  | { id: string, kind: 'commit', available: true, at: string, commit: string, label: string, detail: string }
  | { id: string, kind: 'branch', available: true, at: string, commit: string, label: string, detail: string, isDefault?: boolean, isCurrent?: boolean }
  | { id: string, kind: 'tag', available: true, at: string, commit: string, label: string, detail: string }

/* Report metadata that changes without the model changing. */
const IGNORED_TOP_LEVEL = new Set(['generatedAt', 'generator', 'counts', 'model', 'schemaVersion', 'referenceProfile'])

const COLLECTION_ORDER: ReportCollectionName[] = [
  'interfaces', 'experiences', 'screens', 'domains', 'entities',
  'capabilities', 'capabilityScenarios', 'journeys', 'journeyScenarios', 'businessRules'
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

/** Keep the value intact: shortening it can hide the only part that changed. */
export function describeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return canonicalReportJson(value)
}

function fieldChange(field: string, before: unknown, after: unknown): FieldChange {
  const change: ChangeKind = before === undefined || before === null
    ? 'added'
    : after === undefined || after === null ? 'removed' : 'changed'
  return { field, change, before: describeValue(before), after: describeValue(after) }
}

/**
 * Field-level differences, opening objects and structured lists to their leaves.
 *
 * A Step's text is only one of its fields: its effects, actors and route
 * contexts must remain visible too. List positions are one-based, matching
 * the Step numbers a reader sees. Primitive lists remain one field.
 */
export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>, prefix = '', ignore = new Set<string>()): FieldChange[] {
  const changes: FieldChange[] = []
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
  for (const key of keys) {
    if ((!prefix && ignore.has(key)) || (prefix === 'coverage' && key === 'review')) continue
    const left = before[key]
    const right = after[key]
    const field = prefix ? `${prefix}.${key}` : key
    changes.push(...diffValue(field, left, right))
  }
  return changes
}

function diffValue(field: string, before: unknown, after: unknown): FieldChange[] {
  if (canonicalReportJson(before) === canonicalReportJson(after)) return []
  if (isRecord(before) && isRecord(after)) return diffFields(before, after, field)
  if (Array.isArray(before) && Array.isArray(after) && [...before, ...after].every(isRecord)) {
    return Array.from({ length: Math.max(before.length, after.length) }, (_, index) =>
      diffValue(`${field}[${index + 1}]`, before[index], after[index])
    ).flat()
  }
  return [fieldChange(field, before, after)]
}

type Resource = { id: string } & Record<string, unknown>

function titleOf(resource: Resource): string {
  for (const key of ['title', 'name']) {
    const value = resource[key]
    if (typeof value === 'string' && value) return value
  }
  return resource.id
}

/** The differences from `before` to `after`, in collection order then by id. */
export function diffReports(
  before: ProductReportV16,
  after: ProductReportV16,
  files?: { before: ReportReferenceFiles, after: ReportReferenceFiles }
): ReportDiff {
  const product = diffFields(
    before as unknown as Record<string, unknown>,
    after as unknown as Record<string, unknown>,
    '',
    IGNORED_TOP_LEVEL
  )
  // Taxonomies belong to the model but are not resource collections.
  product.push(...diffFields(before.model.taxonomies, after.model.taxonomies, 'taxonomies'))
  product.push(...diffReferenceFiles(before.references, after.references, files))

  const resources: ResourceChange[] = []
  const previous = reportResourceCollections(before.model) as Record<ReportCollectionName, Resource[]>
  const current = reportResourceCollections(after.model) as Record<ReportCollectionName, Resource[]>
  for (const collection of COLLECTION_ORDER) {
    const was = new Map(previous[collection].map(item => [item.id, item]))
    const now = new Map(current[collection].map(item => [item.id, item]))
    const ids = [...new Set([...was.keys(), ...now.keys()])].sort()
    for (const id of ids) {
      const left = was.get(id)
      const right = now.get(id)
      if (left && right) {
        const fields = diffFields(left, right)
        fields.push(...diffReferenceFiles(left.references as ReportReference[], right.references as ReportReference[], files))
        if (fields.length) resources.push({ collection, id, title: titleOf(right), change: 'changed', fields })
      } else if (right) {
        resources.push({ collection, id, title: titleOf(right), change: 'added', fields: [] })
      } else if (left) {
        resources.push({ collection, id, title: titleOf(left), change: 'removed', fields: [] })
      }
    }
  }

  const counts = { added: 0, removed: 0, changed: 0 }
  for (const item of resources) counts[item.change] += 1
  return { product, resources, counts }
}

function describeFile(file: ReferenceFileSnapshot): string | null {
  if (file.status === 'missing') return null
  if (file.status === 'unavailable') return `Unavailable: ${file.reason}`
  if (file.text !== null) return file.text
  const kind = file.omitted === 'binary' ? 'Binary file' : 'File too large for a text preview'
  return `${kind} · ${file.bytes} bytes · SHA-256 ${file.digest.slice(0, 12)}`
}

function diffReferenceFiles(
  before: ReportReference[], after: ReportReference[],
  files?: { before: ReportReferenceFiles, after: ReportReferenceFiles }
): FieldChange[] {
  if (!files) return []
  const previous = new Set(referencePaths(before))
  return referencePaths(after).flatMap(path => {
    // A newly attached Reference has no comparison history for its file.
    if (!previous.has(path) || !Object.hasOwn(files.before, path) || !Object.hasOwn(files.after, path)) return []
    const left = files.before[path]!
    const right = files.after[path]!
    if (left.status === 'present' && right.status === 'present' && left.digest === right.digest) return []
    if (canonicalReportJson(left) === canonicalReportJson(right)) return []
    return [{
      field: `references[${JSON.stringify(path)}].file`, referenceFile: path,
      change: left.status === 'missing' ? 'added' as const : right.status === 'missing' ? 'removed' as const : 'changed' as const,
      before: describeFile(left), after: describeFile(right)
    }]
  })
}

/** True when nothing the diff reports on differs. */
export function diffIsEmpty(diff: ReportDiff): boolean {
  return !diff.product.length && !diff.resources.length
}
