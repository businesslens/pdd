import type { ReportResourceKind } from './reportWorkspace'
import { ENTITY_KIND_META } from './reportWorkspace'
import { graphForCollection, matrixForCollection } from './reportDestinations'
import { findProductTopologyView } from './productTopologyViews'
import type { CollectionDrawing } from './collectionControls'

export interface DrawingChoice {
  id: CollectionDrawing
  label: string
  shortLabel: string
  icon: string
  description: string
}
export function collectionDrawingChoices(kind: ReportResourceKind): DrawingChoice[] {
  const description = `Scan ${ENTITY_KIND_META[kind].plural.toLowerCase()} and open a resource for details.`
  const choices: DrawingChoice[] = [{ id: 'rows', label: 'List', shortLabel: 'List', icon: 'i-lucide-rows-3', description }]
  const graph = graphForCollection(kind)
  const matrix = matrixForCollection(kind)
  if (graph) {
    const view = findProductTopologyView(graph.view)
    choices.push({ id: 'graph', label: kind === 'entity' ? 'Relationships' : kind === 'interface' ? 'Structure' : 'Reach',
      shortLabel: kind === 'entity' ? 'Links' : kind === 'interface' ? 'Map' : 'Reach',
      icon: 'i-lucide-waypoints', description: view.question })
  }
  if (matrix) {
    const view = findProductTopologyView(matrix.view)
    const label = kind === 'entity' ? 'Changes' : kind === 'capability' ? 'Delivery' : 'Attachments'
    choices.push({ id: 'matrix', label, shortLabel: kind === 'rule' ? 'Targets' : label,
      icon: 'i-lucide-grid-2x2', description: view.question })
  }
  return choices
}
