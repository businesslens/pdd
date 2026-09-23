import type { ReportReference } from 'businesslens/report'
import type { ReferenceGroup } from './reportWorkspace'
import { isExternalReference } from './referenceNavigation'
import { repositoryTree, type RepositoryTreeNode } from './repositoryTree'

/**
 * The References catalog: every attachment in the model, read by where it
 * points rather than one row per attachment.
 *
 * Many resources cite the same file, so the catalog draws each repository path
 * once, in a repository tree, and each external page once under its site; the
 * citations — which resource, in what role, at which symbol or line — are
 * disclosed by that location's row.
 */
export type ReferenceKind = ReportReference['kind']
export type ReferenceOrigin = 'internal' | 'external'

export const REFERENCE_KIND_ORDER: ReferenceKind[] = ['code', 'doc', 'spec', 'prd', 'proposal', 'adr', 'visual', 'research']

export const REFERENCE_KIND_LABEL: Record<ReferenceKind, string> = {
  code: 'Code', visual: 'Visuals', doc: 'Documentation',
  prd: 'Product requirements', spec: 'Specifications', proposal: 'Proposals',
  adr: 'Architecture decisions', research: 'Research'
}

export interface ReferenceCitation extends ReferenceGroup {
  /** Position in the workspace's reference list, stable across filtering. */
  index: number
  origin: ReferenceOrigin
  /** The repository path, without a trailing `/`, or the page URL without its fragment. */
  location: string
  /** The symbol (`#Name`), line range (`:12-20`) or URL fragment cited within it. */
  anchor: string
  /** The site of an external page. */
  host: string
  directory: boolean
}

/** Where a reference target points, and what it cites within that place. */
export function referenceLocation(target: string) {
  if (isExternalReference(target)) {
    const hash = target.indexOf('#')
    const location = hash < 0 ? target : target.slice(0, hash)
    let host = location
    try { host = new URL(location).host } catch { /* Keep the URL as its own site. */ }
    return { origin: 'external' as const, location, anchor: hash < 0 ? '' : target.slice(hash), host, directory: false }
  }
  const hash = target.indexOf('#')
  let path = hash < 0 ? target : target.slice(0, hash)
  let anchor = hash < 0 ? '' : target.slice(hash)
  const line = !anchor ? path.match(/:\d+(?:-\d+)?$/) : null
  if (line) { anchor = line[0]; path = path.slice(0, -line[0].length) }
  path = path.replace(/^\.\//, '')
  return { origin: 'internal' as const, location: path.replace(/\/$/, ''), anchor, host: '', directory: path.endsWith('/') }
}

export function referenceCitations(groups: ReferenceGroup[]): ReferenceCitation[] {
  return groups.map((group, index) => ({ ...group, index, ...referenceLocation(group.reference.target) }))
}

/** A location as the catalog finds it: its path or URL as written, or its site. */
export function referenceLocationMatches(citation: ReferenceCitation, query: string) {
  const needle = query.trim().toLowerCase()
  return !needle || citation.reference.target.toLowerCase().includes(needle) || citation.host.toLowerCase().includes(needle)
}

/** Citations grouped by the exact location they point at, in authored order. */
export function referenceCitationIndex(citations: ReferenceCitation[]) {
  const index = new Map<string, ReferenceCitation[]>()
  for (const citation of citations) index.set(citation.location, [...index.get(citation.location) ?? [], citation])
  return index
}

/** Repository paths as a tree; directories are those written with a trailing `/` or holding others. */
export function referenceRepositoryTree(citations: ReferenceCitation[]): RepositoryTreeNode[] {
  const internal = citations.filter(citation => citation.origin === 'internal')
  const directories = new Set(internal.filter(citation => citation.directory).map(citation => citation.location))
  const finish = (nodes: RepositoryTreeNode[]): RepositoryTreeNode[] => nodes.map(node => ({
    ...node, directory: node.directory || directories.has(node.value), children: finish(node.children)
  })).sort((a, b) => Number(b.directory) - Number(a.directory) || a.label.localeCompare(b.label))
  return finish(repositoryTree([...new Set(internal.map(citation => citation.location))]))
}

/** Sites whose first two path segments name a repository, so pages group by it. */
const CODE_HOSTS = new Set(['github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org'])

/** A page's repository on a code host, and where it sits within that repository. */
function repositoryOf(location: string) {
  try {
    const url = new URL(location)
    if (!CODE_HOSTS.has(url.host)) return null
    const [owner, name, ...rest] = url.pathname.split('/').filter(Boolean)
    if (!owner || !name) return null
    // `blob/<ref>/` and `tree/<ref>/` say how the host serves a file, not where it is.
    const path = (['blob', 'tree'].includes(rest[0] ?? '') ? rest.slice(2) : rest).join('/')
    return { repository: `${owner}/${name}`, path }
  } catch { return null }
}

/**
 * External pages under their site, and on a code host under their repository
 * as well, so links into one repository read together. Sites and repositories
 * are keyed apart from any repository path.
 */
export function referenceSiteTree(citations: ReferenceCitation[]): RepositoryTreeNode[] {
  const titles = new Map<string, string>()
  const sites = new Map<string, Set<string>>()
  for (const citation of citations.filter(citation => citation.origin === 'external')) {
    if (!titles.get(citation.location)) titles.set(citation.location, citation.reference.title ?? '')
    sites.set(citation.host, (sites.get(citation.host) ?? new Set()).add(citation.location))
  }
  const byLabel = (a: RepositoryTreeNode, b: RepositoryTreeNode) =>
    Number(b.directory) - Number(a.directory) || a.label.localeCompare(b.label)
  const page = (location: string, fallback: string): RepositoryTreeNode =>
    ({ value: location, label: titles.get(location) || fallback, directory: false, children: [] })
  return [...sites].sort(([a], [b]) => a.localeCompare(b)).map(([host, locations]) => {
    const repositories = new Map<string, RepositoryTreeNode[]>()
    const pages: RepositoryTreeNode[] = []
    for (const location of locations) {
      const within = repositoryOf(location)
      if (within) {
        repositories.set(within.repository, [...repositories.get(within.repository) ?? [], page(location, within.path || within.repository)])
      } else pages.push(page(location, location))
    }
    return {
      value: `site:${host}`,
      label: host,
      directory: true,
      children: [
        ...[...repositories].map(([repository, children]) => ({
          value: `repo:${host}/${repository}`, label: repository, directory: true, children: children.sort(byLabel)
        })),
        ...pages
      ].sort(byLabel)
    }
  })
}
