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
import { resolveResource } from './reportWorkspace'

/*
  One row shape, not three.

  A card-style switcher put a design audition in the reading chrome: a row on
  every surface, on every visit, asking the reader to choose a density before
  they could read anything. Auditions belong in the theme lab. What survives is
  the dense row, because scanning is what a collection surface is for.
*/

export interface ResourceCardMetric {
  label: string
  value: number
  kind?: ReportResourceKind
  ids?: string[]
}

export interface ResourceCardPresentation {
  badge: string
  metrics: ResourceCardMetric[]
  hookLabel: string
  hook: string
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`): string {
  return count === 1 ? singular : pluralLabel
}

function titles(workspace: ReportWorkspace, kind: ReportResourceKind, ids: string[], max = 2): string {
  const names = ids
    .map(id => resolveResource(workspace, kind, id)?.title)
    .filter((title): title is string => Boolean(title))
  const shown = names.slice(0, max)
  const remaining = names.length - shown.length
  return `${shown.join(' · ')}${remaining > 0 ? ` +${remaining}` : ''}`
}

function relationTitles(
  workspace: ReportWorkspace,
  relations: Array<[ReportResourceKind, string[]]>,
  max = 2
): string {
  const names = relations.flatMap(([kind, ids]) => ids
    .map(id => resolveResource(workspace, kind, id)?.title)
    .filter((title): title is string => Boolean(title)))
  const shown = names.slice(0, max)
  const remaining = names.length - shown.length
  return `${shown.join(' · ')}${remaining > 0 ? ` +${remaining}` : ''}`
}

function contextTitles(resource: { contexts: Array<{ interfaceTitle: string, experienceTitle: string, screenTitle?: string }> }, max = 2): string {
  const names = resource.contexts.map(context =>
    [context.interfaceTitle, context.experienceTitle, context.screenTitle].filter(Boolean).join(' › '))
  const shown = names.slice(0, max)
  const remaining = names.length - shown.length
  return `${shown.join(' · ')}${remaining > 0 ? ` +${remaining}` : ''}`
}

function ruleBindingCount(rule: RuleView): number {
  return rule.appliesTo.length
}

function ruleReachCount(workspace: ReportWorkspace, rule: RuleView): number {
  const capabilities = new Set([
    ...rule.capabilityIds,
    ...rule.derivedCapabilityIds
  ])
  const journeys = new Set([
    ...rule.journeyIds,
    ...rule.derivedJourneyIds
  ])
  const screens = new Set(workspace.screens
    .filter(screen => screen.capabilityIds.some(id => capabilities.has(id))
      || screen.scenarioIds.some(id => rule.scenarioIds.includes(id)))
    .map(screen => screen.id))
  return capabilities.size + journeys.size + screens.size
}

export function resourceCardPresentation(
  workspace: ReportWorkspace,
  resource: AnyResourceView
): ResourceCardPresentation {
  switch (resource.kind) {
    case 'interface': {
      const item = resource as InterfaceView
      const metrics = item.experienceIds.length
        ? [
            { label: plural(item.actorIds.length, 'actor'), value: item.actorIds.length, kind: 'entity' as const, ids: item.actorIds },
            { label: plural(item.experienceIds.length, 'experience'), value: item.experienceIds.length, kind: 'experience' as const, ids: item.experienceIds },
            { label: plural(item.capabilityIds.length, 'capability', 'capabilities'), value: item.capabilityIds.length, kind: 'capability' as const, ids: item.capabilityIds }
          ]
        : [
            { label: plural(item.actorIds.length, 'actor'), value: item.actorIds.length, kind: 'entity' as const, ids: item.actorIds },
            { label: plural(item.capabilityIds.length, 'capability', 'capabilities'), value: item.capabilityIds.length, kind: 'capability' as const, ids: item.capabilityIds },
            { label: plural(item.journeyIds.length, 'journey'), value: item.journeyIds.length, kind: 'journey' as const, ids: item.journeyIds }
          ]
      return {
        /* The concrete Interface marker already carries its authored type as a
           sub-icon. Repeating it as a title badge adds no second fact. */
        badge: '',
        metrics,
        hookLabel: item.experienceIds.length ? 'Contains' : 'Delivers directly',
        hook: item.experienceIds.length
          ? titles(workspace, 'experience', item.experienceIds)
          : titles(workspace, 'capability', item.capabilityIds)
      }
    }
    case 'experience': {
      const item = resource as ExperienceView
      return {
        badge: item.accessMode,
        metrics: [
          { label: plural(item.actorIds.length, 'actor'), value: item.actorIds.length, kind: 'entity', ids: item.actorIds },
          { label: plural(item.screenIds.length, 'screen'), value: item.screenIds.length, kind: 'screen', ids: item.screenIds },
          { label: 'entry points', value: item.entryPoints.length }
        ],
        hookLabel: 'Within',
        hook: titles(workspace, 'interface', item.interfaceIds)
      }
    }
    case 'screen': {
      const screen = resource as ScreenView
      return {
        /* No badge: "1 context" is true of almost every Screen and says nothing
           about which one. The hook names the context, which is what tells two
           counterparts apart. */
        badge: '',
        metrics: [
          { label: plural(screen.capabilityIds.length, 'capability', 'capabilities'), value: screen.capabilityIds.length, kind: 'capability', ids: screen.capabilityIds },
          { label: 'cap. scenarios', value: screen.capabilityScenarioIds.length, kind: 'capability-scenario', ids: screen.capabilityScenarioIds },
          { label: 'journey scenarios', value: screen.journeyScenarioIds.length, kind: 'journey-scenario', ids: screen.journeyScenarioIds }
        ],
        hookLabel: 'Available in',
        hook: contextTitles(screen)
      }
    }
    case 'domain': {
      const domain = resource as DomainView
      return {
        badge: '',
        metrics: [
          { label: plural(domain.capabilityIds.length, 'capability', 'capabilities'), value: domain.capabilityIds.length, kind: 'capability', ids: domain.capabilityIds },
          { label: plural(domain.journeyIds.length, 'journey'), value: domain.journeyIds.length, kind: 'journey', ids: domain.journeyIds },
          { label: plural(domain.ruleIds.length, 'rule'), value: domain.ruleIds.length, kind: 'rule', ids: domain.ruleIds }
        ],
        hookLabel: 'Includes',
        hook: titles(workspace, 'capability', domain.capabilityIds)
      }
    }
    case 'entity': {
      const entity = resource as EntityView
      if (entity.acts) {
        const accessIds = [...entity.interfaceIds, ...entity.experienceIds]
        /* An Entity that acts carries two independent authored axes and one
           glyph can only draw one. The silhouette takes `kind`; the Product
           boundary takes the title badge, where it sits on the reading line
           instead of stacking under the mark. */
        return {
          badge: entity.acts,
          metrics: [
            { label: plural(entity.interfaceIds.length, 'interface'), value: entity.interfaceIds.length, kind: 'interface', ids: entity.interfaceIds },
            { label: plural(entity.experienceIds.length, 'experience'), value: entity.experienceIds.length, kind: 'experience', ids: entity.experienceIds },
            { label: plural(entity.journeyIds.length, 'journey'), value: entity.journeyIds.length, kind: 'journey', ids: entity.journeyIds }
          ],
          hookLabel: accessIds.length ? 'Enters' : entity.journeyIds.length ? 'Performs' : 'Keeps',
          hook: accessIds.length
            ? relationTitles(workspace, [['interface', entity.interfaceIds], ['experience', entity.experienceIds]])
            : entity.journeyIds.length
              ? titles(workspace, 'journey', entity.journeyIds)
              : entity.informationKept.map(fact => fact.name).join(' · ')
        }
      }
      // A thing is read by what it can be, when it has a lifecycle, and by what
      // the Product keeps about it when it does not.
      return {
        badge: entity.domainId
          ? resolveResource(workspace, 'domain', entity.domainId)?.title ?? entity.domainId
          : '',
        metrics: [
          { label: plural(entity.informationKept.length, 'fact'), value: entity.informationKept.length },
          { label: plural(entity.states.length, 'state'), value: entity.states.length },
          { label: plural(entity.changedByIds.length, 'capability', 'capabilities'), value: entity.changedByIds.length, kind: 'capability', ids: entity.changedByIds }
        ],
        hookLabel: entity.states.length ? 'States' : 'Keeps',
        hook: entity.states.length
          ? entity.states.map(state => state.name).join(' → ')
          : entity.informationKept.map(fact => fact.name).join(' · ')
      }
    }
    case 'capability': {
      const capability = resource as CapabilityView
      const domain = capability.domainId
        ? resolveResource(workspace, 'domain', capability.domainId)?.title ?? capability.domainId
        : ''
      return {
        badge: domain,
        /* A Capability is a verb over nouns, and which nouns never appeared on
           the card at all. Its Journeys take the displaced slot because the
           hook already names them whenever there are any, and reads `0
           journeys` in exactly the case where the hook names Contexts instead. */
        metrics: [
          { label: plural(capability.scenarioIds.length, 'scenario'), value: capability.scenarioIds.length, kind: 'capability-scenario', ids: capability.scenarioIds },
          { label: plural(capability.entityIds.length, 'entity', 'entities'), value: capability.entityIds.length, kind: 'entity', ids: capability.entityIds },
          { label: plural(capability.screenIds.length, 'screen'), value: capability.screenIds.length, kind: 'screen', ids: capability.screenIds }
        ],
        hookLabel: capability.journeyIds.length ? 'Used by' : 'Available in',
        hook: capability.journeyIds.length
          ? titles(workspace, 'journey', capability.journeyIds)
          : contextTitles(capability)
      }
    }
    case 'journey': {
      const journey = resource as JourneyView
      return {
        badge: '',
        metrics: [
          { label: plural(journey.actorIds.length, 'actor'), value: journey.actorIds.length, kind: 'entity', ids: journey.actorIds },
          { label: plural(journey.scenarioIds.length, 'scenario'), value: journey.scenarioIds.length, kind: 'journey-scenario', ids: journey.scenarioIds },
          { label: plural(journey.stepCount, 'step'), value: journey.stepCount }
        ],
        hookLabel: journey.actorIds.length ? 'Performed by' : 'Scenarios',
        hook: journey.actorIds.length
          ? titles(workspace, 'entity', journey.actorIds)
          : titles(workspace, 'journey-scenario', journey.scenarioIds)
      }
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      const scenario = resource as ScenarioView
      const isCapability = scenario.scenarioType === 'capability'
      return {
        /* `result` is the Journey Scenario's terminal outcome and orthogonal to
           its kind, so both belong on the badge when both exist. */
        badge: isCapability ? scenario.kindName : `${scenario.kindName} · ${scenario.result}`,
        metrics: [
          { label: plural(scenario.steps.length, 'step'), value: scenario.steps.length },
          { label: 'decisions', value: scenario.decisionPoints.length },
          {
            label: isCapability ? 'edge cases' : 'Capability steps',
            value: isCapability ? scenario.edgeCases.length : scenario.steps.filter(step => step.capabilityId).length
          }
        ],
        hookLabel: isCapability ? 'For capability' : 'In journey',
        hook: isCapability ? scenario.capabilityTitle : scenario.journeyTitle
      }
    }
    case 'rule': {
      const rule = resource as RuleView
      return {
        badge: '',
        metrics: [
          { label: 'bindings', value: ruleBindingCount(rule) },
          { label: 'affected', value: ruleReachCount(workspace, rule) },
          { label: plural(rule.contexts.length, 'context'), value: rule.contexts.length }
        ],
        hookLabel: 'Attached to',
        hook: relationTitles(workspace, [
          ['capability', rule.capabilityIds],
          ['journey', rule.journeyIds],
          ['capability-scenario', rule.capabilityScenarioIds],
          ['journey-scenario', rule.journeyScenarioIds]
        ])
      }
    }
  }
}
