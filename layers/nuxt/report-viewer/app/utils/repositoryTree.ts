import type { ReportResourceKind } from './reportWorkspace'

export interface RepositoryTreeNode {
  value: string
  label: string
  directory: boolean
  children: RepositoryTreeNode[]
}

const MODEL_COLLECTIONS: Record<string, ReportResourceKind> = {
  entities: 'entity', interfaces: 'interface', domains: 'domain',
  capabilities: 'capability', journeys: 'journey', 'business-rules': 'rule'
}
const CHILD_COLLECTIONS: Partial<Record<ReportResourceKind, Record<string, ReportResourceKind>>> = {
  interface: { experiences: 'experience', screens: 'screen' },
  experience: { screens: 'screen' },
  capability: { scenarios: 'capability-scenario' },
  journey: { scenarios: 'journey-scenario' }
}

/** Recognize authored model paths, including nested models. */
export function repositoryModelKind(node: Pick<RepositoryTreeNode, 'value' | 'directory'>): ReportResourceKind | null {
  const parts = node.value.split('/')
  const model = parts.lastIndexOf('.businesslens')
  if (model < 0) return null
  const [collection, ...path] = parts.slice(model + 1)
  if (collection === 'product' && node.directory && !path.length) return 'product'
  if (!node.directory && ((collection === 'product.md' && !path.length)
    || (collection === 'product' && path.length === 1 && path[0] === 'product.md'))) return 'product'
  const kind = collection && Object.hasOwn(MODEL_COLLECTIONS, collection) ? MODEL_COLLECTIONS[collection] : undefined
  if (!kind) return null

  function within(remaining: string[], kind: ReportResourceKind): ReportResourceKind | null {
    // A collection, compact Markdown resource, or expanded resource folder.
    if (!remaining.length) return node.directory ? kind : null
    if (remaining.length === 1) return node.directory || remaining[0]!.endsWith('.md') ? kind : null
    const [, child, ...rest] = remaining
    const filename = `${kind === 'rule' ? 'business-rule' : kind}.md`
    if (!node.directory && remaining.length === 2 && child === filename) return kind
    const children = CHILD_COLLECTIONS[kind]
    const childKind = children && Object.hasOwn(children, child!) ? children[child!] : undefined
    return childKind ? within(rest, childKind) : null
  }
  return within(path, kind)
}

export function repositoryTree(paths: string[]): RepositoryTreeNode[] {
  const roots: RepositoryTreeNode[] = []
  const nodes = new Map<string, RepositoryTreeNode>()
  for (const path of paths) {
    let siblings = roots
    const parts = path.split('/')
    for (let index = 0; index < parts.length; index++) {
      const value = parts.slice(0, index + 1).join('/')
      let node = nodes.get(value)
      if (!node) {
        node = { value, label: parts[index]!, directory: index < parts.length - 1, children: [] }
        nodes.set(value, node); siblings.push(node)
      }
      node.directory ||= index < parts.length - 1
      siblings = node.children
    }
  }
  const sort = (items: RepositoryTreeNode[]): RepositoryTreeNode[] => items
    .sort((a, b) => Number(b.directory) - Number(a.directory) || a.label.localeCompare(b.label))
    .map(item => ({ ...item, children: sort(item.children) }))
  return sort(roots)
}

export function repositoryTreeNodes<T extends RepositoryTreeNode>(nodes: T[]): T[] {
  return nodes.flatMap(node => [node, ...repositoryTreeNodes(node.children as T[])])
}
