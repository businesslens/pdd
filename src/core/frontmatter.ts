import { parse } from 'yaml'
import { parseCodeTarget } from './coderefs.js'
import { isQualifiedId } from './ids.js'

export interface FrontmatterFile {
  data: Record<string, unknown>
  body: string
}

/** Split a markdown file into YAML frontmatter and body. No frontmatter -> empty data. Normalizes CRLF. */
export function splitFrontmatter(rawSource: string, issues: string[], label: string): FrontmatterFile {
  const source = rawSource.replace(/\r\n/g, '\n')
  if (!source.startsWith('---\n') && source.trim() !== '---') {
    return { data: {}, body: source }
  }
  const end = source.indexOf('\n---', 4)
  if (end === -1) {
    issues.push(`${label}: frontmatter is not terminated with ---`)
    return { data: {}, body: source }
  }
  const raw = source.slice(4, end)
  const body = source.slice(source.indexOf('\n', end + 1) + 1)
  try {
    const data = parse(raw)
    if (data === null || data === undefined) return { data: {}, body }
    if (typeof data !== 'object' || Array.isArray(data)) {
      issues.push(`${label}: frontmatter must be a YAML mapping`)
      return { data: {}, body }
    }
    return { data: data as Record<string, unknown>, body }
  } catch (error) {
    issues.push(`${label}: frontmatter YAML failed to parse (${(error as Error).message})`)
    return { data: {}, body }
  }
}

export function stringField(data: Record<string, unknown>, key: string, issues: string[], label: string): string | undefined {
  const value = data[key]
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') {
    issues.push(`${label}: "${key}" must be a string`)
    return undefined
  }
  return value
}

export function stringListField(data: Record<string, unknown>, key: string, issues: string[], label: string): string[] {
  const value = data[key]
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    issues.push(`${label}: "${key}" must be a list of strings`)
    return []
  }
  return value as string[]
}

/** Parse a set-valued string relation and reject duplicate authored IDs. */
export function uniqueStringListField(
  data: Record<string, unknown>,
  key: string,
  issues: string[],
  label: string
): string[] {
  const values = stringListField(data, key, issues, label)
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) issues.push(`${label}: "${key}" contains duplicate "${value}"`)
    seen.add(value)
  }
  return values
}

export interface CompactEntryPoint {
  type: string
  path: string
}

/** One strict Product Context. Usage determines how specific its place must be. */
export interface Context {
  place: string
}

/** Parse `entryPoints: [- web: /path]` compact single-key maps. */
export function entryPointsField(data: Record<string, unknown>, issues: string[], label: string): CompactEntryPoint[] {
  const value = data.entryPoints
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    issues.push(`${label}: "entryPoints" must be a list`)
    return []
  }
  const result: CompactEntryPoint[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      issues.push(`${label}: each entry point must be a single "type: path" map`)
      continue
    }
    const entries = Object.entries(item as Record<string, unknown>)
    const first = entries[0]
    if (entries.length !== 1 || !first || typeof first[1] !== 'string') {
      issues.push(`${label}: each entry point must be a single "type: path" map`)
      continue
    }
    result.push({ type: first[0], path: first[1] })
  }
  return result
}

/** Parse the Context selectors declaring where a Capability is available. */
export function availabilityField(data: Record<string, unknown>, issues: string[], label: string): Context[] {
  return contextListField(data, 'availability', issues, label)
}

/** Parse one strict Context object. Resolution against known places is lint's job. */
export function contextValue(
  value: unknown,
  issues: string[],
  label: string
): Context | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    issues.push(`${label}: context must be a mapping with "place"`)
    return undefined
  }
  const item = value as Record<string, unknown>
  rejectUnknownKeys(item, ['place'], issues, label)
  const place = item.place
  if (typeof place !== 'string' || !isQualifiedId(place)) {
    issues.push(`${label}: "place" must be a qualified Interface, Experience, or Screen id like "customer-web::storefront"`)
    return undefined
  }
  return { place }
}

/** A unique list of Context objects. */
export function contextListField(
  data: Record<string, unknown>,
  key: string,
  issues: string[],
  label: string
): Context[] {
  const value = data[key]
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    issues.push(`${label}: "${key}" must be a list of Context objects`)
    return []
  }
  const result: Context[] = []
  const seen = new Set<string>()
  for (const [index, item] of value.entries()) {
    const context = contextValue(item, issues, `${label}: ${key} context ${index + 1}`)
    if (!context) continue
    if (seen.has(context.place)) {
      issues.push(`${label}: duplicate ${key} Context place "${context.place}"`)
      continue
    }
    seen.add(context.place)
    result.push(context)
  }
  return result
}

/** One named Context field. */
export function contextField(
  data: Record<string, unknown>,
  key: string,
  issues: string[],
  label: string
): Context | undefined {
  const value = data[key]
  if (value === undefined || value === null) return undefined
  return contextValue(value, issues, `${label}: "${key}"`)
}

/**
 * Optional metadata for a file sitting beside `<type>.md`.
 *
 * Class comes from the path — anything under `implementation/` describes this
 * realization — so the list never sets it. Unlisted files are legal, which is
 * what lets a foreign tool drop a capture in without editing frontmatter.
 */
export interface EntityAsset {
  file: string
  title?: string
  /** Screens only: the `## Product states` H3 this asset depicts. */
  state?: string
}

export function assetsField(data: Record<string, unknown>, issues: string[], label: string): EntityAsset[] {
  const value = data.assets
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    issues.push(`${label}: "assets" must be a list`)
    return []
  }
  const result: EntityAsset[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      issues.push(`${label}: each asset needs a "file"`)
      continue
    }
    const record = item as Record<string, unknown>
    const unknown = Object.keys(record).filter(key => !['file', 'title', 'state'].includes(key))
    if (unknown.length) {
      issues.push(`${label}: asset has unknown key "${unknown[0]}"`)
      continue
    }
    const file = record.file
    if (typeof file !== 'string' || !file.trim() || file.startsWith('/') || file.includes('..')) {
      issues.push(`${label}: asset "file" must be a path inside the entity's expanded folder`)
      continue
    }
    if (seen.has(file)) {
      issues.push(`${label}: duplicate asset "${file}"`)
      continue
    }
    seen.add(file)
    for (const key of ['title', 'state'] as const) {
      const raw = record[key]
      if (raw !== undefined && (typeof raw !== 'string' || !raw.trim() || /[\r\n]/.test(raw))) {
        issues.push(`${label}: asset "${key}" must be a non-empty single-line string when present`)
      }
    }
    result.push({
      file,
      title: typeof record.title === 'string' ? record.title : undefined,
      state: typeof record.state === 'string' ? record.state : undefined
    })
  }
  return result
}

export interface EntityReference {
  kind: ReferenceKind
  role: ReferenceRole
  target: string
  title?: string
  /**
   * The Product state this artefact depicts.
   *
   * Screens only, and validated against that Screen's `## Product states`. Six
   * captures of one Screen are otherwise a flat list distinguishable only by
   * free-text title; naming the state is what lets a reader — and the renderer —
   * put each capture beside the state it shows.
   */
  state?: string
}

export type ReferenceKind = 'code' | 'prd' | 'spec' | 'proposal' | 'doc' | 'adr' | 'visual' | 'research'
export type ReferenceRole = 'intent' | 'implementation' | 'context'

export const REFERENCE_KINDS = new Set<ReferenceKind>(['code', 'prd', 'spec', 'proposal', 'doc', 'adr', 'visual', 'research'])
export const REFERENCE_ROLES = new Set<ReferenceRole>(['intent', 'implementation', 'context'])

/** The tracked repository path named by a reference, if it is repository-local. */
export function repositoryReferencePath(reference: EntityReference): string | undefined {
  if (reference.kind === 'code') return parseCodeTarget(reference.target, [], 'reference')?.path
  if (/^https?:\/\//i.test(reference.target)) return undefined
  return reference.target.split(/[?#]/, 1)[0]?.replace(/^\.\//, '') || undefined
}

function validateReferenceTarget(target: string, kind: ReferenceKind, issues: string[], label: string): boolean {
  if (!target.trim()) {
    issues.push(`${label}: reference "target" must not be empty`)
    return false
  }
  if (/[\r\n]/.test(target)) {
    issues.push(`${label}: reference "target" must be a single line`)
    return false
  }
  if (kind === 'code') return Boolean(parseCodeTarget(target, issues, label))
  if (/^https?:\/\//i.test(target)) {
    try {
      const url = new URL(target)
      if (!url.hostname) throw new Error('missing hostname')
      return true
    } catch {
      issues.push(`${label}: reference target "${target}" is not a valid HTTP(S) URL`)
      return false
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) {
    issues.push(`${label}: reference target "${target}" must use HTTP(S) or a repository-relative path`)
    return false
  }
  const path = target.split(/[?#]/, 1)[0] || ''
  if (!path.trim()) {
    issues.push(`${label}: reference target "${target}" must name a repository-relative path`)
    return false
  }
  if (
    /^(?:[/\\]|~[/\\]|[a-z]:[/\\])/i.test(target)
    || target.includes('\\')
    || path.split('/').includes('..')
  ) {
    issues.push(`${label}: reference target "${target}" must be repository-relative, not an absolute filesystem path`)
    return false
  }
  return true
}

export function referencesField(data: Record<string, unknown>, issues: string[], label: string): EntityReference[] {
  const value = data.references
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    issues.push(`${label}: "references" must be a list`)
    return []
  }
  const result: EntityReference[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      issues.push(`${label}: each reference needs "kind", "role", and "target"`)
      continue
    }
    const record = item as Record<string, unknown>
    const unknown = Object.keys(record).filter(key => !['kind', 'role', 'target', 'title', 'state'].includes(key))
    if (unknown.length) {
      issues.push(`${label}: reference has unknown key "${unknown[0]}"`)
      continue
    }
    if (typeof record.kind !== 'string' || typeof record.role !== 'string' || typeof record.target !== 'string') {
      issues.push(`${label}: each reference needs string "kind", "role", and "target"`)
      continue
    }
    if (!REFERENCE_KINDS.has(record.kind as ReferenceKind)) {
      issues.push(`${label}: reference kind "${record.kind}" must be one of code|prd|spec|proposal|doc|adr|visual|research`)
      continue
    }
    if (!REFERENCE_ROLES.has(record.role as ReferenceRole)) {
      issues.push(`${label}: reference role "${record.role}" must be one of intent|implementation|context`)
      continue
    }
    if (!validateReferenceTarget(record.target, record.kind as ReferenceKind, issues, label)) continue
    if (
      record.title !== undefined
      && (typeof record.title !== 'string' || !record.title.trim() || /[\r\n]/.test(record.title))
    ) {
      issues.push(`${label}: reference "title" must be a non-empty single-line string when present`)
      continue
    }
    if (
      record.state !== undefined
      && (typeof record.state !== 'string' || !record.state.trim() || /[\r\n]/.test(record.state))
    ) {
      issues.push(`${label}: reference "state" must be a non-empty single-line string when present`)
      continue
    }
    result.push({
      kind: record.kind as ReferenceKind,
      role: record.role as ReferenceRole,
      target: record.target,
      title: typeof record.title === 'string' ? record.title : undefined,
      state: typeof record.state === 'string' ? record.state : undefined
    })
  }
  return result
}

/** Report unknown frontmatter keys so typos fail loudly. */
export function rejectUnknownKeys(data: Record<string, unknown>, allowed: string[], issues: string[], label: string): void {
  for (const key of Object.keys(data)) {
    if (!allowed.includes(key)) issues.push(`${label}: unknown frontmatter key "${key}"`)
  }
}
