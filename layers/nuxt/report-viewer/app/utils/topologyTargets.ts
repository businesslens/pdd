import type { ReportBusinessRuleTarget } from 'businesslens/report'
import type { AnyResourceView, ReportWorkspace, RuleView } from './reportWorkspace'
import { resourceKey } from './reportWorkspace'

export interface TopologyAttachment {
  id: string
  resource: AnyResourceView
  label: string
  details: string[]
  contexts: AnyResourceView[]
  target: ReportBusinessRuleTarget
}

export function topologyPlace(workspace: ReportWorkspace, placeId: string) {
  for (const kind of ['screen', 'experience', 'interface'] as const) {
    const resource = workspace.byKey.get(resourceKey(kind, placeId))
    if (resource) return resource
  }
}

/** Attachments, not inherited reach. Preserve each selector even on the same target. */
export function ruleAttachments(workspace: ReportWorkspace, rule: RuleView): TopologyAttachment[] {
  return rule.appliesTo.flatMap((target, index) => {
    const resource = target.type === 'context'
      ? topologyPlace(workspace, target.context.placeId)
      : workspace.byKey.get(resourceKey(target.type, target.type === 'entity' ? target.entityId : target.id))
    if (!resource) return []
    const contexts = target.type === 'context' ? [] : target.contexts.flatMap(context => {
      const place = topologyPlace(workspace, context.placeId)
      return place ? [place] : []
    })
    const details = target.type === 'entity' ? [
      ...(target.from ? [`from ${target.from}`] : []),
      ...(target.to ? [`to ${target.to}`] : []),
      ...target.facts.map(fact => `fact: ${fact}`)
    ] : []
    return [{ id: `${rule.key}:target:${index}`, resource,
      label: target.type === 'context' ? 'applies here' : target.type === 'entity' ? target.effect ?? 'attached' : 'attached',
      details, contexts, target }]
  })
}

/** What an Entity target selects: its operation, then the facts it governs. */
export function entityOperation(target: Extract<ReportBusinessRuleTarget, { type: 'entity' }>): string {
  const operation = [target.effect || 'every operation', target.from ? `from ${target.from}` : '', target.to ? `to ${target.to}` : ''].filter(Boolean).join(' ')
  return target.facts.length ? `${operation} · ${target.facts.join(', ')}` : operation
}

/** An Entity target as a hook draws it: the operation with its badges, and where it is narrowed to. */
export interface HookOperation {
  target: Extract<ReportBusinessRuleTarget, { type: 'entity' }>
  places: string[]
  /** False where the page already is that Entity. */
  entity: boolean
}

/** One way a Rule names a resource: its label, its text, and the operations it draws where it names one. */
export interface AttachedRulePart {
  label: string
  text: string
  operations: HookOperation[]
}

/** A Rule read from a resource it names, with how it names it. */
export interface AttachedRule {
  rule: RuleView
  hookLabel: string
  hook: string
  parts: AttachedRulePart[]
}

/**
 * The Rules that name a resource, read from that resource's side: every edge
 * a Rule's Applies to tree draws is also read at its other end. A Rule names a
 * resource by targeting it, by targeting one of its Scenarios, or — for a
 * place — by narrowing a target to it or targeting it as a Context. A
 * Capability or Journey also lists a Rule whose Entity target selects Steps it
 * owns: the format says a target selects Steps, so that is what the Rule
 * governs, not a reach. Availability is: a Rule on a Capability is not listed
 * on every place that Capability is available in.
 */
export function attachedRules(workspace: ReportWorkspace, resource: AnyResourceView): AttachedRule[] {
  /* A reading asks three times — its tabs, its connections, its Business Rules tab — so it is read once per workspace. */
  let readings = attachedRulesCache.get(workspace)
  if (!readings) attachedRulesCache.set(workspace, readings = new Map())
  const cached = readings.get(resource.key)
  if (cached) return cached
  const titles = (places: AnyResourceView[]) => places.map(place => place.title).join(', ')
  const owned = ownedSteps(workspace, resource)
  const attached = workspace.rules.flatMap((rule) => {
    const found: AttachedRulePart[] = []
    const part = (label: string, text: string, operations: HookOperation[] = []) => found.push({ label, text, operations })
    for (const { resource: target, target: selector, contexts } of ruleAttachments(workspace, rule)) {
      const operation = selector.type === 'entity' ? entityOperation(selector) : ''
      if (target.key === resource.key) {
        if (selector.type === 'context') part('Where', 'Everything done here')
        else if (selector.type === 'entity') {
          part('Selects', contexts.length ? `${operation} · Only in ${titles(contexts)}` : operation,
            [{ target: selector, places: contexts.map(place => place.title), entity: false }])
        } else part('Where', contexts.length ? `Only in ${titles(contexts)}` : 'Every supported Context')
      } else if ((target.kind === 'capability-scenario' || target.kind === 'journey-scenario')
        && (resource.kind === 'capability' ? target.capabilityId === resource.id && target.scenarioType === 'capability'
          : resource.kind === 'journey' && target.journeyId === resource.id && target.scenarioType === 'journey')) {
        part('On', contexts.length ? `${target.title} · Only in ${titles(contexts)}` : target.title)
      } else if (contexts.some(place => place.key === resource.key)) {
        part('Here, for', operation ? `${target.title} · ${operation}` : target.title,
          selector.type === 'entity' ? [{ target: selector, places: [], entity: true }] : [])
      }
    }
    /* Through its Steps: an Entity target selects the Steps doing its operation, and a Capability or Journey owns those Steps. */
    const governed = governedBy(rule, owned)
    if (governed.length) {
      part('Governs its Steps', governed.map(target => selectorPhrase(workspace, target)).join(', '),
        governed.map(target => ({ target, places: target.contexts.flatMap(context => { const place = topologyPlace(workspace, context.placeId); return place ? [place.title] : [] }), entity: true })))
    }
    if (!found.length) return []
    /* One row per Rule: the first way it names the resource leads, any other is spelled out. */
    const hookLabel = found[0]!.label
    return [{ rule, hookLabel, hook: found.map(item => item.label === hookLabel ? item.text : `${item.label.toLowerCase()} ${item.text}`).join('; '), parts: found }]
  })
  readings.set(resource.key, attached)
  return attached
}

const attachedRulesCache = new WeakMap<ReportWorkspace, Map<string, AttachedRule[]>>()

type OwnedStep = ReportWorkspace['scenarios'][number]['steps'][number]

/** The Steps a Capability or Journey owns: its Capability Scenarios' Steps and the Journey Steps naming it, or its Journey Scenarios' Steps. */
function ownedSteps(workspace: ReportWorkspace, resource: AnyResourceView): OwnedStep[] {
  if (resource.kind !== 'capability' && resource.kind !== 'journey') return []
  return workspace.scenarios.flatMap(scenario => scenario.steps.filter(step => resource.kind === 'capability'
    ? (scenario.scenarioType === 'capability' ? scenario.capabilityId === resource.id : step.capabilityId === resource.id)
    : scenario.scenarioType === 'journey' && scenario.journeyId === resource.id))
}

/** The Rule's Entity targets selecting any of those Steps, each once, in authored order: what the Rule governs there, read as its own selectors. */
function governedBy(rule: RuleView, owned: OwnedStep[]): Array<Extract<ReportBusinessRuleTarget, { type: 'entity' }>> {
  const indexes = [...new Set(owned.flatMap(step => step.governedBy.filter(item => item.ruleId === rule.id).flatMap(item => item.targets)))].sort((a, b) => a - b)
  return indexes.flatMap((index) => {
    const target = rule.appliesTo[index]
    return target?.type === 'entity' ? [target] : []
  })
}

/** An Entity target read with its Entity named: "changes Collection to Published · Total charged · Only in Order detail". */
export function selectorPhrase(workspace: ReportWorkspace, target: Extract<ReportBusinessRuleTarget, { type: 'entity' }>): string {
  const title = workspace.byKey.get(resourceKey('entity', target.entityId))?.title ?? target.entityId
  const places = target.contexts.flatMap(context => { const place = topologyPlace(workspace, context.placeId); return place ? [place.title] : [] })
  return [
    [target.effect || 'every operation on', title, target.from ? `from ${target.from}` : '', target.to ? `to ${target.to}` : ''].filter(Boolean).join(' '),
    ...(target.facts.length ? [target.facts.join(', ')] : []),
    ...(places.length ? [`Only in ${places.join(', ')}`] : [])
  ].join(' · ')
}
