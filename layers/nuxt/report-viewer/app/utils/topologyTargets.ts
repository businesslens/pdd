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

/** A Rule read from a resource it names, with how it names it. */
export interface AttachedRule {
  rule: RuleView
  hookLabel: string
  hook: string
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
  const titles = (places: AnyResourceView[]) => places.map(place => place.title).join(', ')
  return workspace.rules.flatMap((rule) => {
    const found: Array<[string, string]> = []
    for (const { resource: target, target: selector, contexts } of ruleAttachments(workspace, rule)) {
      const operation = selector.type === 'entity' ? entityOperation(selector) : ''
      if (target.key === resource.key) {
        if (selector.type === 'context') found.push(['Where', 'Everything done here'])
        else if (selector.type === 'entity') found.push(['Selects', contexts.length ? `${operation} · Only in ${titles(contexts)}` : operation])
        else found.push(['Where', contexts.length ? `Only in ${titles(contexts)}` : 'Every supported Context'])
      } else if ((target.kind === 'capability-scenario' || target.kind === 'journey-scenario')
        && (resource.kind === 'capability' ? target.capabilityId === resource.id && target.scenarioType === 'capability'
          : resource.kind === 'journey' && target.journeyId === resource.id && target.scenarioType === 'journey')) {
        found.push(['On', contexts.length ? `${target.title} · Only in ${titles(contexts)}` : target.title])
      } else if (contexts.some(place => place.key === resource.key)) {
        found.push(['Here, for', operation ? `${target.title} · ${operation}` : target.title])
      }
    }
    /* Through its Steps: an Entity target selects the Steps doing its operation, and a Capability or Journey owns those Steps. */
    const governed = governedOperations(workspace, resource, rule.id)
    if (governed.length) found.push(['Governs its Steps', governed.join(', ')])
    if (!found.length) return []
    /* One row per Rule: the first way it names the resource leads, any other is spelled out. */
    const [[hookLabel]] = found as [[string, string]]
    return [{ rule, hookLabel, hook: found.map(([label, text]) => label === hookLabel ? text : `${label.toLowerCase()} ${text}`).join('; ') }]
  })
}

/**
 * What a Rule governs in the Steps a Capability or Journey owns — its
 * Capability Scenarios' Steps and the Journey Steps naming it, or its Journey
 * Scenarios' Steps — read as the Rule's own selectors that select them, each
 * once: "changes Collection", "reads Collection · Public address". The Steps
 * themselves are on its Scenarios.
 */
export function governedOperations(workspace: ReportWorkspace, resource: AnyResourceView, ruleId: string): string[] {
  if (resource.kind !== 'capability' && resource.kind !== 'journey') return []
  const rule = workspace.byKey.get(resourceKey('rule', ruleId))
  if (rule?.kind !== 'rule') return []
  const owned = workspace.scenarios.flatMap(scenario => scenario.steps.filter(step => resource.kind === 'capability'
    ? (scenario.scenarioType === 'capability' ? scenario.capabilityId === resource.id : step.capabilityId === resource.id)
    : scenario.scenarioType === 'journey' && scenario.journeyId === resource.id))
  const indexes = [...new Set(owned.flatMap(step => step.governedBy.filter(item => item.ruleId === ruleId).flatMap(item => item.targets)))].sort((a, b) => a - b)
  return indexes.flatMap((index) => {
    const target = rule.appliesTo[index]
    return target?.type === 'entity' ? [selectorPhrase(workspace, target)] : []
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
