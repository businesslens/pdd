/** One resource’s directional reading; facts shown in other Overview blocks are omitted. */
import type {
  AnyResourceView,
  CapabilityView,
  DomainView,
  EntityView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportResourceKind,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  ScreenView
} from './reportWorkspace'
import { topologyRelations } from './topologyRelations'

export interface RelationRow {
  label: string
  kind: ReportResourceKind
  ids: string[]
  derived: boolean
  direction: 'Incoming' | 'Outgoing'
}

const incomingLabels = new Set(['Actors', 'Experiences within', 'Capabilities available', 'Screens available', 'Journeys available', 'Journeys via linked Journey Scenarios', 'Journeys via exposed Capabilities', 'Changed by', 'Read by', 'Presented on', 'Governed by', 'Journeys reached', 'Screens reached', 'Rules', 'Exercised by Journey Scenarios', 'Used by Journeys', 'Exposed by Screens', 'Constrained by Rules', 'Shown on Screens'])
const notation = { 'one-to-one': '1:1', 'one-to-many': '1:N', 'many-to-many': 'M:N' }

export function resourceConnectionRows(workspace: ReportWorkspace, resource: AnyResourceView): RelationRow[] {
  const row = (label: string, kind: ReportResourceKind, ids: string[], derived: boolean, direction?: RelationRow['direction']): RelationRow =>
    ({ label, kind, ids, derived, direction: direction ?? (resource.kind === 'domain' || (resource.kind !== 'rule' && incomingLabels.has(label)) ? 'Incoming' : 'Outgoing') })
  const all: RelationRow[] = []
  switch (resource.kind) {
    case 'interface': {
      const item = resource as InterfaceView
      all.push(
        row('Actors', 'entity', item.actorIds, false),
        row('Experiences within', 'experience', item.experienceIds, true),
        row('Capabilities available', 'capability', item.capabilityIds, true),
        row('Screens available', 'screen', item.screenIds, true),
        row('Journeys available', 'journey', item.journeyIds, true)
      )
      break
    }
    case 'experience': {
      const item = resource as ExperienceView
      all.push(
        row('Actors', 'entity', item.actorIds, false),
        row('Interfaces', 'interface', item.interfaceIds, false),
        row('Capabilities available', 'capability', item.capabilityIds, true),
        row('Screens available', 'screen', item.screenIds, true),
        row('Journeys available', 'journey', item.journeyIds, true)
      )
      break
    }
    case 'screen': {
      const screen = resource as ScreenView
      all.push(
        row('Presents', 'entity', screen.entityIds, false),
        row('Capabilities', 'capability', screen.capabilityIds, false),
        row('Capability Scenarios', 'capability-scenario', screen.capabilityScenarioIds, false),
        row('Journey Scenarios', 'journey-scenario', screen.journeyScenarioIds, false),
        row('Journeys via linked Journey Scenarios', 'journey', screen.scenarioJourneyIds, true),
        row('Journeys via exposed Capabilities', 'journey', screen.capabilityJourneyIds, true)
      )
      break
    }
    case 'entity': {
      const entity = resource as EntityView
      all.push(
        ...entity.relations.map(relation =>
          row(`${relation.verb} ${notation[relation.ends]}`, 'entity', [relation.entityId], false, 'Outgoing')),
        // The inverse is the other Entity's verb pointing back, so the arrow
        // carries the direction — "holds by" would read as this Entity holding.
        ...entity.inboundRelations.map(relation =>
          row(`${relation.verb} ${notation[relation.ends]}`, 'entity', [relation.entityId], true, 'Incoming')),
        row('Domain', 'domain', entity.domainId ? [entity.domainId] : [], false),
        row('Changed by', 'capability', entity.changedByIds, true),
        row('Read by', 'capability', entity.readByIds, true),
        row('Presented on', 'screen', entity.presentedOnIds, true),
        row('Governed by', 'rule', entity.ruleIds, true),
        /* Where it acts — empty rows are dropped, so a thing that does not act
           shows none of these. */
        row('Interfaces entered', 'interface', entity.interfaceIds, true),
        row('Experiences entered', 'experience', entity.experienceIds, true),
        row('Journeys performed', 'journey', entity.journeyIds, true)
      )
      break
    }
    case 'domain': {
      const domain = resource as DomainView
      all.push(
        row('Capabilities', 'capability', domain.capabilityIds, true),
        row('Entities', 'entity', domain.entityIds, true),
        row('Journeys reached', 'journey', domain.journeyIds, true),
        row('Screens reached', 'screen', domain.screenIds, true),
        row('Rules', 'rule', domain.ruleIds, true)
      )
      break
    }
    case 'capability': {
      const capability = resource as CapabilityView
      all.push(
        row('Changes', 'entity', capability.entityIds, false),
        row('Domain', 'domain', capability.domainId ? [capability.domainId] : [], false),
        row('Capability Scenarios', 'capability-scenario', capability.scenarioIds, true),
        row('Exercised by Journey Scenarios', 'journey-scenario', capability.journeyScenarioIds, true),
        row('Used by Journeys', 'journey', capability.journeyIds, true),
        row('Exposed by Screens', 'screen', capability.screenIds, true),
        row('Constrained by Rules', 'rule', capability.ruleIds, true)
      )
      break
    }
    case 'journey': {
      const journey = resource as JourneyView
      all.push(
        row('Actors', 'entity', journey.actorIds, false),
        row('Primary Capabilities', 'capability', journey.capabilityIds, true),
        row('Failure-only Capabilities', 'capability', journey.failureOnlyCapabilityIds, true),
        row('Domains', 'domain', journey.domainIds, true),
        row('Changes', 'entity', journey.entityIds, true),
        row('Scenarios', 'journey-scenario', journey.scenarioIds, true),
        row('Screens', 'screen', journey.screenIds, true),
        row('Constrained by Rules', 'rule', journey.ruleIds, true)
      )
      break
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      const scenario = resource as ScenarioView
      all.push(
        row('Actors', 'entity', scenario.actorIds, false),
        // Derived from the Steps, exactly as the Actor set is.
        row('Changes', 'entity', scenario.entityIds, true),
        scenario.scenarioType === 'capability'
          ? row('Capability', 'capability', [scenario.capabilityId], false)
          : row('Journey', 'journey', [scenario.journeyId], false),
        row('Shown on Screens', 'screen', scenario.screenIds, true),
        row('Constrained by Rules', 'rule', scenario.ruleIds, true)
      )
      break
    }
    case 'rule': {
      const rule = resource as RuleView
      const reachedCapabilities = new Set([...rule.capabilityIds, ...rule.derivedCapabilityIds])
      const reachedJourneys = new Set([...rule.journeyIds, ...rule.derivedJourneyIds])
      const derivedScreens = workspace.screens
        .filter(screen => screen.capabilityIds.some(id => reachedCapabilities.has(id))
          || screen.scenarioIds.some(id => rule.scenarioIds.includes(id))
          || screen.journeyIds.some(id => reachedJourneys.has(id)))
        .map(screen => screen.id)
      all.push(
        row('Capabilities', 'capability', rule.capabilityIds, false),
        row('Journeys', 'journey', rule.journeyIds, false),
        row('Capability Scenarios', 'capability-scenario', rule.capabilityScenarioIds, false),
        row('Journey Scenarios', 'journey-scenario', rule.journeyScenarioIds, false),
        row('Domains through targets', 'domain', rule.domainIds, true),
        row('Parent Capabilities', 'capability', rule.derivedCapabilityIds, true),
        row('Parent Journeys', 'journey', rule.derivedJourneyIds, true),
        row('Screens reached', 'screen', derivedScreens, true)
      )
      break
    }
  }
  // The precise incoming/outgoing reading also includes connections not in the
  // older type summaries, such as direct Rule attachments to a Context place.
  const additional = new Map<string, RelationRow>()
  for (const relation of topologyRelations(workspace)) {
    if (relation.source !== resource.key && relation.target !== resource.key) continue
    const direction = relation.source === resource.key ? 'Outgoing' : 'Incoming'
    const other = workspace.byKey.get(direction === 'Outgoing' ? relation.target : relation.source)!
    if (all.some(item => item.kind === other.kind && item.ids.includes(other.id))) continue
    const key = JSON.stringify([direction, other.kind, relation.label])
    const existing = additional.get(key)
    if (existing) { if (!existing.ids.includes(other.id)) existing.ids.push(other.id) }
    else additional.set(key, { label: relation.label, kind: other.kind, ids: [other.id], derived: relation.label === 'available in', direction })
  }
  all.push(...additional.values())
  return all.filter(item => item.ids.length
    && !(resource.kind === 'interface' && ['Actors', 'Experiences within', 'Screens available', 'Capabilities available'].includes(item.label))
    && !(resource.kind === 'experience' && item.kind === 'screen')
    && !(resource.kind === 'capability' && item.label === 'Changes')
    && !(resource.kind === 'rule' && !item.derived && item.direction === 'Outgoing')
    && item.label !== 'Domain')
}
