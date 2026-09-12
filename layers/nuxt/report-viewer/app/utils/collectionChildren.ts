/**
 * What a collection row expands to.
 *
 * A row is one resource; its children are the resources the model files under
 * it, in the model's own order. Nothing here derives a relation the projection
 * does not already hold: an Interface's Experiences and Screens are its
 * containment, a Domain's Capabilities and Entities are its classification, a
 * Capability's or Journey's Scenarios are its acceptance. Collections whose
 * rows have nothing under them expand to nothing and draw no toggle.
 */
import type { AnyResourceView, ReportResourceKind, ReportWorkspace, ScenarioView } from './reportWorkspace'
import { resolveResource } from './reportWorkspace'
import { interfaceProjection } from './topologyProjections'
import type { TopologyBranch } from './topologyProjections'
import { childrenOf } from './pageSections'

export interface RowChild {
  resource: AnyResourceView
  /** A hook that replaces the card's own where the parent already says it. */
  hookLabel?: string
  hook?: string
  children: RowChild[]
}

/** The collections whose rows expand in place to their Scenarios. */
export const EXPANDABLE_KINDS: ReportResourceKind[] = ['capability', 'journey']

/** The collections drawn as one tree card per subject. */
export const TREE_CARD_KINDS: ReportResourceKind[] = ['interface', 'domain']

export interface TreeCardNode {
  id: string
  title: string
  resource?: AnyResourceView
  children: TreeCardNode[]
}

export interface TreeCard {
  key: string
  title: string
  resource?: AnyResourceView
  colorSlot?: number
  note?: string
  children: TreeCardNode[]
}

const leaf = (resource: AnyResourceView, children: TreeCardNode[] = []): TreeCardNode => ({ id: resource.key, title: resource.title, resource, children })
const group = (id: string, title: string, children: TreeCardNode[]): TreeCardNode[] => children.length ? [{ id, title, children }] : []

/**
 * A Domain card groups its Capabilities and its Entities; an Interface card its
 * Experiences, each with its Screens, and the Screens it holds directly. The
 * Domain grid ends with what no Domain claims, unless a filter narrowed it.
 */
export function treeCards(workspace: ReportWorkspace, kind: ReportResourceKind, resources: AnyResourceView[], narrowed: boolean): TreeCard[] {
  if (kind === 'domain') {
    const domainCard = (key: string, title: string, capabilities: AnyResourceView[], entities: AnyResourceView[], resource?: AnyResourceView & { colorSlot?: number }): TreeCard => ({
      key, title, resource, colorSlot: resource?.colorSlot,
      children: [...group(`${key}:capabilities`, 'Capabilities', capabilities.map(item => leaf(item))), ...group(`${key}:entities`, 'Entities', entities.map(item => leaf(item)))]
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
        note: !rows.length ? 'No contained resources are modeled.' : undefined,
        children: [...group(`${iface.key}:experiences`, 'Experiences', experiences), ...group(`${iface.key}:screens`, 'Screens', screens)] }
    })
  }
  return []
}

/** The Capability chain a Journey Scenario composes, in Step order. */
export function scenarioCapabilityChain(workspace: ReportWorkspace, scenario: ScenarioView): string {
  return scenario.steps
    .flatMap(step => step.capabilityId ? [resolveResource(workspace, 'capability', step.capabilityId)?.title ?? step.capabilityId] : [])
    .join(' → ')
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
    case 'capability':
      return childrenOf(workspace, resource).map(item => ({ resource: item, children: [] }))
    case 'journey':
      return (childrenOf(workspace, resource) as ScenarioView[]).map((item) => {
        const chain = scenarioCapabilityChain(workspace, item)
        return chain ? { resource: item, hookLabel: 'Composes', hook: chain, children: [] } : { resource: item, children: [] }
      })
    default:
      return []
  }
}
