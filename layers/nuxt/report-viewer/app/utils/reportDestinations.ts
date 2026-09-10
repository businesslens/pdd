import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from './reportWorkspace'
import type { ProductTopologyViewId } from './productTopologyViews'
import { ruleAttachments } from './topologyTargets'

/** Stable view ids also accept previously shared standalone section URLs. */
export const REPORT_DESTINATIONS = [
  { section: 'product-map', view: 'product-map', name: 'Domain map', label: 'Map', icon: 'i-lucide-layout-grid', rail: 'domain', mode: 'map' },
  { section: 'interface-map', view: 'sitemap', name: 'Interface map', label: 'Map', icon: 'i-lucide-git-branch', rail: 'interface', mode: 'map' },
  { section: 'entity-relationships', view: 'what-it-keeps', name: 'Entity relationships', label: 'Relationships', icon: 'i-lucide-network', rail: 'entity', mode: 'relationships' },
  { section: 'rule-attachments', view: 'rule-reach', name: 'Rule attachments', label: 'Attachments', icon: 'i-lucide-scale', rail: 'rule', mode: 'attachments' },
  { section: 'what-changes-what', view: 'what-changes-what', name: 'What changes what', label: 'What changes what', icon: 'i-lucide-table', rail: 'capability', mode: 'mutations' },
  { section: 'journey-composition', view: 'value-paths', name: 'Composition', label: 'Composition', icon: 'i-lucide-columns-3', rail: 'journey', mode: 'composition' },
  { section: 'delivery', view: 'delivery-by-interface', name: 'Compare delivery', label: 'Compare delivery', icon: 'i-lucide-plug', rail: 'interface', mode: 'delivery' }
] as const

export const MAIN_RESOURCE_KINDS = ['entity', 'interface', 'domain', 'capability', 'journey', 'rule'] as const
export const destinationForSection = (section: string) => REPORT_DESTINATIONS.find(item => item.section === section)
export const destinationForView = (view: ProductTopologyViewId) => REPORT_DESTINATIONS.find(item => item.view === view)
export const destinationForLocation = (section: string, tab: string, resource?: string | null) => resource ? undefined : REPORT_DESTINATIONS.find(item => item.rail === section && item.mode === tab)
export const collectionKindFor = (kind: ReportResourceKind): ReportResourceKind => kind === 'experience' || kind === 'screen' ? 'interface' : kind === 'capability-scenario' ? 'capability' : kind === 'journey-scenario' ? 'journey' : kind

/** Actual ownership only: a shared Screen has an Interface parent. */
export function resourceAncestors(workspace: ReportWorkspace, resource: AnyResourceView): AnyResourceView[] {
  let keys: string[] = []
  if (resource.kind === 'experience') keys = [`interface:${resource.interfaceIds[0]}`]
  if (resource.kind === 'screen') {
    const context = resource.contexts[0]
    keys = [`interface:${context?.interfaceId}`, ...(context?.experienceId ? [`experience:${context.experienceId}`] : [])]
  }
  if (resource.kind === 'capability-scenario' || resource.kind === 'journey-scenario') keys = [resource.scenarioType === 'capability' ? `capability:${resource.capabilityId}` : `journey:${resource.journeyId}`]
  return keys.flatMap(key => { const item = workspace.byKey.get(key); return item ? [item] : [] })
}

export function resourceViewLinks(resource: AnyResourceView, workspace: ReportWorkspace) {
  const sections = resource.kind === 'entity' ? ['entity-relationships', 'what-changes-what']
    : resource.kind === 'domain' ? ['product-map']
      : ['interface', 'experience', 'screen'].includes(resource.kind) ? ['interface-map']
        : resource.kind === 'capability' ? ['product-map', 'what-changes-what'] : []
  if (resource.kind === 'rule' || workspace.rules.some(rule => ruleAttachments(workspace, rule).some(item => item.resource.key === resource.key))) sections.push('rule-attachments')
  return sections.map(section => destinationForSection(section)!)
}
