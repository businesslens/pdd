/**
 * What a tree card holds.
 *
 * A card is one Interface or Domain; its children are the resources the model
 * files under it, in the model's own order. Nothing here derives a relation the
 * projection does not already hold: an Interface's Experiences and Screens are
 * its containment, a Domain's Capabilities and Entities are its classification.
 * Every other collection lists plain rows; a Capability's or Journey's
 * Scenarios are read on its page.
 */
import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from './reportWorkspace'
import { ENTITY_KIND_META } from './reportWorkspace'
import { interfaceProjection } from './topologyProjections'
import type { TopologyBranch } from './topologyProjections'

export interface RowChild {
  resource: AnyResourceView
  children: RowChild[]
}

/** The collections drawn as one tree card per subject. */
export const TREE_CARD_KINDS: ReportResourceKind[] = ['interface', 'domain']

export interface TreeCardNode {
  id: string
  title: string
  resource?: AnyResourceView
  groupKind?: ReportResourceKind
  children: TreeCardNode[]
}

export interface TreeCard {
  key: string
  title: string
  resource?: AnyResourceView
  children: TreeCardNode[]
}

const leaf = (resource: AnyResourceView, children: TreeCardNode[] = []): TreeCardNode => ({ id: resource.key, title: resource.title, resource, children })
const group = (id: string, kind: ReportResourceKind, children: TreeCardNode[]): TreeCardNode => ({ id, title: ENTITY_KIND_META[kind].plural, groupKind: kind, children })

/**
 * A Domain card groups its Capabilities and its Entities; an Interface card its
 * Experiences, each with its Screens, and the Screens it holds directly. The
 * Domain grid ends with what no Domain claims, unless a filter narrowed it.
 */
export function treeCards(workspace: ReportWorkspace, kind: ReportResourceKind, resources: AnyResourceView[], narrowed: boolean): TreeCard[] {
  if (kind === 'domain') {
    const domainCard = (key: string, title: string, capabilities: AnyResourceView[], entities: AnyResourceView[], resource?: AnyResourceView): TreeCard => ({
      key, title, resource,
      children: [group(`${key}:capabilities`, 'capability', capabilities.map(item => leaf(item))), group(`${key}:entities`, 'entity', entities.map(item => leaf(item)))].filter(group => group.children.length)
    })
    const cards = resources.filter(item => item.kind === 'domain').map(domain => domainCard(domain.key, domain.title,
      workspace.capabilities.filter(item => item.domainId === domain.id), workspace.entities.filter(item => item.domainId === domain.id), domain))
    const unassigned = domainCard('unassigned', 'Unassigned', workspace.capabilities.filter(item => !item.domainId), workspace.entities.filter(item => !item.domainId))
    return [...cards, ...(!narrowed && unassigned.children.length ? [unassigned] : [])]
  }
  if (kind === 'interface') {
    return resources.filter(item => item.kind === 'interface').map((iface) => {
      const rows = rowChildren(workspace, iface)
      const experiences = rows.filter(row => row.resource.kind === 'experience').map(row => leaf(row.resource, row.children.map(child => leaf(child.resource))))
      const screens = rows.filter(row => row.resource.kind === 'screen').map(row => leaf(row.resource))
      return { key: iface.key, title: iface.title, resource: iface,
        children: [group(`${iface.key}:experiences`, 'experience', experiences), group(`${iface.key}:screens`, 'screen', screens)].filter(group => group.children.length) }
    })
  }
  return []
}

const fromBranch = (branch: TopologyBranch): RowChild[] => branch.children
  .flatMap(child => child.resource ? [{ resource: child.resource, children: fromBranch(child) }] : fromBranch(child))

export function rowChildren(workspace: ReportWorkspace, resource: AnyResourceView): RowChild[] {
  switch (resource.kind) {
    case 'interface': {
      const branch = interfaceProjection(workspace).find(item => item.id === resource.key)
      return branch ? fromBranch(branch) : []
    }
    case 'domain':
      return [
        ...workspace.capabilities.filter(item => item.domainId === resource.id),
        ...workspace.entities.filter(item => item.domainId === resource.id)
      ].map(item => ({ resource: item, children: [] }))
    default:
      return []
  }
}
