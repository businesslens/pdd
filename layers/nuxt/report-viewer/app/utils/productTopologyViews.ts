/**
 * The fixed Product Topology views.
 *
 * A view owns its question, derivation and reading semantics. Filters may
 * narrow a view later, but readers never assemble meaning from arbitrary axes.
 */
import type { ReportEntityKind } from './reportWorkspace'

export type ProductTopologyViewId =
  | 'everything'
  | 'value-flow'
  | 'access-map'
  | 'sitemap'
  | 'domain-anatomy'
  | 'rule-reach'
  | 'journey-anatomy'

export type TopologySemantics = 'identity' | 'occurrence'

export interface TopologyFlowStep {
  kind: ReportEntityKind
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
  kinds: ReportEntityKind[]
  /** Draw every relation quietly until a node lights its neighbourhood. */
  latentEdges?: true
}

export const PRODUCT_TOPOLOGY_VIEWS: ProductTopologyView[] = [
  {
    id: 'everything',
    name: 'Everything',
    question: 'What is the entire product, all at once?',
    semantics: 'identity',
    note: 'Fixed shelves read access → behaviour → structure → governance. The resolved relation web stays quiet until a node is hovered or selected.',
    flow: [],
    separators: [],
    kinds: ['product', 'actor', 'interface', 'experience', 'screen', 'scenario', 'journey', 'capability', 'domain', 'rule'],
    latentEdges: true
  },
  {
    id: 'value-flow',
    name: 'Value flow',
    question: 'Who uses the product to do what, and where does it land?',
    semantics: 'identity',
    flow: [
      { kind: 'actor', label: 'Actors' },
      { kind: 'journey', label: 'Journeys' },
      { kind: 'capability', label: 'Capabilities' },
      { kind: 'screen', label: 'Screens' }
    ],
    separators: ['→', '→', '→'],
    kinds: ['actor', 'journey', 'capability', 'screen']
  },
  {
    id: 'access-map',
    name: 'Access map',
    question: 'How does an Actor reach the product?',
    semantics: 'identity',
    flow: [
      { kind: 'actor', label: 'Actors' },
      { kind: 'interface', label: 'Interfaces' },
      { kind: 'experience', label: 'Experiences' },
      { kind: 'screen', label: 'Screens' }
    ],
    separators: ['→', '→', '→'],
    kinds: ['actor', 'interface', 'experience', 'screen']
  },
  {
    id: 'sitemap',
    name: 'Sitemap',
    question: 'What does each Interface contain?',
    semantics: 'occurrence',
    note: 'Shared Experiences and Screens repeat under every Interface context that offers them.',
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
    id: 'domain-anatomy',
    name: 'Domain anatomy',
    question: 'What is the product made of?',
    semantics: 'identity',
    flow: [
      { kind: 'domain', label: 'Domains' },
      { kind: 'capability', label: 'Capabilities' }
    ],
    separators: ['⊃'],
    kinds: ['domain', 'capability']
  },
  {
    id: 'rule-reach',
    name: 'Rule reach',
    question: 'Where is each invariant enforced?',
    semantics: 'identity',
    flow: [
      { kind: 'rule', label: 'Rules' },
      { kind: 'domain', label: 'Domains' },
      { kind: 'capability', label: 'Capabilities' },
      { kind: 'journey', label: 'Journeys' },
      { kind: 'scenario', label: 'Scenarios' }
    ],
    separators: ['→', '·', '·', '·'],
    kinds: ['rule', 'domain', 'capability', 'journey', 'scenario'],
    latentEdges: true
  },
  {
    id: 'journey-anatomy',
    name: 'Journey anatomy',
    question: 'How does one goal unfold?',
    semantics: 'identity',
    flow: [
      { kind: 'journey', label: 'Journey' },
      { kind: 'scenario', label: 'Scenarios' },
      { kind: 'capability', label: 'Capabilities' },
      { kind: 'screen', label: 'Screens' }
    ],
    separators: ['→', '→', '→'],
    kinds: ['journey', 'scenario', 'capability', 'screen']
  }
]

export const DEFAULT_PRODUCT_TOPOLOGY_VIEW: ProductTopologyViewId = 'value-flow'

export function findProductTopologyView(id: ProductTopologyViewId): ProductTopologyView {
  return PRODUCT_TOPOLOGY_VIEWS.find(view => view.id === id) ?? PRODUCT_TOPOLOGY_VIEWS[1]!
}
