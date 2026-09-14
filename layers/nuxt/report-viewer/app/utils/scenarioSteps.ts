/**
 * What a Scenario Step is read by, resolved once for every drawing of it.
 */
import type { ReportWorkspace, ScenarioView } from './reportWorkspace'
import { resolveResource } from './reportWorkspace'

export type ScenarioStep = ScenarioView['steps'][number]

export const stepActor = (workspace: ReportWorkspace, step: ScenarioStep) =>
  step.actorId ? resolveResource(workspace, 'entity', step.actorId) : undefined
/** Only a Journey Step names a Capability; a Capability Scenario's Steps carry their parent. */
export const stepCapability = (workspace: ReportWorkspace, scenario: ScenarioView, step: ScenarioStep) =>
  scenario.scenarioType === 'journey' && step.capabilityId ? resolveResource(workspace, 'capability', step.capabilityId) : undefined
