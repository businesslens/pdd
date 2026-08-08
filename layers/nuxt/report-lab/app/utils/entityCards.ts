import type {
  ActorView,
  AnyEntityView,
  CapabilityView,
  DomainView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportEntityKind,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  ScreenView
} from './reportWorkspace'

export type EntityCardVariant = 'catalog' | 'index' | 'editorial'

export interface EntityCardVariantOption {
  id: EntityCardVariant
  name: string
  icon: string
  description: string
}

export const ENTITY_CARD_VARIANTS: EntityCardVariantOption[] = [
  {
    id: 'catalog',
    name: 'Catalog',
    icon: 'i-lucide-layout-grid',
    description: 'Two-line recognition cards with three compact facts.'
  },
  {
    id: 'index',
    name: 'Index',
    icon: 'i-lucide-layout-list',
    description: 'Dense rows for scanning hundreds of entities.'
  },
  {
    id: 'editorial',
    name: 'Editorial',
    icon: 'i-lucide-layout-template',
    description: 'Roomier previews with one contextual relationship.'
  }
]

export const DEFAULT_ENTITY_CARD_VARIANT: EntityCardVariant = 'catalog'

export interface EntityCardMetric {
  label: string
  value: number
  kind?: ReportEntityKind
  ids?: string[]
}

export interface EntityCardPresentation {
  badge: string
  metrics: EntityCardMetric[]
  hookLabel: string
  hook: string
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`): string {
  return count === 1 ? singular : pluralLabel
}

function titles(workspace: ReportWorkspace, ids: string[], max = 2): string {
  const names = ids
    .map(id => workspace.byId.get(id)?.title)
    .filter((title): title is string => Boolean(title))
  const shown = names.slice(0, max)
  const remaining = names.length - shown.length
  return `${shown.join(' · ')}${remaining > 0 ? ` +${remaining}` : ''}`
}

function pairTitles(entity: { availability: Array<{ interfaceTitle: string, experienceTitle: string }> }, max = 2): string {
  const names = entity.availability.map(pair => pair.experienceTitle
    ? `${pair.interfaceTitle} › ${pair.experienceTitle}`
    : pair.interfaceTitle)
  const shown = names.slice(0, max)
  const remaining = names.length - shown.length
  return `${shown.join(' · ')}${remaining > 0 ? ` +${remaining}` : ''}`
}

function ruleBindingCount(rule: RuleView): number {
  return rule.domainIds.length + rule.capabilityIds.length + rule.journeyIds.length + rule.scenarioIds.length
}

function ruleReachCount(workspace: ReportWorkspace, rule: RuleView): number {
  const capabilities = new Set([
    ...rule.capabilityIds,
    ...workspace.capabilities
      .filter(capability => capability.domainId && rule.domainIds.includes(capability.domainId))
      .map(capability => capability.id)
  ])
  const journeys = new Set([
    ...rule.journeyIds,
    ...rule.scenarioIds
      .map(id => workspace.byId.get(id))
      .filter((entity): entity is ScenarioView => entity?.kind === 'scenario')
      .map(scenario => scenario.journeyId),
    ...workspace.journeys
      .filter(journey => journey.capabilityIds.some(id => capabilities.has(id)))
      .map(journey => journey.id)
  ])
  const screens = new Set(workspace.screens
    .filter(screen => screen.capabilityIds.some(id => capabilities.has(id))
      || screen.scenarioIds.some(id => rule.scenarioIds.includes(id)))
    .map(screen => screen.id))
  return capabilities.size + journeys.size + screens.size
}

export function entityCardPresentation(
  workspace: ReportWorkspace,
  entity: AnyEntityView
): EntityCardPresentation {
  switch (entity.kind) {
    case 'actor': {
      const actor = entity as ActorView
      const accessIds = [...actor.interfaceIds, ...actor.experienceIds]
      return {
        badge: `${actor.actorKind} · ${actor.relationship}`,
        metrics: [
          { label: plural(actor.interfaceIds.length, 'interface'), value: actor.interfaceIds.length, kind: 'interface', ids: actor.interfaceIds },
          { label: plural(actor.experienceIds.length, 'experience'), value: actor.experienceIds.length, kind: 'experience', ids: actor.experienceIds },
          { label: plural(actor.journeyIds.length, 'journey'), value: actor.journeyIds.length, kind: 'journey', ids: actor.journeyIds }
        ],
        hookLabel: accessIds.length ? 'Enters' : 'Performs',
        hook: accessIds.length ? titles(workspace, accessIds) : titles(workspace, actor.journeyIds)
      }
    }
    case 'interface': {
      const item = entity as InterfaceView
      return {
        badge: '',
        metrics: [
          { label: plural(item.actorIds.length, 'actor'), value: item.actorIds.length, kind: 'actor', ids: item.actorIds },
          { label: plural(item.experienceIds.length, 'experience'), value: item.experienceIds.length, kind: 'experience', ids: item.experienceIds },
          { label: 'entry points', value: item.entryPoints.length }
        ],
        hookLabel: item.experienceIds.length ? 'Contains' : 'Entry point',
        hook: item.experienceIds.length
          ? titles(workspace, item.experienceIds)
          : item.entryPoints.slice(0, 2).map(point => point.path).join(' · ')
      }
    }
    case 'experience': {
      const item = entity as ExperienceView
      return {
        badge: item.accessMode,
        metrics: [
          { label: plural(item.actorIds.length, 'actor'), value: item.actorIds.length, kind: 'actor', ids: item.actorIds },
          { label: plural(item.screenIds.length, 'screen'), value: item.screenIds.length, kind: 'screen', ids: item.screenIds },
          { label: 'entry points', value: item.entryPoints.length }
        ],
        hookLabel: 'Within',
        hook: titles(workspace, item.interfaceIds)
      }
    }
    case 'screen': {
      const screen = entity as ScreenView
      return {
        badge: '',
        metrics: [
          { label: plural(screen.availability.length, 'context'), value: screen.availability.length },
          { label: plural(screen.capabilityIds.length, 'capability', 'capabilities'), value: screen.capabilityIds.length, kind: 'capability', ids: screen.capabilityIds },
          { label: plural(screen.states.length, 'state'), value: screen.states.length }
        ],
        hookLabel: 'Available in',
        hook: pairTitles(screen)
      }
    }
    case 'domain': {
      const domain = entity as DomainView
      return {
        badge: '',
        metrics: [
          { label: plural(domain.capabilityIds.length, 'capability', 'capabilities'), value: domain.capabilityIds.length, kind: 'capability', ids: domain.capabilityIds },
          { label: plural(domain.journeyIds.length, 'journey'), value: domain.journeyIds.length, kind: 'journey', ids: domain.journeyIds },
          { label: plural(domain.ruleIds.length, 'rule'), value: domain.ruleIds.length, kind: 'rule', ids: domain.ruleIds }
        ],
        hookLabel: 'Includes',
        hook: titles(workspace, domain.capabilityIds)
      }
    }
    case 'capability': {
      const capability = entity as CapabilityView
      const domain = capability.domainId ? workspace.byId.get(capability.domainId)?.title ?? capability.domainId : ''
      return {
        badge: domain,
        metrics: [
          { label: plural(capability.availability.length, 'context'), value: capability.availability.length },
          { label: plural(capability.journeyIds.length, 'journey'), value: capability.journeyIds.length, kind: 'journey', ids: capability.journeyIds },
          { label: plural(capability.ruleIds.length, 'rule'), value: capability.ruleIds.length, kind: 'rule', ids: capability.ruleIds }
        ],
        hookLabel: 'Used by',
        hook: titles(workspace, capability.journeyIds)
      }
    }
    case 'journey': {
      const journey = entity as JourneyView
      return {
        badge: '',
        metrics: [
          { label: plural(journey.actorIds.length, 'actor'), value: journey.actorIds.length, kind: 'actor', ids: journey.actorIds },
          { label: plural(journey.scenarioIds.length, 'scenario'), value: journey.scenarioIds.length, kind: 'scenario', ids: journey.scenarioIds },
          { label: plural(journey.stepCount, 'step'), value: journey.stepCount }
        ],
        hookLabel: journey.actorIds.length ? 'Performed by' : 'Scenarios',
        hook: journey.actorIds.length ? titles(workspace, journey.actorIds) : titles(workspace, journey.scenarioIds)
      }
    }
    case 'scenario': {
      const scenario = entity as ScenarioView
      return {
        badge: scenario.kindName,
        metrics: [
          { label: plural(scenario.steps.length, 'step'), value: scenario.steps.length },
          { label: 'decisions', value: scenario.decisionPoints.length },
          { label: 'edge cases', value: scenario.edgeCases.length }
        ],
        hookLabel: 'In journey',
        hook: scenario.journeyTitle
      }
    }
    case 'rule': {
      const rule = entity as RuleView
      return {
        badge: '',
        metrics: [
          { label: 'bindings', value: ruleBindingCount(rule) },
          { label: 'affected', value: ruleReachCount(workspace, rule) },
          { label: plural(rule.availability.length, 'scope'), value: rule.availability.length }
        ],
        hookLabel: 'Attached to',
        hook: titles(workspace, [...rule.domainIds, ...rule.capabilityIds, ...rule.journeyIds, ...rule.scenarioIds])
      }
    }
  }
}
