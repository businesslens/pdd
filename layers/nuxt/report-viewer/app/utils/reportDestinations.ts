import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from './reportWorkspace'
import type { ProductTopologyViewId } from './productTopologyViews'
import { ruleAttachments } from './topologyTargets'
import { relatedIds } from './resourceFacets'

/**
 * Where each named view lives.
 *
 * A collection's Graph is the second drawing of its own set, reached by the
 * Rows/Graph switch as `mode: 'graph'`. The three cross-collection matrices
 * compare two collections at once, so no single collection owns them: each is
 * a rail row of its own, below Overview, and its section is its rail.
 */
export const REPORT_DESTINATIONS = [
  { section: 'entity-relationships', view: 'what-it-keeps', name: 'Entity relationships', label: 'Graph', icon: 'i-lucide-network', rail: 'entity', mode: 'graph' },
  { section: 'interface-map', view: 'sitemap', name: 'Interface map', label: 'Graph', icon: 'i-lucide-git-branch', rail: 'interface', mode: 'graph' },
  { section: 'domain-reach', view: 'domain-reach', name: 'Domain reach', label: 'Graph', icon: 'i-lucide-git-branch', rail: 'domain', mode: 'graph' },
  { section: 'capability-reach', view: 'capability-reach', name: 'Capability reach', label: 'Graph', icon: 'i-lucide-git-branch', rail: 'capability', mode: 'graph' },
  { section: 'journey-reach', view: 'journey-reach', name: 'Journey reach', label: 'Graph', icon: 'i-lucide-git-branch', rail: 'journey', mode: 'graph' },
  { section: 'rule-reach', view: 'rule-reach', name: 'Rule reach', label: 'Graph', icon: 'i-lucide-git-branch', rail: 'rule', mode: 'graph' },
  /* Unreserved glyphs: a kind's mark names that kind, and a matrix names two. */
  { section: 'delivery', view: 'delivery-by-interface', name: 'Compare delivery', label: 'Compare delivery', icon: 'i-lucide-grid-2x2', rail: 'delivery', mode: 'overview' },
  { section: 'what-changes-what', view: 'what-changes-what', name: 'What changes what', label: 'What changes what', icon: 'i-lucide-table', rail: 'what-changes-what', mode: 'overview' },
  { section: 'rule-attachments', view: 'rule-attachments', name: 'Rule attachments', label: 'Rule attachments', icon: 'i-lucide-link-2', rail: 'rule-attachments', mode: 'overview' }
] as const

/** The cross-collection views: rail rows below Overview, each its own section. */
export const MATRIX_DESTINATIONS = REPORT_DESTINATIONS.filter(item => item.mode === 'overview')
export const MATRIX_SECTIONS = new Set<string>(MATRIX_DESTINATIONS.map(item => item.section))

export const MAIN_RESOURCE_KINDS = ['entity', 'interface', 'domain', 'capability', 'journey', 'rule'] as const
export const destinationForSection = (section: string) => REPORT_DESTINATIONS.find(item => item.section === section)
export const destinationForView = (view: ProductTopologyViewId) => REPORT_DESTINATIONS.find(item => item.view === view)
export const destinationForLocation = (section: string, tab: string) => REPORT_DESTINATIONS.find(item => item.rail === section && item.mode === tab)
/** The Graph drawing of one collection, if it has one. */
export const graphForCollection = (kind: ReportResourceKind) => REPORT_DESTINATIONS.find(item => item.rail === kind && item.mode === 'graph')
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

/** Domain context is separate from ownership, whether assigned or reached. */
export function resourceDomains(workspace: ReportWorkspace, resource: AnyResourceView) {
  const ids = new Set(relatedIds(resource, 'domain'))
  // Interfaces and Scenarios reach Domains through their own Capabilities.
  // A Scenario must not inherit unrelated Domains from its parent's other cases.
  if (resource.kind === 'interface' || resource.kind === 'capability-scenario' || resource.kind === 'journey-scenario') {
    for (const id of relatedIds(resource, 'capability')) {
      const capability = workspace.byKey.get(`capability:${id}`)
      if (capability?.kind === 'capability' && capability.domainId) ids.add(capability.domainId)
    }
  }
  return workspace.domains.filter(domain => ids.has(domain.id))
}

export function resourceViewLinks(resource: AnyResourceView, workspace: ReportWorkspace) {
  const sections = resource.kind === 'entity' ? ['entity-relationships', 'what-changes-what']
    : ['interface', 'experience', 'screen'].includes(resource.kind) ? ['interface-map']
      : resource.kind === 'domain' ? ['domain-reach']
        : resource.kind === 'capability' ? ['capability-reach', 'what-changes-what']
          : resource.kind === 'journey' ? ['journey-reach']
            : resource.kind === 'rule' ? ['rule-reach'] : []
  if (resource.kind === 'rule' || workspace.rules.some(rule => ruleAttachments(workspace, rule).some(item => item.resource.key === resource.key))) sections.push('rule-attachments')
  return sections.map(section => destinationForSection(section)!)
}
