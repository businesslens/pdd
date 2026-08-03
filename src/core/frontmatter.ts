import { parse } from 'yaml'

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

export interface CompactEntryPoint {
  type: string
  path: string
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

export interface EntityLink {
  rel: EntityLinkRel
  href: string
  title?: string
}

export type EntityLinkRel = 'spec' | 'proposal' | 'doc' | 'adr' | 'visual' | 'research'

export const LINK_RELS = new Set<EntityLinkRel>(['spec', 'proposal', 'doc', 'adr', 'visual', 'research'])

/** The tracked repository path named by a local href, without query or fragment. */
export function repositoryLinkPath(href: string): string | undefined {
  if (/^https?:\/\//i.test(href)) return undefined
  return href.split(/[?#]/, 1)[0]?.replace(/^\.\//, '') || undefined
}

function validateLinkHref(href: string, issues: string[], label: string): boolean {
  if (!href.trim()) {
    issues.push(`${label}: link "href" must not be empty`)
    return false
  }
  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href)
      if (!url.hostname) throw new Error('missing hostname')
      return true
    } catch {
      issues.push(`${label}: link href "${href}" is not a valid HTTP(S) URL`)
      return false
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    issues.push(`${label}: link href "${href}" must use HTTP(S) or a repository-relative path`)
    return false
  }
  if (/^(?:[/\\]|~[/\\]|[a-z]:[/\\])/i.test(href) || href.includes('\\')) {
    issues.push(`${label}: link href "${href}" must be repository-relative, not an absolute filesystem path`)
    return false
  }
  return true
}

export function linksField(data: Record<string, unknown>, issues: string[], label: string): EntityLink[] {
  const value = data.links
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    issues.push(`${label}: "links" must be a list`)
    return []
  }
  const result: EntityLink[] = []
  for (const item of value) {
    const record = item as Record<string, unknown>
    if (typeof record !== 'object' || record === null || typeof record.rel !== 'string' || typeof record.href !== 'string') {
      issues.push(`${label}: each link needs "rel" and "href"`)
      continue
    }
    if (!LINK_RELS.has(record.rel as EntityLinkRel)) {
      issues.push(`${label}: link rel "${record.rel}" must be one of spec|proposal|doc|adr|visual|research`)
      continue
    }
    if (!validateLinkHref(record.href, issues, label)) continue
    if (
      record.title !== undefined
      && (typeof record.title !== 'string' || !record.title.trim())
    ) {
      issues.push(`${label}: link "title" must be a non-empty string when present`)
      continue
    }
    result.push({
      rel: record.rel as EntityLinkRel,
      href: record.href,
      title: typeof record.title === 'string' ? record.title : undefined
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
