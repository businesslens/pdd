/**
 * The fixed questions that make the Product Topology readable.
 *
 * Each view owns a question, its derivation, and its reading semantics. Views
 * are added when a question has no answer, not when a new axis is technically
 * possible — `access-map` folded into Delivery by Interface once that view carried
 * direct integrations, and `value-flow` and `domain-anatomy` folded into
 * Product map once Domains grouped Capabilities under the access rail.
 *
 * `everything` was removed rather than folded: "what is in the Product, and how
 * is it connected" is answered by the rail, which lists every collection with
 * its count, and by each resource's own Connections. A view that redraws the
 * whole index answers a question nothing was asking.
 */
import type { ReportResourceKind } from './reportWorkspace'

export type ProductTopologyViewId =
  | 'product-map'
  | 'value-paths'
  | 'delivery-by-interface'
  | 'sitemap'
  | 'rule-reach'
  | 'what-it-keeps'
  | 'what-changes-what'

export interface ProductTopologyView {
  id: ProductTopologyViewId
  name: string
  diagramType: string
  question: string
  note: string
  kinds: ReportResourceKind[]
}

export const PRODUCT_TOPOLOGY_VIEWS: ProductTopologyView[] = [
  {
    id: 'product-map',
    diagramType: 'Grouped map',
    name: 'Domain map',
    question: 'How are Capabilities and Entities classified by subject?',
    note: 'Capabilities and Entities are grouped by their authored Domain. Unassigned resources remain visible. Groups express classification, not containment or dependencies.',
    kinds: ['entity', 'domain', 'capability']
  },
  {
    id: 'value-paths',
    diagramType: 'Scenario columns',
    name: 'Composition',
    question: 'Which Capabilities does each Journey Scenario compose, and where does it land?',
    note: 'Every Journey in the model, each with its Scenarios as columns in authored Step order. Repeated Capabilities are separate occurrences; Contexts belong to their exact Step and route. Columns do not imply simultaneous Steps. Open a Scenario for its complete sequence, conditions and outcome.',
    kinds: ['journey', 'journey-scenario', 'capability', 'screen']
  },
  {
    id: 'delivery-by-interface',
    diagramType: 'Delivery matrix',
    name: 'Compare delivery',
    question: 'Which Interfaces deliver each Capability, and by what route?',
    note: 'Each cell is one authored delivery: a Screen of that Interface exposing the Capability, an Experience of it whose Context the Capability names, or the Interface itself where a Context names no Experience and no Screen carries it. A row with two cells is delivered twice; a row with one is exclusive to that Interface. An empty cell makes no claim beyond the absence of an authored Context.',
    kinds: ['entity', 'interface', 'experience', 'screen', 'capability']
  },
  {
    id: 'sitemap',
    diagramType: 'Containment tree',
    name: 'Interface map',
    question: 'What does each Interface contain?',
    note: 'The Product root branches into Interfaces, their Experiences and Screens. Lines show actual containment, not Screen-to-Screen navigation. Similar names remain distinct. Expand a branch to reveal its children; select a node to open its page.',
    kinds: ['product', 'interface', 'experience', 'screen']
  },
  {
    id: 'rule-reach',
    diagramType: 'Attachment matrix',
    name: 'Rule attachments',
    question: 'Where is each Business Rule explicitly attached?',
    note: 'Each cell is an authored Rule attachment. Details retain Entity operations, States, facts and Context restrictions. Derived Domains and inherited reach are excluded. An empty cell makes no permission or enforcement claim.',
    kinds: ['rule', 'entity', 'capability', 'journey', 'capability-scenario', 'journey-scenario', 'interface', 'experience', 'screen']
  },
  {
    id: 'what-it-keeps',
    diagramType: 'Entity relationship diagram',
    name: 'Entity relationships',
    question: 'What does the Product keep, and how do those things relate?',
    note: 'Each authored Entity relation is drawn once, from its declaring source to its target. Labels include both cardinalities: 1:N means one source to many targets. Disconnected Entities remain visible.',
    kinds: ['entity']
  },
  {
    id: 'what-changes-what',
    diagramType: 'Mutation matrix',
    name: 'What changes what',
    question: 'Which Capability creates, changes or removes each thing?',
    note: 'Capability and Journey Scenario Step effects are aggregated by Capability and Entity. Cells show creates, changes and removes, with supporting Scenarios. Reads are excluded. An empty cell means no declared mutation.',
    kinds: ['capability', 'entity'],
  }
]

export const DEFAULT_PRODUCT_TOPOLOGY_VIEW: ProductTopologyViewId = 'product-map'

export function findProductTopologyView(id: ProductTopologyViewId): ProductTopologyView {
  return PRODUCT_TOPOLOGY_VIEWS.find(view => view.id === id) ?? PRODUCT_TOPOLOGY_VIEWS[0]!
}
