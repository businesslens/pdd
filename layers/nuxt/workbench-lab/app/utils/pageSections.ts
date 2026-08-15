/**
 * What an entity page is made of, so five layouts can arrange the same parts.
 *
 * The page complaint is that it is too occupied — everything a kind can hold,
 * stacked, in one order, with no way to tell what is below the fold. Every
 * answer to that is an arrangement: tabs, a split, a contents rail, an
 * accordion. They can only be compared if they are arranging *identical*
 * material, so the material is described once here and each layout decides
 * only where it goes and whether it starts open.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from './model'
import { ENTITY_KIND_META, counterpartsOf, isScenarioKind } from './model'

export type PageSectionId =
  | 'overview'
  | 'detail'
  | 'flow'
  | 'neighbourhood'
  | 'children'
  | 'counterparts'
  | 'connections'
  | 'supporting'
  | 'references'

export interface PageSection {
  id: PageSectionId
  label: string
  /** Shown beside the label wherever a layout has room for it. */
  count?: number
  hint?: string
}

/** Kinds whose reach is the reading, so the graph is their body. */
export const GRAPH_LED: ReportEntityKind[] = ['actor', 'interface', 'experience', 'domain']

function hasAuthoredBody(entity: AnyEntityView): boolean {
  if (isScenarioKind(entity.kind)) return true
  if (entity.kind === 'screen' || entity.kind === 'rule' || entity.kind === 'journey') return true
  if (entity.intent) return true
  if ('capabilityBoundary' in entity && (entity as { capabilityBoundary: string }).capabilityBoundary) return true
  return entity.kind === 'capability'
}

export function sectionsFor(workspace: ReportWorkspace, entity: AnyEntityView): PageSection[] {
  const sections: PageSection[] = [{ id: 'overview', label: 'Overview' }]

  if (hasAuthoredBody(entity)) {
    sections.push({
      id: 'detail',
      label: isScenarioKind(entity.kind) ? 'The scenario' : 'Detail',
      hint: isScenarioKind(entity.kind)
        ? 'Trigger, steps, decisions and outcome.'
        : 'What the model authors about this entity.'
    })
  }

  if (entity.kind === 'journey') {
    sections.push({ id: 'flow', label: 'Scenario flows', hint: 'Each lane keeps the authored Capability order.' })
  }

  if (GRAPH_LED.includes(entity.kind)) {
    sections.push({ id: 'neighbourhood', label: 'Neighbourhood', hint: 'What it reaches, and what reaches it.' })
  }

  if (entity.kind === 'capability' || entity.kind === 'journey') {
    const children = entity.kind === 'capability'
      ? workspace.scenariosByCapability.get(entity.id) ?? []
      : workspace.scenariosByJourney.get(entity.id) ?? []
    sections.push({
      id: 'children',
      label: entity.kind === 'capability' ? 'Capability Scenarios' : 'Journey Scenarios',
      count: children.length,
      hint: entity.kind === 'capability'
        ? 'Each is one observable acceptance case.'
        : 'Each is one path through this promise.'
    })
  }

  const counterparts = counterpartsOf(workspace, entity)
  if (counterparts.length) {
    sections.push({
      id: 'counterparts',
      label: 'Also on',
      count: counterparts.length,
      hint: 'The same thing on another Interface.'
    })
  }

  sections.push({ id: 'connections', label: 'Connections', hint: 'Everything it touches.' })

  if (entity.supportingContent) sections.push({ id: 'supporting', label: 'Supporting context' })
  if (entity.references.length) {
    sections.push({ id: 'references', label: 'References', count: entity.references.length })
  }

  return sections
}

/** The parent of a Scenario, for the trail a child page carries. */
export function parentOf(workspace: ReportWorkspace, entity: AnyEntityView): AnyEntityView | null {
  if (!isScenarioKind(entity.kind)) return null
  const scenario = entity as { scenarioType: string, capabilityId: string, journeyId: string }
  const key = scenario.scenarioType === 'capability'
    ? `capability:${scenario.capabilityId}`
    : `journey:${scenario.journeyId}`
  return workspace.byKey.get(key) ?? null
}

/** A Scenario's siblings under the same parent, in authored order. */
export function siblingsOf(workspace: ReportWorkspace, entity: AnyEntityView): AnyEntityView[] {
  const parent = parentOf(workspace, entity)
  if (!parent) return []
  return parent.kind === 'capability'
    ? workspace.scenariosByCapability.get(parent.id) ?? []
    : workspace.scenariosByJourney.get(parent.id) ?? []
}

export const kindLabel = (kind: ReportEntityKind) => ENTITY_KIND_META[kind].label
