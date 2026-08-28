/**
 * The fixed questions that make the Product Topology readable.
 *
 * Each view owns a question, its derivation, and its reading semantics. Views
 * are added when a question has no answer, not when a new axis is technically
 * possible — `access-map` folded into Delivery by Interface once that view carried
 * direct integrations, and `value-flow` and `domain-anatomy` folded into
 * Product map once Domains grouped Capabilities under the access rail.
 */
import type { ReportElementKind } from './reportWorkspace'

export type ProductTopologyViewId =
  | 'product-map'
  | 'value-paths'
  | 'delivery-by-interface'
  | 'sitemap'
  | 'rule-reach'
  | 'what-it-keeps'
  | 'everything'

export type TopologySemantics = 'identity' | 'occurrence'

export interface TopologyFlowStep {
  kind: ReportElementKind
  label: string
}

export interface ProductTopologyView {
  id: ProductTopologyViewId
  name: string
  question: string
  semantics: TopologySemantics
  note?: string
  flow: TopologyFlowStep[]
  separators: string[]
  kinds: ReportElementKind[]
  /** Draw every relation quietly until a node lights its neighbourhood. */
  latentEdges?: true
}

export const PRODUCT_TOPOLOGY_VIEWS: ProductTopologyView[] = [
  {
    id: 'product-map',
    name: 'Product map',
    question: 'What can the product do, and how is that capability grouped?',
    semantics: 'identity',
    note: 'Domain lanes use their authored colours. Access paths show which Interfaces offer each Capability.',
    flow: [
      { kind: 'actor', label: 'Actors' },
      { kind: 'interface', label: 'Interfaces' },
      { kind: 'domain', label: 'Domains' },
      { kind: 'capability', label: 'Capabilities' }
    ],
    separators: ['→', '→', '⊃'],
    kinds: ['actor', 'interface', 'domain', 'capability']
  },
  {
    id: 'value-paths',
    name: 'Journey composition',
    question: 'Which Capabilities does each Journey Scenario compose, and where does it land?',
    semantics: 'occurrence',
    note: 'This is a Capability projection, not the complete Scenario. Variations run side by side and their Capability-bearing Steps read downward; read the Scenario for conditions, seams and Product-side Steps without a Capability.',
    flow: [
      { kind: 'journey', label: 'Journey' },
      { kind: 'journey-scenario', label: 'Variations' },
      { kind: 'capability', label: 'Capability Steps' },
      { kind: 'screen', label: 'Landings' }
    ],
    separators: ['↓', '↓', '↓'],
    kinds: ['journey', 'journey-scenario', 'capability', 'screen']
  },
  {
    id: 'delivery-by-interface',
    name: 'Delivery by Interface',
    question: 'Where does each human or system enter, and what does each Interface deliver?',
    semantics: 'identity',
    note: 'Graphical Interfaces continue through Experiences and Screens. Direct integrations terminate in the Capability they deliver.',
    flow: [
      { kind: 'actor', label: 'Actors' },
      { kind: 'interface', label: 'Interfaces' },
      { kind: 'experience', label: 'Experiences' },
      { kind: 'screen', label: 'Screens' },
      { kind: 'capability', label: 'Direct capabilities' }
    ],
    separators: ['→', '→', '→', '·'],
    kinds: ['actor', 'interface', 'experience', 'screen', 'capability']
  },
  {
    id: 'sitemap',
    name: 'Sitemap',
    question: 'What does each Interface contain?',
    semantics: 'occurrence',
    note: 'Shared Experiences and Screens repeat under every Interface context that offers them, because repetition is part of the answer.',
    flow: [
      { kind: 'product', label: 'Product' },
      { kind: 'interface', label: 'Interfaces' },
      { kind: 'experience', label: 'Experiences' },
      { kind: 'screen', label: 'Screens' }
    ],
    separators: ['→', '→', '→'],
    kinds: ['product', 'interface', 'experience', 'screen']
  },
  {
    id: 'rule-reach',
    name: 'Rule reach',
    question: 'Where is each invariant enforced?',
    semantics: 'identity',
    note: 'Every edge is an authored attachment, never derived reach. Relations stay quiet until a node is hovered or selected; focus one Rule in Filters to read its reach alone.',
    flow: [
      { kind: 'rule', label: 'Rules' },
      { kind: 'domain', label: 'Domains' },
      { kind: 'capability', label: 'Capabilities' },
      { kind: 'journey', label: 'Journeys' },
      { kind: 'capability-scenario', label: 'Cap. Scenarios' },
      { kind: 'journey-scenario', label: 'Journey Scenarios' }
    ],
    separators: ['→', '·', '·', '·', '·'],
    kinds: ['rule', 'domain', 'capability', 'journey', 'capability-scenario', 'journey-scenario'],
    latentEdges: true
  },
  {
    id: 'what-it-keeps',
    name: 'What it keeps',
    question: 'What does the Product keep, and how do those things relate?',
    semantics: 'identity',
    note: 'Each relation is authored on one side and drawn once, reading source \u2192 target. Colour is the Domain. What changes a thing is on its page.',
    flow: [{ kind: 'entity', label: 'Entities' }],
    separators: [],
    kinds: ['entity']
  },
  {
    id: 'everything',
    name: 'Everything',
    question: 'What is the entire product, all at once?',
    semantics: 'identity',
    note: 'Fixed shelves read access → Interface → behaviour → governance. The resolved relation web stays quiet until a node is hovered or selected; hide a shelf or focus an element to thin it.',
    flow: [],
    separators: [],
    kinds: [
      'product',
      'actor',
      'interface',
      'experience',
      'screen',
      'capability-scenario',
      'journey-scenario',
      'journey',
      'capability',
      'entity',
      'domain',
      'rule'
    ],
    latentEdges: true
  }
]

export const DEFAULT_PRODUCT_TOPOLOGY_VIEW: ProductTopologyViewId = 'product-map'

export function findProductTopologyView(id: ProductTopologyViewId): ProductTopologyView {
  return PRODUCT_TOPOLOGY_VIEWS.find(view => view.id === id) ?? PRODUCT_TOPOLOGY_VIEWS[0]!
}
