/** Resolved relations behind a focused reading, with explicit derivation verbs. */
import type { AnyResourceView, ReportWorkspace } from './reportWorkspace'
import { resourceKey } from './reportWorkspace'
import { ruleAttachments } from './topologyTargets'

export interface TopologyRelation { source: string, target: string, label: string }

function directRelations(workspace: ReportWorkspace, resource: AnyResourceView): TopologyRelation[] {
  const relations: TopologyRelation[] = []
  const push = (source: string, target: string, label: string) => {
    if (workspace.byKey.has(source) && workspace.byKey.has(target)) relations.push({ source, target, label })
  }
  const contexts = (items: Array<{ interfaceId: string, experienceId: string }>, sourceKey: string, label = 'available in') => {
    for (const context of items) {
      const target = context.experienceId
        ? resourceKey('experience', context.experienceId)
        : resourceKey('interface', context.interfaceId)
      push(sourceKey, target, label)
    }
  }

  switch (resource.kind) {
    case 'interface': {
      for (const id of resource.actorIds) push(resourceKey('entity', id), resource.key, 'enters')
      for (const id of resource.experienceIds) push(resourceKey('experience', id), resource.key, 'within')
      for (const id of resource.capabilityIds) push(resourceKey('capability', id), resource.key, 'available in')
      for (const id of resource.screenIds) push(resourceKey('screen', id), resource.key, 'available in')
      for (const id of resource.journeyIds) push(resourceKey('journey', id), resource.key, 'available in')
      break
    }
    case 'experience': {
      for (const id of resource.actorIds) push(resourceKey('entity', id), resource.key, 'enters')
      for (const id of resource.interfaceIds) push(resource.key, resourceKey('interface', id), 'within')
      for (const id of resource.capabilityIds) push(resourceKey('capability', id), resource.key, 'available in')
      for (const id of resource.screenIds) push(resourceKey('screen', id), resource.key, 'available in')
      for (const id of resource.journeyIds) push(resourceKey('journey', id), resource.key, 'available in')
      break
    }
    case 'screen': {
      for (const id of resource.capabilityIds) push(resource.key, resourceKey('capability', id), 'exposes')
      for (const id of resource.capabilityScenarioIds) push(resource.key, resourceKey('capability-scenario', id), 'serves')
      for (const id of resource.journeyScenarioIds) push(resource.key, resourceKey('journey-scenario', id), 'serves')
      for (const id of resource.scenarioJourneyIds) push(resourceKey('journey', id), resource.key, 'passes through scenario')
      for (const id of resource.capabilityJourneyIds) push(resourceKey('journey', id), resource.key, 'reaches via capability')
      contexts(resource.contexts, resource.key)
      break
    }
    case 'entity': {
      if (resource.domainId) push(resource.key, resourceKey('domain', resource.domainId), 'in')
      for (const id of resource.presentedOnIds) push(resourceKey('screen', id), resource.key, 'presents')
      /* Where it acts. Empty for a thing that does not. */
      for (const id of resource.interfaceIds) push(resource.key, resourceKey('interface', id), 'enters')
      for (const id of resource.experienceIds) push(resource.key, resourceKey('experience', id), 'enters')
      for (const id of resource.journeyIds) push(resource.key, resourceKey('journey', id), 'performs')
      /* Only the authored side: the inverse is derived, so pushing both would
         draw one relationship as two edges facing each other. */
      for (const relation of resource.relations) {
        push(resource.key, resourceKey('entity', relation.entityId), `${relation.verb} ${relation.cardinality}`)
      }
      break
    }
    case 'domain': {
      for (const id of resource.capabilityIds) push(resourceKey('capability', id), resource.key, 'in')
      for (const id of resource.ruleIds) push(resourceKey('rule', id), resource.key, 'reaches through target')
      break
    }
    case 'capability': {
      for (const line of resource.entityEffects) push(resource.key, resourceKey('entity', line.entityId), [...new Set(line.effects.map(effect => effect.effect))].join(' · '))
      if (resource.domainId) push(resource.key, resourceKey('domain', resource.domainId), 'in')
      for (const id of resource.scenarioIds) push(resource.key, resourceKey('capability-scenario', id), 'cases into')
      for (const id of resource.journeyIds) push(resourceKey('journey', id), resource.key, 'uses')
      for (const id of resource.screenIds) push(resourceKey('screen', id), resource.key, 'exposes')
      contexts(resource.contexts, resource.key)
      break
    }
    case 'journey': {
      for (const id of resource.actorIds) push(resourceKey('entity', id), resource.key, 'performs')
      for (const id of resource.capabilityIds) push(resource.key, resourceKey('capability', id), 'uses')
      for (const id of resource.scenarioIds) push(resource.key, resourceKey('journey-scenario', id), 'cases into')
      for (const id of resource.screenIds) push(resource.key, resourceKey('screen', id), 'passes through')
      contexts(resource.contexts, resource.key)
      break
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      if (resource.scenarioType === 'capability') {
        push(resourceKey('capability', resource.capabilityId), resource.key, 'cases into')
      } else {
        push(resourceKey('journey', resource.journeyId), resource.key, 'cases into')
        for (const capabilityId of new Set(resource.steps.flatMap(step => step.capabilityId ? [step.capabilityId] : []))) {
          push(resource.key, resourceKey('capability', capabilityId), 'uses')
        }
      }
      for (const id of resource.screenIds) push(resourceKey('screen', id), resource.key, 'serves')
      contexts(resource.contexts, resource.key)
      break
    }
    case 'rule': {
      for (const attachment of ruleAttachments(workspace, resource)) push(resource.key, attachment.resource.key, attachment.label)
      break
    }
  }
  return relations
}


export function topologyRelations(workspace: ReportWorkspace): TopologyRelation[] {
  const relations = new Map<string, TopologyRelation>()
  for (const resource of workspace.byKey.values()) {
    for (const relation of directRelations(workspace, resource)) relations.set(JSON.stringify(relation), relation)
  }
  return [...relations.values()]
}
