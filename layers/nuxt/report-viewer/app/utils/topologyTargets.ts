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
