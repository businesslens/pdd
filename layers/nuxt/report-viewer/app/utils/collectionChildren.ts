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
import type { AnyResourceView, ExperienceView, InterfaceView, ReportResourceKind, ReportWorkspace, RuleView, ScreenView } from './reportWorkspace'
import { ENTITY_KIND_META, resourceKey } from './reportWorkspace'
import { interfaceProjection } from './topologyProjections'
import { entityOperation, ruleAttachments } from './topologyTargets'
import { resourceAncestors } from './reportDestinations'
import type { TopologyBranch } from './topologyProjections'
import { placeDelivery, placeJourneys, stepsLabel } from './placeReadings'

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
  /** A short qualifier under the title, e.g. the Journey a Journey Scenario belongs to. */
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

/** Name a place's own tree in its tab and accessible label. */
export function structureLabel(_resource: AnyResourceView): string {
  return 'Delivery'
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
 * What happens at a place, as items in its own branch. First what it
 * delivers: a Screen's own Capabilities; an Experience's or Interface's gap,
 * available there and on no Screen of its own; or, for an Interface with no
 * Screens, delivered directly. Every Capability of one place carries the same
 * one of those, so a gap or a direct delivery is said once, as the group
 * holding them, never on each row. Under each Capability sit its own Scenarios
 * with a Step placed exactly on this place. Then the Journeys passing through:
 * a Journey Scenario belongs to its Journey, not to a Capability its Steps
 * use, so it sits under its Journey, noted with the Steps taken here, and each
 * appears once. All are occurrences, so an id is the path of keys.
 */
function deliveryLeaves(workspace: ReportWorkspace, place: InterfaceView | ExperienceView | ScreenView): TreeCardNode[] {
  const delivered = placeDelivery(workspace, place)
  const leaves = delivered.map(({ capability, scenarios }) => {
    const id = `${place.key}>${capability.key}`
    return { ...leaf(capability, scenarios.map(scenario => ({ ...leaf(scenario), id: `${id}>${scenario.key}` }))), id }
  })
  const note = delivered[0]?.note
  const journeys = placeJourneys(workspace, place).map(({ journey, scenarios }) => {
    const id = `${place.key}>${journey.key}`
    return { ...leaf(journey, scenarios.map(({ scenario, steps }) => ({ ...leaf(scenario), id: `${id}>${scenario.key}`, note: `${stepsLabel(steps)} here` }))), id }
  })
  return [
    ...(!note || note === 'own' ? leaves : [{ ...group(`${place.key}:${note}`, 'capability', leaves), title: note === 'gap' ? 'Available here, on no Screen' : 'Delivered directly' }]),
    ...journeys
  ]
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
  /* A Screen's own branch, as it sits in its container's tree. */
  if (resource.kind === 'screen') return screenLeaf(resource).children
  return []
}

/**
 * What a Business Rule applies to, as a tree: its targets grouped by kind in
 * rail order. A target holds only the places the Rule itself names — the
 * Contexts it narrows the target to, each noted with where it sits because
 * places repeat titles across Interfaces. A target the Rule does not narrow is
 * noted "Every supported Context" and holds nothing: those places are the
 * target's, read on its own page, where the Rule is listed too. An Entity
 * target notes its operation; a Context target is the place itself. Every
 * edge drawn here is read at its other end (see `attachedRules`).
 */
export function ruleScope(workspace: ReportWorkspace, rule: RuleView): TreeCardNode[] {
  const targets = ruleAttachments(workspace, rule).map(({ id, resource, target, contexts: narrowed }): TreeCardNode => {
    if (target.type === 'context') return { ...leaf(resource), id, note: 'Everything done here' }
    const where = narrowed.length
      ? `Only in ${narrowed.length} ${narrowed.length === 1 ? 'place' : 'places'}`
      : target.type === 'entity' ? '' : 'Every supported Context'
    const note = [target.type === 'entity' ? entityOperation(target) : '', where].filter(Boolean).join(' · ')
    const placeLeaf = (place: AnyResourceView): TreeCardNode => {
      const within = resourceAncestors(workspace, place).map(item => item.title).join(' · ')
      return { ...leaf(place), id: `${id}>${place.key}`, ...(within ? { note: within } : {}) }
    }
    return { ...leaf(resource, narrowed.map(placeLeaf)), id, ...(note ? { note } : {}) }
  })
  return KIND_ORDER.flatMap((kind) => {
    const members = targets.filter(node => node.resource?.kind === kind)
    return members.length ? [group(`${rule.key}:${kind}`, kind, members)] : []
  })
}

export interface InsideCount {
  kind: ReportResourceKind
  count: number
}

const KIND_ORDER = Object.keys(ENTITY_KIND_META) as ReportResourceKind[]

/**
 * What opening a closed row would find: the distinct resources anywhere below
 * it, counted by kind in rail order. It is navigation, never the row's own
 * meaning, so a row draws it only while closed. A resource filed twice below —
 * a Capability exposed on two Screens — counts once. A group already counts
 * its own kind, so its summary names only what lies deeper.
 */
export function insideSummary(node: TreeCardNode): InsideCount[] {
  const found = new Map<ReportResourceKind, Set<string>>()
  const walk = (child: TreeCardNode) => {
    const resource = child.resource
    if (resource && resource.kind !== node.groupKind) found.set(resource.kind, (found.get(resource.kind) ?? new Set()).add(resource.key))
    child.children.forEach(walk)
  }
  node.children.forEach(walk)
  return KIND_ORDER.flatMap(kind => found.has(kind) ? [{ kind, count: found.get(kind)!.size }] : [])
}

/** The summary read aloud, as the expand control's label carries it. */
export function insideLabel(summary: InsideCount[]): string {
  return summary.map(({ kind, count }) => `${count} ${count === 1 ? ENTITY_KIND_META[kind].label : ENTITY_KIND_META[kind].plural}`).join(', ')
}

/** The same compact expansion defaults wherever a hierarchy is read. Scenarios start folded, under a Capability or a Journey alike. */
export function treeBranchKeys(nodes: TreeCardNode[], defaults = false): string[] {
  return nodes.flatMap(node => [
    ...(node.children.length && (!defaults || (node.children.length <= 8 && node.resource?.kind !== 'capability' && node.resource?.kind !== 'journey')) ? [node.id] : []),
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
