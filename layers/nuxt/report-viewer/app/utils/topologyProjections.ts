/** Named semantic readings. No coordinates, hover state, or renderer types. */
import type { AnyResourceView, CapabilityView, ContextView, DomainView, ReportWorkspace, RuleView, ScenarioView } from './reportWorkspace'
import { ENTITY_KIND_META, resourceKey } from './reportWorkspace'
import { ruleAttachments, topologyPlace } from './topologyTargets'
import { absentAlternatives, placeDelivery, placeJourneys, type Place } from './placeReadings'
import type { TopologyAttachment } from './topologyTargets'
import type { Diagram } from './diagram'
import { adjacentAlternatives, variationCondition, variationConditionNote } from './variations'

export interface TopologyBranch {
  id: string
  title: string
  resource?: AnyResourceView
  colorSlot?: number
  children: TopologyBranch[]
  references: AnyResourceView[]
  referenceLabel?: string
  contexts?: ContextView[]
  note?: string
  /** An alternative drawn under its Variation's node, which already names the set. */
  inSet?: boolean
  /** An alternative of its set's node that does not happen at the node's place: drawn struck, with no children. */
  absentFrom?: Place
}

/** The concrete resources a branch's children stand for: a Variation's node counts what is here under it, never itself or a struck one. */
export function concreteBranches(children: TopologyBranch[]): TopologyBranch[] {
  return children.flatMap(child => child.absentFrom ? [] : child.resource?.kind === 'variation' ? child.children.filter(item => !item.absentFrom) : [child])
}

/** Name a homogeneous collection of children without repeating its resource type. */
export function branchChildrenLabel(children: TopologyBranch[]): string {
  const concrete = concreteBranches(children)
  const kind = concrete[0]?.resource?.kind
  if (!kind || concrete.some(child => child.resource?.kind !== kind)) return 'branches'
  return concrete.length === 1 ? ENTITY_KIND_META[kind].label : ENTITY_KIND_META[kind].plural
}

export function branch(resource: AnyResourceView, children: TopologyBranch[] = []): TopologyBranch {
  return { id: resource.key, title: resource.title, resource, children, references: [] }
}

/**
 * Reach trees: one collection's set, rooted at the Product, each subject
 * branching into where it is reached and what reaches it.
 *
 * A child is an occurrence — `parent>child`, every segment a key — because the
 * question is asked of the subject: a Screen three Capabilities are available
 * on is an answer under each of them, and drawing it once would turn a tree
 * into a graph nothing asked for. The subject tier keeps plain keys so a page's
 * focus lands on its own branch.
 */
export const OCCURRENCE_SEPARATOR = '>'
export type ReachKind = 'domain' | 'capability' | 'journey' | 'rule'

const occurrence = (parent: string, resource: AnyResourceView, children: TopologyBranch[] = []): TopologyBranch =>
  ({ id: `${parent}${OCCURRENCE_SEPARATOR}${resource.key}`, title: resource.title, resource, children, references: [] })

const isPlace = (resource: AnyResourceView | undefined): resource is Place =>
  resource?.kind === 'interface' || resource?.kind === 'experience' || resource?.kind === 'screen'

/**
 * A graph tree folds as the Rows tree does: sibling alternatives sit under
 * their Variation's node, even one alone, and at a place an alternative that
 * does not happen there follows them struck, with no children. The set node
 * is membership, not containment; each alternative keeps its own branch.
 */
export function foldBranches(workspace: ReportWorkspace, parentId: string, branches: TopologyBranch[], place?: Place): TopologyBranch[] {
  const sets = new Map<string, TopologyBranch>()
  const folded = branches.flatMap((item) => {
    const key = item.resource?.variation?.key
    const set = key ? workspace.byKey.get(key) : undefined
    if (!key || set?.kind !== 'variation') return [item]
    const existing = sets.get(key)
    if (existing) { existing.children.push({ ...item, inSet: true }); return [] }
    /* At the root a set stands for itself, as a subject does; below, it is an occurrence under its parent. */
    const holder: TopologyBranch = { id: parentId ? `${parentId}${OCCURRENCE_SEPARATOR}${key}` : key, title: set.title, resource: set, references: [], children: [{ ...item, inSet: true }] }
    sets.set(key, holder)
    return [holder]
  })
  if (place) {
    for (const holder of sets.values()) {
      if (holder.resource?.kind !== 'variation') continue
      const absent = absentAlternatives(workspace, holder.resource, new Set(holder.children.map(child => child.resource?.key)), place)
      holder.children.push(...absent.map(alternative => ({ id: `${holder.id}${OCCURRENCE_SEPARATOR}${alternative.key}`, title: alternative.title, resource: alternative, references: [], children: [], inSet: true, absentFrom: place })))
    }
  }
  return folded
}

/** The most specific resource each Context resolves to, each place once. */
export function placesOf(workspace: ReportWorkspace, contexts: ContextView[]): AnyResourceView[] {
  const seen = new Map<string, AnyResourceView>()
  for (const context of contexts) {
    const place = topologyPlace(workspace, context.placeId)
    if (place) seen.set(place.key, place)
  }
  return [...seen.values()]
}

/** Attachment targets first, then additional reached places; each resource once per Rule. */
function ruleReach(workspace: ReportWorkspace, rule: RuleView): AnyResourceView[] {
  const seen = new Map<string, AnyResourceView>()
  for (const attachment of ruleAttachments(workspace, rule)) seen.set(attachment.resource.key, attachment.resource)
  // A direct Context target is also in rule.contexts; it is one child, not two.
  for (const place of placesOf(workspace, rule.contexts)) seen.set(place.key, place)
  return [...seen.values()]
}

const productRoot = (workspace: ReportWorkspace, children: TopologyBranch[]): TopologyBranch =>
  ({ id: resourceKey('product', workspace.identity.id), title: workspace.identity.title, children, references: [] })

/** Places first, then Rules, both as occurrences under the subject; alternatives among them sit under their Variation's node. */
function reachOf(workspace: ReportWorkspace, subject: AnyResourceView & { contexts: ContextView[], ruleIds: string[] }): TopologyBranch[] {
  return foldBranches(workspace, subject.key, [
    ...placesOf(workspace, subject.contexts).map(place => occurrence(subject.key, place)),
    ...subject.ruleIds.flatMap((id) => { const rule = workspace.byKey.get(resourceKey('rule', id)); return rule ? [occurrence(subject.key, rule)] : [] })
  ])
}

/** A Domain's members, grouped under the places they are reached in. */
function domainBranch(workspace: ReportWorkspace, id: string, title: string, members: Array<AnyResourceView & { contexts: ContextView[] }>, resource?: DomainView): TopologyBranch {
  const places = new Map<string, { place: AnyResourceView, members: AnyResourceView[] }>()
  const direct: AnyResourceView[] = []
  for (const member of members) {
    const reached = placesOf(workspace, member.contexts)
    if (!reached.length) direct.push(member)
    for (const place of reached) {
      const entry = places.get(place.key) ?? { place, members: [] }
      entry.members.push(member)
      places.set(place.key, entry)
    }
  }
  /* A Domain is not a place: the places it reaches fold under their Variations, never struck. */
  return { id, title, resource, references: [], colorSlot: resource?.colorSlot, children: foldBranches(workspace, id, [
    ...[...places.values()].map(({ place, members }) => {
      const at = `${id}${OCCURRENCE_SEPARATOR}${place.key}`
      return occurrence(id, place, foldBranches(workspace, at, members.map(member => occurrence(at, member)), isPlace(place) ? place : undefined))
    }),
    ...direct.map(member => occurrence(id, member))
  ]) }
}

export function reachTreeProjection(workspace: ReportWorkspace, kind: ReachKind): TopologyBranch {
  switch (kind) {
    case 'domain': {
      const membersOf = (ids: { capabilityIds: string[], journeyIds: string[], ruleIds: string[] }) => [
        ...workspace.capabilities.filter(item => ids.capabilityIds.includes(item.id)),
        ...workspace.journeys.filter(item => ids.journeyIds.includes(item.id)),
        ...workspace.rules.filter(item => ids.ruleIds.includes(item.id))
      ]
      const unassigned = domainBranch(workspace, 'unassigned', 'Unassigned', [
        ...workspace.capabilities.filter(item => !item.domainId),
        ...workspace.journeys.filter(item => !item.domainIds.length),
        ...workspace.rules.filter(item => !item.domainIds.length)
      ])
      return productRoot(workspace, [
        ...workspace.domains.map(domain => domainBranch(workspace, domain.key, domain.title, membersOf(domain), domain)),
        ...(unassigned.children.length ? [unassigned] : [])
      ])
    }
    /* A reach tree folds as the Rows tree does: its subjects, and what each reaches, sit under their Variations. */
    case 'capability':
      return productRoot(workspace, foldBranches(workspace, '', workspace.capabilities.map(item => branch(item, reachOf(workspace, item)))))
    case 'journey':
      return productRoot(workspace, foldBranches(workspace, '', workspace.journeys.map(item => branch(item, reachOf(workspace, item)))))
    case 'rule':
      return productRoot(workspace, foldBranches(workspace, '', workspace.rules.map(rule => branch(rule,
        foldBranches(workspace, rule.key, ruleReach(workspace, rule).map(target => occurrence(rule.key, target)))
      ))))
  }
}

/**
 * Qualified ownership; a counterpart never merges with another by title.
 *
 * `delivery` enriches one Interface's own tree with what each level carries —
 * the reading an Interface page gives of itself. Comparing Interfaces is a
 * different question and a different shape: see `deliveryMatrixProjection`.
 */
export function interfaceProjection(workspace: ReportWorkspace, delivery = false): TopologyBranch[] {
  type Screen = typeof workspace.screens[number]
  const childScreens = (screen: Screen): Screen[] => screen.childScreenIds.flatMap((id) => {
    const child = workspace.byKey.get(resourceKey('screen', id))
    return child?.kind === 'screen' ? [child] : []
  })
  /* A nested Screen is contained by its parent Screen; the navigation mark is a note on the node, never an edge. */
  const screenBranch = (screen: Screen, note?: string): TopologyBranch => ({ ...branch(screen, childScreens(screen).map(child => screenBranch(child))),
    references: delivery ? workspace.capabilities.filter(capability => screen.capabilityIds.includes(capability.id)) : [],
    referenceLabel: 'Exposes',
    note: [note, screen.alwaysReachable ? 'Always reachable' : undefined].filter(Boolean).join(' · ') || undefined
  })
  return workspace.interfaces.map(resource => {
    const experiences = workspace.experiences.filter(experience => experience.interfaceIds.includes(resource.id))
    const children = [
      ...experiences.map(experience => {
        const screens = workspace.screens.filter(screen => screen.contexts.some(context => context.interfaceId === resource.id && context.experienceId === experience.id))
        return { ...branch(experience, screens.filter(screen => !screen.parentScreenId).map(screen => screenBranch(screen))),
          references: delivery ? workspace.capabilities.filter(capability => capability.contexts.some(context => context.experienceId === experience.id) && !screens.some(screen => screen.capabilityIds.includes(capability.id))) : [],
          referenceLabel: 'Delivers' }
      }),
      ...workspace.screens.filter(screen => !screen.parentScreenId && screen.contexts.some(context => context.interfaceId === resource.id && !context.experienceId)).map(screen => screenBranch(screen, experiences.length ? 'Shared Screen' : undefined)),
      ...(delivery ? workspace.capabilities.filter(capability =>
        capability.contexts.some(context => context.interfaceId === resource.id && !context.experienceId) && !workspace.screens.some(screen => screen.contexts.some(context => context.interfaceId === resource.id) && screen.capabilityIds.includes(capability.id))).map(capability => ({ ...branch(capability), note: 'Delivered directly' })) : [])
    ]
    return { ...branch(resource, children),
      references: delivery ? workspace.actingEntities.filter(actor => resource.actorIds.includes(actor.id)) : [],
      referenceLabel: 'Entered by', note: !children.length ? 'No contained resources are modeled.' : undefined
    }
  })
}

/**
 * The delivery map: containment, with each place carrying the Capabilities it
 * delivers as leaves — a Screen its own `capabilities`, never a child's; an
 * Experience or Interface only what is available there yet on no Screen
 * inside it, which is a gap, or, for an Interface with no Screens, delivered
 * directly. A Capability is an occurrence, so one exposed on five Screens is a
 * leaf under each, holding its own Scenarios placed there. The Journeys
 * passing through a place follow, each holding its Scenarios with a Step
 * placed there, once each.
 * Rooted at the Product, like the reach trees.
 */
export function deliveryMapProjection(workspace: ReportWorkspace): TopologyBranch {
  /* What happens at a place — the same reading as its tree branch. Where a
     Capability sits says it is on no Screen, so no note repeats it. */
  const leaves = (item: TopologyBranch): TopologyBranch[] => {
    const place = item.resource
    if (!isPlace(place)) return []
    return [
      ...placeDelivery(workspace, place).map(({ capability, scenarios }) => {
        const id = `${item.id}${OCCURRENCE_SEPARATOR}${capability.key}`
        return occurrence(item.id, capability, foldBranches(workspace, id, scenarios.map(scenario => occurrence(id, scenario)), place))
      }),
      ...placeJourneys(workspace, place).map(({ journey, scenarios }) => {
        const id = `${item.id}${OCCURRENCE_SEPARATOR}${journey.key}`
        return occurrence(item.id, journey, foldBranches(workspace, id, scenarios.map(({ scenario }) => occurrence(id, scenario)), place))
      })
    ]
  }
  /* Every level folds as the Interfaces tree does, from the Interfaces at the root to the Scenarios at a place. */
  const withLeaves = (item: TopologyBranch): TopologyBranch => ({
    ...item, references: [], referenceLabel: undefined,
    children: foldBranches(workspace, item.id, [...leaves(item), ...item.children.filter(child => child.resource?.kind !== 'capability').map(withLeaves)], isPlace(item.resource) ? item.resource : undefined)
  })
  const trees = interfaceProjection(workspace, true).map(item => withLeaves({ ...item, references: [] }))
  return productRoot(workspace, foldBranches(workspace, '', trees))
}

/**
 * Which Interface delivers each Capability, and by what route.
 *
 * Delivery is a question about two collections at once — where can I reach this,
 * and what does this one carry — so it is a matrix, like the model's other two
 * cross-collection readings. Columns of independent lists staged the comparison
 * and left the reader to diff them by eye, which is not the same as answering
 * it: a row with two marks is delivered twice, a row with one is exclusive to
 * that Interface, and neither fact survives being spread across three columns.
 *
 * The routes are the ones the outline drew: a Screen of that Interface that
 * exposes it, an Experience of that Interface whose Context it names, or the
 * Interface itself where a Context names no Experience and no Screen carries it.
 */
export function deliveryMatrixProjection(workspace: ReportWorkspace): TopologyMatrix {
  const cells: TopologyMatrixCell[] = []
  for (const capability of workspace.capabilities) {
    for (const resource of workspace.interfaces) {
      const screens = workspace.screens.filter(screen => screen.capabilityIds.includes(capability.id)
        && screen.contexts.some(context => context.interfaceId === resource.id))
      const experiences = workspace.experiences.filter(experience => experience.interfaceIds.includes(resource.id)
        && capability.contexts.some(context => context.experienceId === experience.id)
        && !screens.some(screen => screen.contexts.some(context => context.experienceId === experience.id)))
      const direct = !screens.length
        && capability.contexts.some(context => context.interfaceId === resource.id && !context.experienceId)
      if (!screens.length && !experiences.length && !direct) continue
      /* Delivered only under some alternatives when some choice leaves no route: the row's and column's own Variations are said by their headers. */
      const known = new Set([capability.variation?.key, resource.variation?.key].filter((key): key is string => Boolean(key)))
      const condition = variationCondition(workspace, [...experiences, ...screens, ...(direct ? [resource] : [])], known)
      cells.push({
        ...(condition.conditional ? { condition: variationConditionNote([condition]) } : {}),
        id: `${capability.key}->${resource.key}`,
        row: capability.key,
        column: resource.key,
        labels: [
          ...(direct ? ['direct'] : []),
          ...(experiences.length ? ['in experience'] : []),
          ...(screens.length ? ['on screen'] : [])
        ],
        evidence: [...experiences, ...screens],
        details: []
      })
    }
  }
  return {
    rows: adjacentAlternatives(workspace.capabilities),
    columns: adjacentAlternatives(workspace.interfaces),
    cells
  }
}

export interface TopologyMutation {
  effect: 'creates' | 'changes' | 'removes'
  /** Each change, with "Only under …" where some choice of alternatives leaves no Scenario making it. */
  variants: Array<{ from: string, to: string, evidence: ScenarioView[], condition?: string }>
}

export interface TopologyMatrixCell {
  id: string
  row: string
  column: string
  labels: string[]
  attachments?: TopologyAttachment[]
  mutations?: TopologyMutation[]
  evidence: AnyResourceView[]
  details: string[]
  /** "Only under …": the cell holds only under some alternatives beyond its own row's and column's. */
  condition?: string
}
export interface TopologyMatrix {
  rows: AnyResourceView[]
  columns: AnyResourceView[]
  cells: TopologyMatrixCell[]
}

export function ruleAttachmentsProjection(workspace: ReportWorkspace): TopologyMatrix {
  const columns = new Map<string, AnyResourceView>()
  const cells: TopologyMatrixCell[] = []
  for (const rule of workspace.rules) {
    const byTarget = new Map<string, TopologyAttachment[]>()
    for (const attachment of ruleAttachments(workspace, rule)) {
      columns.set(attachment.resource.key, attachment.resource)
      byTarget.set(attachment.resource.key, [...(byTarget.get(attachment.resource.key) ?? []), attachment])
    }
    for (const [key, attachments] of byTarget) cells.push({
      id: `${rule.key}->${key}`, row: rule.key, column: key, labels: [...new Set(attachments.map(item => item.label))], attachments, evidence: [], details: []
    })
  }
  const kinds = Object.keys(ENTITY_KIND_META)
  return { rows: adjacentAlternatives(workspace.rules), columns: adjacentAlternatives([...columns.values()].sort((a, b) => kinds.indexOf(a.kind) - kinds.indexOf(b.kind))), cells }
}

export function mutationProjection(workspace: ReportWorkspace): TopologyMatrix {
  const cells = workspace.capabilities.flatMap(capability => capability.entityEffects.flatMap(line => {
    const entity = workspace.byKey.get(resourceKey('entity', line.entityId))
    if (!entity) return []
    // Journey Steps can name different Capabilities. Match the whole occurrence,
    // not just a Scenario that happens to mention this Entity somewhere.
    const occurrences = workspace.scenarios.map(scenario => ({ scenario, effects: scenario.steps
      .filter(step => (scenario.scenarioType === 'capability' ? scenario.capabilityId : step.capabilityId) === capability.id)
      .flatMap(step => step.entities.filter(item => item.entityId === line.entityId && item.effect !== 'reads'))
    })).filter(item => item.effects.length)
    /* A change only some alternatives make says under which; the row's and column's own Variations are said by their headers. */
    const known = new Set([entity.variation?.key, capability.variation?.key].filter((key): key is string => Boolean(key)))
    const conditionOf = (evidence: ScenarioView[]) => variationCondition(workspace, evidence, known)
    const mutations: TopologyMutation[] = [...new Set(line.effects.map(item => item.effect))].map(effect => ({
      effect,
      variants: line.effects.filter(item => item.effect === effect).map(item => {
        const evidence = occurrences.filter(({ effects }) => effects.some(candidate =>
          candidate.effect === effect && candidate.from === item.from && candidate.to === item.to
        )).map(({ scenario }) => scenario)
        const condition = conditionOf(evidence)
        return { from: item.from, to: item.to, evidence, ...(condition.conditional ? { condition: variationConditionNote([condition]) } : {}) }
      })
    }))
    const condition = conditionOf(occurrences.map(({ scenario }) => scenario))
    return [{ id: `${entity.key}->${capability.key}`, row: entity.key, column: capability.key,
      ...(condition.conditional ? { condition: variationConditionNote([condition]) } : {}),
      labels: mutations.map(item => item.effect), mutations,
      evidence: occurrences.map(({ scenario }) => scenario), details: []
    }]
  }))
  return { rows: adjacentAlternatives(workspace.entities),
    columns: adjacentAlternatives(workspace.capabilities), cells }
}

export function entityRelationsProjection(workspace: ReportWorkspace): Diagram {
  const notation = { 'one-to-one': '1:1', 'one-to-many': '1:N', 'many-to-many': 'M:N' }
  /* Every line here is an authored relation, so a Variation is a frame around
     its alternatives, never a node with lines of its own. Relations keep their
     concrete ends. */
  const frames = workspace.variations.filter(set => set.memberKind === 'entity' && set.alternatives.filter(item => workspace.byKey.has(item.key)).length > 1)
  const frameOf = new Map(frames.flatMap(set => set.alternatives.map(item => [item.key, set.key] as const)))
  return {
    nodes: [
      ...frames.map(set => ({ id: set.key, resourceKey: set.key, title: set.title, group: true })),
      ...workspace.entities.map(entity => ({ id: entity.key, resourceKey: entity.key, title: entity.title,
        colorSlot: workspace.domains.find(domain => domain.id === entity.domainId)?.colorSlot,
        ...(frameOf.has(entity.key) ? { parent: frameOf.get(entity.key)! } : {}) }))
    ],
    edges: workspace.entities.flatMap(entity => entity.relations.flatMap((relation, index) => {
      const target = resourceKey('entity', relation.entityId)
      return workspace.byKey.has(target) ? [{ id: `${entity.key}:relation:${index}`, source: entity.key, target, label: `${relation.verb} ${notation[relation.ends]}` }] : []
    }))
  }
}

/** Filtering precedes placement. Ancestor headings remain as structural context. */
export function filterBranches(branches: TopologyBranch[], visible: (resource: AnyResourceView) => boolean): TopologyBranch[] {
  return branches.flatMap(item => {
    const children = filterBranches(item.children, visible)
    if (item.resource && !visible(item.resource) && !children.length) return []
    if (!item.resource && item.children.length && !children.length) return []
    if (item.resource?.kind === 'variation' && !children.some(child => !child.absentFrom)) return []
    return [{ ...item, children, references: item.references.filter(visible) }]
  })
}
