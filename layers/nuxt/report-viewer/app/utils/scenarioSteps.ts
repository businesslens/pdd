/**
 * What a Scenario Step is read by, resolved once for every drawing of it.
 */
import type { ReportWorkspace, ScenarioView } from './reportWorkspace'
import { resolveResource, resourceKey } from './reportWorkspace'

export type ScenarioStep = ScenarioView['steps'][number]

export const stepActor = (workspace: ReportWorkspace, step: ScenarioStep) =>
  step.actorId ? resolveResource(workspace, 'entity', step.actorId) : undefined
/** Only a Journey Step names a Capability; a Capability Scenario's Steps carry their parent. */
export const stepCapability = (workspace: ReportWorkspace, scenario: ScenarioView, step: ScenarioStep) =>
  scenario.scenarioType === 'journey' && step.capabilityId ? resolveResource(workspace, 'capability', step.capabilityId) : undefined
/** Where each route reaches the Step: the most specific place its Context names. */
export const stepRoutes = (workspace: ReportWorkspace, scenario: ScenarioView, step: ScenarioStep) => step.contexts.map(context => ({
  routeId: context.routeId,
  routeName: scenario.routes.find(route => route.id === context.routeId)?.name ?? context.routeId,
  place: workspace.byKey.get(resourceKey(context.context.kind, context.context.id))
}))
