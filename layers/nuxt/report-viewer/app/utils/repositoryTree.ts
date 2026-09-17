export interface RepositoryTreeNode {
  value: string
  label: string
  directory: boolean
  children: RepositoryTreeNode[]
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

export function filterRepositoryTree<T extends RepositoryTreeNode>(nodes: T[], query: string): T[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return nodes
  return nodes.flatMap(node => {
    if (node.value.toLowerCase().includes(needle)) return [node]
    const children = filterRepositoryTree(node.children, query)
    return children.length ? [{ ...node, children }] : []
  })
}
