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
import type { AnyResourceView, ExperienceView, InterfaceView, ReportResourceKind, ReportWorkspace, ScreenView } from './reportWorkspace'
import { ENTITY_KIND_META, resourceKey } from './reportWorkspace'
import { interfaceProjection } from './topologyProjections'
import type { TopologyBranch } from './topologyProjections'
import { placeCapabilities } from './placeReadings'

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
  /** An available Screen reference, not a child owned by this reading. */
  sharedFrom?: AnyResourceView
  /** A short qualifier under the title, e.g. a Capability delivered directly. */
  note?: string
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

/** Name the contained resource types in tabs and accessible tree labels. */
export function structureLabel(resource: AnyResourceView): string {
  return resource.kind === 'interface' ? 'Experiences & Screens' : 'Screens'
}

/** A Screen's nested Screens, resolved in authored order. */
export function childScreens(workspace: ReportWorkspace, screen: ScreenView): ScreenView[] {
  return screen.childScreenIds.flatMap((id) => {
    const child = workspace.byKey.get(resourceKey('screen', id))
    return child?.kind === 'screen' ? [child] : []
  })
}

/** The Screens a container holds directly; a nested Screen is its parent's child, not the container's. */
export function ownedScreens(workspace: ReportWorkspace, owner: AnyResourceView): ScreenView[] {
  return workspace.screens.filter(screen => !screen.parentScreenId && screen.contexts.some(context =>
    owner.kind === 'experience' ? context.experienceId === owner.id : context.interfaceId === owner.id && !context.experienceId))
}

/**
 * What a place delivers, as items in its own branch: a Screen's own
 * Capabilities; an Experience's or Interface's gap, available there and on no
 * Screen of its own; or, for an Interface with no Screens, delivered directly.
 * A Capability is an occurrence, so its id is the place's and its own.
 */
function deliveryLeaves(workspace: ReportWorkspace, place: InterfaceView | ExperienceView | ScreenView): TreeCardNode[] {
  const { capabilities, note } = placeCapabilities(workspace, place)
  return capabilities.map(capability => ({
    ...leaf(capability), id: `${place.key}>${capability.key}`,
    ...(note === 'gap' ? { note: 'Available here, on no Screen' } : note === 'direct' ? { note: 'Delivered directly' } : {})
  }))
}

/** One hierarchy for collection cards and focused containment readings. */
export function structureChildren(workspace: ReportWorkspace, resource: AnyResourceView): TreeCardNode[] {
  /* A nested Screen sits under its parent Screen with no group between: the parent already says what kind it holds.
     Its own Capabilities come first, then the Screens nested inside it. */
  const screenLeaf = (screen: ScreenView): TreeCardNode => leaf(screen, [...deliveryLeaves(workspace, screen), ...childScreens(workspace, screen).map(screenLeaf)])
  const screensOf = (owner: AnyResourceView) => ownedScreens(workspace, owner)
  const screenGroup = (owner: AnyResourceView) => group(`${owner.key}:screens`, 'screen', screensOf(owner).map(screenLeaf))
  if (resource.kind === 'interface') {
    const experiences = workspace.experiences.filter(item => item.interfaceIds.includes(resource.id))
    const screens = screenGroup(resource)
    if (experiences.length) screens.title = 'Shared Screens'
    return [
      group(`${resource.key}:experiences`, 'experience', experiences.map(experience => leaf(experience, [...deliveryLeaves(workspace, experience), ...[screenGroup(experience)].filter(node => node.children.length)]))),
      screens
    ].filter(node => node.children.length).concat(deliveryLeaves(workspace, resource))
  }
  if (resource.kind === 'experience') {
    const shared = workspace.interfaces.filter(iface => resource.interfaceIds.includes(iface.id)).flatMap(iface =>
      screensOf(iface).map(screen => ({ ...screenLeaf(screen), sharedFrom: iface })))
    return [...deliveryLeaves(workspace, resource), ...[screenGroup(resource), { ...group(`${resource.key}:shared-screens`, 'screen', shared), title: 'Shared Screens' }].filter(node => node.children.length)]
  }
  return []
}

/** The same compact expansion defaults wherever a hierarchy is read. */
export function treeBranchKeys(nodes: TreeCardNode[], defaults = false): string[] {
  return nodes.flatMap(node => [
    ...(node.children.length && (!defaults || node.children.length <= 8) ? [node.id] : []),
    ...treeBranchKeys(node.children, defaults)
  ])
}

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
    return resources.filter(item => item.kind === 'interface').map(iface => ({
      key: iface.key, title: iface.title, resource: iface, children: structureChildren(workspace, iface)
    }))
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
