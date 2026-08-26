import type {
  ActorView,
  AnyElementView,
  CapabilityView,
  DomainView,
  ObjectView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportElementKind,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  ScreenView
} from './reportWorkspace'
import { resolveElement } from './reportWorkspace'

/*
  One row shape, not three.

  A card-style switcher put a design audition in the reading chrome: a row on
  every surface, on every visit, asking the reader to choose a density before
  they could read anything. Auditions belong in the theme lab. What survives is
  the dense row, because scanning is what a collection surface is for.
*/

export interface ElementCardMetric {
  label: string
  value: number
  kind?: ReportElementKind
  ids?: string[]
}

export interface ElementCardPresentation {
  badge: string
  metrics: ElementCardMetric[]
  hookLabel: string
  hook: string
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`): string {
  return count === 1 ? singular : pluralLabel
}

function titles(workspace: ReportWorkspace, kind: ReportElementKind, ids: string[], max = 2): string {
  const names = ids
    .map(id => resolveElement(workspace, kind, id)?.title)
    .filter((title): title is string => Boolean(title))
  const shown = names.slice(0, max)
  const remaining = names.length - shown.length
  return `${shown.join(' · ')}${remaining > 0 ? ` +${remaining}` : ''}`
}

function relationTitles(
  workspace: ReportWorkspace,
  relations: Array<[ReportElementKind, string[]]>,
  max = 2
): string {
  const names = relations.flatMap(([kind, ids]) => ids
    .map(id => resolveElement(workspace, kind, id)?.title)
    .filter((title): title is string => Boolean(title)))
  const shown = names.slice(0, max)
  const remaining = names.length - shown.length
  return `${shown.join(' · ')}${remaining > 0 ? ` +${remaining}` : ''}`
}

function contextTitles(element: { contexts: Array<{ interfaceTitle: string, experienceTitle: string, screenTitle?: string }> }, max = 2): string {
  const names = element.contexts.map(context =>
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

export function elementCardPresentation(
  workspace: ReportWorkspace,
  element: AnyElementView
): ElementCardPresentation {
  switch (element.kind) {
    case 'actor': {
      const actor = element as ActorView
      const accessIds = [...actor.interfaceIds, ...actor.experienceIds]
      return {
        /* Actor carries two independent authored axes and one glyph can only
           draw one. The silhouette takes `kind`; the Product boundary takes the
           title badge, where it sits on the reading line instead of stacking
           under the mark and setting the width of the gutter it sat in. */
        badge: actor.relationship,
        metrics: [
          { label: plural(actor.interfaceIds.length, 'interface'), value: actor.interfaceIds.length, kind: 'interface', ids: actor.interfaceIds },
          { label: plural(actor.experienceIds.length, 'experience'), value: actor.experienceIds.length, kind: 'experience', ids: actor.experienceIds },
          { label: plural(actor.journeyIds.length, 'journey'), value: actor.journeyIds.length, kind: 'journey', ids: actor.journeyIds }
        ],
        hookLabel: accessIds.length ? 'Enters' : 'Performs',
        hook: accessIds.length
          ? relationTitles(workspace, [['interface', actor.interfaceIds], ['experience', actor.experienceIds]])
          : titles(workspace, 'journey', actor.journeyIds)
      }
    }
    case 'interface': {
      const item = element as InterfaceView
      const metrics = item.experienceIds.length
        ? [
            { label: plural(item.actorIds.length, 'actor'), value: item.actorIds.length, kind: 'actor' as const, ids: item.actorIds },
            { label: plural(item.experienceIds.length, 'experience'), value: item.experienceIds.length, kind: 'experience' as const, ids: item.experienceIds },
            { label: plural(item.capabilityIds.length, 'capability', 'capabilities'), value: item.capabilityIds.length, kind: 'capability' as const, ids: item.capabilityIds }
          ]
        : [
            { label: plural(item.actorIds.length, 'actor'), value: item.actorIds.length, kind: 'actor' as const, ids: item.actorIds },
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
      const item = element as ExperienceView
      return {
        badge: item.accessMode,
        metrics: [
          { label: plural(item.actorIds.length, 'actor'), value: item.actorIds.length, kind: 'actor', ids: item.actorIds },
          { label: plural(item.screenIds.length, 'screen'), value: item.screenIds.length, kind: 'screen', ids: item.screenIds },
          { label: 'entry points', value: item.entryPoints.length }
        ],
        hookLabel: 'Within',
        hook: titles(workspace, 'interface', item.interfaceIds)
      }
    }
    case 'screen': {
      const screen = element as ScreenView
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
      const domain = element as DomainView
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
    case 'object': {
      const object = element as ObjectView
      // An Object's reading is its lifecycle: how many states it can be in and
      // how many ways it moves between them. Its Capabilities are derived
      // through the Domain they share, so they rank below both.
      return {
        badge: object.domainId
          ? resolveElement(workspace, 'domain', object.domainId)?.title ?? object.domainId
          : '',
        metrics: [
          { label: plural(object.states.length, 'state'), value: object.states.length },
          { label: plural(object.transitions.length, 'transition'), value: object.transitions.length }
        ],
        hookLabel: 'States',
        hook: object.states.map(state => state.name).join(' → ')
      }
    }
    case 'capability': {
      const capability = element as CapabilityView
      const domain = capability.domainId
        ? resolveElement(workspace, 'domain', capability.domainId)?.title ?? capability.domainId
        : ''
      return {
        badge: domain,
        metrics: [
          { label: plural(capability.scenarioIds.length, 'scenario'), value: capability.scenarioIds.length, kind: 'capability-scenario', ids: capability.scenarioIds },
          { label: plural(capability.journeyIds.length, 'journey'), value: capability.journeyIds.length, kind: 'journey', ids: capability.journeyIds },
          { label: plural(capability.screenIds.length, 'screen'), value: capability.screenIds.length, kind: 'screen', ids: capability.screenIds }
        ],
        hookLabel: capability.journeyIds.length ? 'Used by' : 'Available in',
        hook: capability.journeyIds.length
          ? titles(workspace, 'journey', capability.journeyIds)
          : contextTitles(capability)
      }
    }
    case 'journey': {
      const journey = element as JourneyView
      return {
        badge: '',
        metrics: [
          { label: plural(journey.actorIds.length, 'actor'), value: journey.actorIds.length, kind: 'actor', ids: journey.actorIds },
          { label: plural(journey.scenarioIds.length, 'scenario'), value: journey.scenarioIds.length, kind: 'journey-scenario', ids: journey.scenarioIds },
          { label: plural(journey.stepCount, 'step'), value: journey.stepCount }
        ],
        hookLabel: journey.actorIds.length ? 'Performed by' : 'Scenarios',
        hook: journey.actorIds.length
          ? titles(workspace, 'actor', journey.actorIds)
          : titles(workspace, 'journey-scenario', journey.scenarioIds)
      }
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      const scenario = element as ScenarioView
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
      const rule = element as RuleView
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
