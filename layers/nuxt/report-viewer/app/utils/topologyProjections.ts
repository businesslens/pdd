/** Named semantic readings. No coordinates, hover state, or renderer types. */
import type { AnyResourceView, ContextView, DomainView, ReportWorkspace, RuleView } from './reportWorkspace'
import { ENTITY_KIND_META, resourceKey } from './reportWorkspace'
import { ruleAttachments, topologyPlace } from './topologyTargets'
import type { TopologyAttachment } from './topologyTargets'
import type { Diagram } from './diagram'

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

/** Places first, then Rules, both as occurrences under the subject. */
function reachOf(workspace: ReportWorkspace, subject: AnyResourceView & { contexts: ContextView[], ruleIds: string[] }): TopologyBranch[] {
  return [
    ...placesOf(workspace, subject.contexts).map(place => occurrence(subject.key, place)),
    ...subject.ruleIds.flatMap((id) => { const rule = workspace.byKey.get(resourceKey('rule', id)); return rule ? [occurrence(subject.key, rule)] : [] })
  ]
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
  return { id, title, resource, references: [], colorSlot: resource?.colorSlot, children: [
    ...[...places.values()].map(({ place, members }) => occurrence(id, place, members.map(member => occurrence(`${id}${OCCURRENCE_SEPARATOR}${place.key}`, member)))),
    ...direct.map(member => occurrence(id, member))
  ] }
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
    case 'capability':
      return productRoot(workspace, workspace.capabilities.map(item => branch(item, reachOf(workspace, item))))
    case 'journey':
      return productRoot(workspace, workspace.journeys.map(item => branch(item, reachOf(workspace, item))))
    case 'rule':
      return productRoot(workspace, workspace.rules.map(rule => branch(rule,
        ruleReach(workspace, rule).map(target => occurrence(rule.key, target))
      )))
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
  return workspace.interfaces.map(resource => {
    const screenBranch = (screen: typeof workspace.screens[number]) => ({ ...branch(screen),
      references: delivery ? workspace.capabilities.filter(capability => screen.capabilityIds.includes(capability.id)) : [],
      referenceLabel: 'Exposes'
    })
    const experiences = workspace.experiences.filter(experience => experience.interfaceIds.includes(resource.id))
    const children = [
      ...experiences.map(experience => {
        const screens = workspace.screens.filter(screen => screen.contexts.some(context => context.interfaceId === resource.id && context.experienceId === experience.id))
        return { ...branch(experience, screens.map(screenBranch)),
          references: delivery ? workspace.capabilities.filter(capability => capability.contexts.some(context => context.experienceId === experience.id) && !screens.some(screen => screen.capabilityIds.includes(capability.id))) : [],
          referenceLabel: 'Delivers' }
      }),
      ...workspace.screens.filter(screen => screen.contexts.some(context => context.interfaceId === resource.id && !context.experienceId)).map(screen => ({ ...screenBranch(screen), note: experiences.length ? 'Shared Screen' : undefined })),
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
      cells.push({
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
    rows: workspace.capabilities.filter(item => cells.some(cell => cell.row === item.key)),
    columns: workspace.interfaces.filter(item => cells.some(cell => cell.column === item.key)),
    cells
  }
}

/** A Product-rooted containment tree, with no synthetic Experience level. */
export function sitemapProjection(workspace: ReportWorkspace): TopologyBranch {
  // Product identity belongs to the report itself, outside the resource index.
  return { id: resourceKey('product', workspace.identity.id), title: workspace.identity.title,
    children: interfaceProjection(workspace), references: [] }
}

export interface TopologyMatrixCell {
  id: string
  row: string
  column: string
  labels: string[]
  attachments?: TopologyAttachment[]
  evidence: AnyResourceView[]
  details: string[]
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
  return { rows: workspace.rules, columns: [...columns.values()].sort((a, b) => kinds.indexOf(a.kind) - kinds.indexOf(b.kind)), cells }
}

export function mutationProjection(workspace: ReportWorkspace): TopologyMatrix {
  const cells = workspace.capabilities.flatMap(capability => capability.entityEffects.flatMap(line => {
    const entity = workspace.byKey.get(resourceKey('entity', line.entityId))
    if (!entity) return []
    return [{ id: `${entity.key}->${capability.key}`, row: entity.key, column: capability.key,
      labels: [...new Set(line.effects.map(effect => effect.effect))],
      evidence: line.scenarioIds.flatMap(id => workspace.scenarios.filter(scenario => scenario.id === id && scenario.steps.some(step =>
        (scenario.scenarioType === 'capability' ? scenario.capabilityId : step.capabilityId) === capability.id &&
        step.entities.some(entity => entity.entityId === line.entityId && entity.effect !== 'reads')))),
      details: line.effects.filter(effect => effect.from || effect.to).map(effect => `${effect.effect}${effect.from ? ` from ${effect.from}` : ''}${effect.to ? ` to ${effect.to}` : ''}`)
    }]
  }))
  return { rows: workspace.entities.filter(item => cells.some(cell => cell.row === item.key)),
    columns: workspace.capabilities.filter(item => cells.some(cell => cell.column === item.key)), cells }
}

export function entityRelationsProjection(workspace: ReportWorkspace): Diagram {
  const notation = { 'one-to-one': '1:1', 'one-to-many': '1:N', 'many-to-many': 'M:N' }
  return {
    nodes: workspace.entities.map(entity => ({ id: entity.key, resourceKey: entity.key, title: entity.title,
      colorSlot: workspace.domains.find(domain => domain.id === entity.domainId)?.colorSlot })),
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
    return [{ ...item, children, references: item.references.filter(visible) }]
  })
}
