import type { ReportWorkspace, ReferenceGroup } from './reportWorkspace'
import type { CoverageComparison, CoverageChange } from 'businesslens/report'

export interface CoverageNode {
  value: string
  label: string
  directory: boolean
  children: CoverageNode[]
  sources: number[]
  gaps: number[]
  exclusions: number[]
  owners: string[]
  reviewPaths: string[]
  changes: Partial<Record<CoverageChange, number>>
}

export const referenceOwner = (group: ReferenceGroup) => group.ownerKey || 'product'
export function referenceFile(group: ReferenceGroup): string | undefined {
  const target = group.reference.target
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('/')) return undefined
  return target.split(/[?#]/, 1)[0]?.replace(/:\d+(?:-\d+)?$/, '').replace(/^\.\//, '') || undefined
}
const keyOf = (path: string) => path.replace(/^\.\//, '').replace(/\/$/, '')

/** Each annotation means only what its author recorded. Parents aggregate distinct entries. */
export function coverageRepository(workspace: Pick<ReportWorkspace, 'coverage' | 'references'>, files: string[], review?: CoverageComparison): CoverageNode[] {
  const roots: CoverageNode[] = []
  const nodes = new Map<string, CoverageNode>()
  const direct = new Set<string>()
  function insert(path: string): CoverageNode {
    const key = keyOf(path)
    const parts = key.split('/')
    let siblings = roots
    let last!: CoverageNode
    for (let index = 0; index < parts.length; index++) {
      const value = parts.slice(0, index + 1).join('/')
      let node = nodes.get(value)
      const directory = index < parts.length - 1 || path.endsWith('/')
      if (!node) {
        node = { value, label: parts[index]!, directory, children: [], sources: [], gaps: [], exclusions: [], owners: [], reviewPaths: [], changes: {} }
        nodes.set(value, node)
        siblings.push(node)
      }
      node.directory ||= directory
      siblings = node.children
      last = node
    }
    return last
  }
  for (const file of files) insert(file)
  for (const file of review?.files ?? []) {
    const node = insert(file.path)
    node.reviewPaths.push(file.path)
    node.changes[file.change] = 1
    direct.add(node.value)
  }
  for (const file of [...(review?.baseline?.files ?? []), ...(review?.pending?.files ?? [])]) {
    const node = insert(file.path)
    if (!node.reviewPaths.includes(file.path)) node.reviewPaths.push(file.path)
    direct.add(node.value)
  }
  workspace.coverage.sourceAreas.forEach((path, index) => {
    const node = insert(path)
    node.sources.push(index)
    direct.add(node.value)
  })
  workspace.coverage.unmapped.forEach((area, index) => {
    for (const path of area.paths) {
      const node = insert(path)
      node.gaps.push(index)
      direct.add(node.value)
    }
  })
  workspace.coverage.exclusions.forEach((area, index) => {
    for (const path of area.paths) {
      const node = insert(path)
      node.exclusions.push(index)
      direct.add(node.value)
    }
  })
  for (const reference of workspace.references) {
    const path = referenceFile(reference)
    if (!path) continue
    const node = insert(path)
    node.owners.push(referenceOwner(reference))
    direct.add(node.value)
  }
  const union = <T>(values: T[]) => [...new Set(values)]
  function finish(node: CoverageNode): CoverageNode {
    const children = node.children.map(finish).sort((a, b) => Number(b.directory) - Number(a.directory) || a.label.localeCompare(b.label))
    const changes = { ...node.changes }
    for (const child of children) for (const [change, count] of Object.entries(child.changes)) {
      const key = change as CoverageChange
      changes[key] = (changes[key] ?? 0) + count
    }
    const result = {
      ...node, children,
      changes,
      reviewPaths: union([...node.reviewPaths, ...children.flatMap(child => child.reviewPaths)]),
      sources: union([...node.sources, ...children.flatMap(child => child.sources)]),
      gaps: union([...node.gaps, ...children.flatMap(child => child.gaps)]),
      exclusions: union([...node.exclusions, ...children.flatMap(child => child.exclusions)]),
      owners: union([...node.owners, ...children.flatMap(child => child.owners)])
    }
    if (!direct.has(node.value) && children.length === 1) {
      return { ...children[0]!, label: `${node.label}/${children[0]!.label}` }
    }
    return result
  }
  return roots.map(finish).sort((a, b) => Number(b.directory) - Number(a.directory) || a.label.localeCompare(b.label))
}

export function filterCoverageTree(nodes: CoverageNode[], query: string): CoverageNode[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return nodes
  return nodes.flatMap(node => {
    if (node.value.toLowerCase().includes(needle)) return [node]
    const children = filterCoverageTree(node.children, query)
    return children.length ? [{ ...node, children }] : []
  })
}

export function coverageTreeNodes(nodes: CoverageNode[]): CoverageNode[] {
  return nodes.flatMap(node => [node, ...coverageTreeNodes(node.children)])
}
