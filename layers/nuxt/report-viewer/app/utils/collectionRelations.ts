import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from './reportWorkspace'
import type { TopologyMatrix, TopologyMatrixCell } from './topologyProjections'
import { deliveryMatrixProjection, mutationProjection, ruleAttachmentsProjection } from './topologyProjections'

type CollectionRelation = { label: string, mode: 'mutations' | 'delivery' | 'rules', source: TopologyMatrix, drawing?: TopologyMatrix }
// Workspaces are replaced on recompilation; sharing the projection also keeps
// card summaries and collection filters accountable to the same relation.
const cache = new WeakMap<ReportWorkspace, Map<ReportResourceKind, CollectionRelation | undefined>>()

export function collectionRelation(workspace: ReportWorkspace, kind: ReportResourceKind): CollectionRelation | undefined {
  let entries = cache.get(workspace)
  if (!entries) { entries = new Map(); cache.set(workspace, entries) }
  if (!entries.has(kind)) entries.set(kind, projectCollectionRelation(workspace, kind))
  return entries.get(kind)
}

/** The same authored relation selects subjects and supplies Matrix cells. */
function projectCollectionRelation(workspace: ReportWorkspace, kind: ReportResourceKind) {
  if (kind === 'entity') return { label: 'Changed by', mode: 'mutations' as const, source: mutationProjection(workspace) }
  if (kind === 'capability') {
    const drawing = deliveryMatrixProjection(workspace)
    return { label: 'Available in', mode: 'delivery' as const, source: availabilityProjection(workspace, drawing), drawing }
  }
  if (kind === 'rule') return { label: 'Attached to', mode: 'rules' as const, source: ruleAttachmentsProjection(workspace) }
  return undefined
}

export function selectedRelationColumns(source: TopologyMatrix, selections: string[]): AnyResourceView[] {
  return source.columns.filter(resource => !selections.length || selections.includes(resource.key) || selections.includes(`type:${resource.kind}`))
}

export function filterCollectionRelation(source: TopologyMatrix, selections: string[], rows = source.rows): TopologyMatrix {
  const columns = selectedRelationColumns(source, selections)
  const columnKeys = new Set(columns.map(resource => resource.key))
  const matchingRows = new Set(source.cells.filter(cell => columnKeys.has(cell.column)).map(cell => cell.row))
  const subjects = rows.filter(resource => !selections.length || matchingRows.has(resource.key))
  const rowKeys = new Set(subjects.map(resource => resource.key))
  return { rows: subjects, columns, cells: source.cells.filter(cell => rowKeys.has(cell.row) && columnKeys.has(cell.column)) }
}

export function pruneRelationSelections(source: TopologyMatrix, selections: string[]): string[] {
  const valid = new Set(source.columns.flatMap(resource => [resource.key, `type:${resource.kind}`]))
  return [...new Set(selections)].filter(value => valid.has(value))
}

/** Availability includes a delivered Screen and its containing places. A
 * parent-level declaration never invents delivery on all of its child Screens. */
function availabilityProjection(workspace: ReportWorkspace, delivery: TopologyMatrix): TopologyMatrix {
  const cells = new Map<string, TopologyMatrixCell>(delivery.cells.map(cell => [cell.id, cell]))
  for (const cell of delivery.cells) {
    const places = cell.evidence.flatMap(resource => resource.kind === 'screen'
      ? [resource, ...resource.contexts.filter(context => `interface:${context.interfaceId}` === cell.column)
        .flatMap(context => {
          const experience = workspace.byKey.get(`experience:${context.experienceId}`)
          return experience ? [experience] : []
        })]
      : [resource])
    for (const place of places) {
      const id = `${cell.row}->${place.key}`
      cells.set(id, { id, row: cell.row, column: place.key, labels: [], evidence: [], details: [] })
    }
  }
  return { rows: delivery.rows, columns: [...workspace.interfaces, ...workspace.experiences, ...workspace.screens], cells: [...cells.values()] }
}

/** Capabilities still compare Interfaces; selections narrow their delivery
 * routes as well as their subjects. Other collections draw their relation as-is. */
export function collectionRelationDrawing(relation: CollectionRelation, selections: string[]): TopologyMatrix {
  const scope = filterCollectionRelation(relation.source, selections)
  if (!relation.drawing) return scope
  if (!selections.length) return relation.drawing
  const matches = (resource: AnyResourceView) => selections.includes(resource.key) || selections.includes(`type:${resource.kind}`)
  const interfaces = new Set(scope.columns.flatMap(resource => resource.kind === 'interface' ? [resource.id]
    : resource.kind === 'experience' || resource.kind === 'screen' ? resource.interfaceIds : []))
  const columns = relation.drawing.columns.filter(resource => interfaces.has(resource.id))
  const columnKeys = new Set(columns.map(resource => resource.key))
  const rowKeys = new Set(scope.rows.map(resource => resource.key))
  const cells = relation.drawing.cells.flatMap(cell => {
    if (!rowKeys.has(cell.row) || !columnKeys.has(cell.column)) return []
    if (selections.includes(cell.column) || selections.includes('type:interface')) return [cell]
    const evidence = cell.evidence.filter(resource => matches(resource) || (resource.kind === 'screen'
      && resource.contexts.some(context => `interface:${context.interfaceId}` === cell.column && context.experienceId
        && (selections.includes(`experience:${context.experienceId}`) || selections.includes('type:experience')))))
    if (!evidence.length) return []
    return [{ ...cell, evidence, labels: [
      ...(evidence.some(resource => resource.kind === 'experience') ? ['in experience'] : []),
      ...(evidence.some(resource => resource.kind === 'screen') ? ['on screen'] : [])
    ] }]
  })
  return { rows: scope.rows, columns, cells }
}
