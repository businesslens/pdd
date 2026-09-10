/** Named semantic readings. No coordinates, hover state, or renderer types. */
import type { AnyResourceView, ContextView, ReportWorkspace } from './reportWorkspace'
import { ENTITY_KIND_META, resourceKey } from './reportWorkspace'
import { ruleAttachments } from './topologyTargets'
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

export function productMapProjection(workspace: ReportWorkspace) {
  const group = (id: string, title: string, domainId?: string, resource?: AnyResourceView): TopologyBranch => {
    const capabilities = workspace.capabilities.filter(item => item.domainId === domainId).map(item => branch(item))
    const entities = workspace.entities.filter(item => item.domainId === domainId).map(item => branch(item))
    return { id, title, resource, references: [], children: [
      ...(capabilities.length ? [{ id: `${id}:capabilities`, title: 'Capabilities', references: [], children: capabilities }] : []),
      ...(entities.length ? [{ id: `${id}:entities`, title: 'Entities', references: [], children: entities }] : [])
    ] }
  }
  const unassigned = group('unassigned', 'Unassigned')
  return { groups: [
    ...workspace.domains.map(domain => ({ ...group(domain.key, domain.title, domain.id, domain), colorSlot: domain.colorSlot })),
    ...(unassigned.children.length ? [unassigned] : [])
  ] }
}

/** Qualified ownership; a counterpart never merges with another by title. */
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

/** A Product-rooted containment tree, with no synthetic Experience level. */
export function sitemapProjection(workspace: ReportWorkspace): TopologyBranch {
  // Product identity belongs to the report itself, outside the resource index.
  return { id: resourceKey('product', workspace.identity.id), title: workspace.identity.title,
    children: interfaceProjection(workspace), references: [] }
}

/**
 * Every Journey's Scenarios as columns.
 *
 * Composition compares Journeys, and one Journey's page cannot answer a question
 * about how Journeys compare — so the collection owns the reading and the
 * projection covers the whole model rather than a chosen subject.
 */
export function journeyCompositionProjection(workspace: ReportWorkspace) {
  return workspace.journeys.map(journey => compositionProjection(workspace, journey.id))
}

export function compositionProjection(workspace: ReportWorkspace, journeyId?: string | null) {
  const journey = workspace.journeys.find(item => item.id === journeyId) ?? workspace.journeys[0]
  return { journey, scenarios: journey ? (workspace.scenariosByJourney.get(journey.id) ?? []).map(scenario => ({
    resource: scenario,
    steps: scenario.steps.flatMap((step, index) => {
      const capability = step.capabilityId ? workspace.byKey.get(resourceKey('capability', step.capabilityId)) : undefined
      return capability ? [{ id: `${scenario.key}:step:${index}`, number: index + 1, resource: capability, text: step.text,
        contexts: step.contexts.map(context => ({ ...context,
          routeName: scenario.routes.find(route => route.id === context.routeId)?.name ?? context.routeId,
          resource: workspace.byKey.get(resourceKey(context.context.kind, context.context.id))
        }))
      }] : []
    })
  })) : [] }
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

export function ruleReachProjection(workspace: ReportWorkspace): TopologyMatrix {
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
    return [{ id: `${capability.key}->${entity.key}`, row: capability.key, column: entity.key,
      labels: [...new Set(line.effects.map(effect => effect.effect))],
      evidence: line.scenarioIds.flatMap(id => workspace.scenarios.filter(scenario => scenario.id === id && scenario.steps.some(step =>
        (scenario.scenarioType === 'capability' ? scenario.capabilityId : step.capabilityId) === capability.id &&
        step.entities.some(entity => entity.entityId === line.entityId && entity.effect !== 'reads')))),
      details: line.effects.filter(effect => effect.from || effect.to).map(effect => `${effect.effect}${effect.from ? ` from ${effect.from}` : ''}${effect.to ? ` to ${effect.to}` : ''}`)
    }]
  }))
  return { rows: workspace.capabilities.filter(item => cells.some(cell => cell.row === item.key)),
    columns: workspace.entities.filter(item => cells.some(cell => cell.column === item.key)), cells }
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
