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
 *
 * `value-paths` (Composition) folded into the Journeys collection's Rows: a
 * Journey row expands to its Scenarios, each reading its Capability chain in
 * Step order. The columns drew the same chain beside route Contexts a reader
 * comparing Journeys never asked for.
 */
import type { ReportResourceKind } from './reportWorkspace'

export type ProductTopologyViewId =
  | 'domain-reach'
  | 'capability-reach'
  | 'journey-reach'
  | 'rule-reach'
  | 'sitemap'
  | 'what-it-keeps'
  | 'delivery-by-interface'
  | 'rule-attachments'
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
  /* The four reach graphs draw one collection's set as a tree rooted at the
     Product. A child is an occurrence: a Screen three Capabilities are
     available on is drawn under each of them, because the question is asked
     of the Capability, not of the Screen. */
  {
    id: 'domain-reach',
    diagramType: 'Reach tree',
    name: 'Domain reach',
    question: 'Where is each Domain reached, and what is reached there?',
    note: 'Each Domain branches into the places its Capabilities, Journeys and Business Rules are available in — a Screen, else an Experience, else an Interface, resolved from authored Contexts — and each place into what is reached there. A member with no Context sits directly under its Domain. Domains classify; the tree does not imply containment.',
    kinds: ['product', 'domain', 'interface', 'experience', 'screen', 'capability', 'journey', 'rule']
  },
  {
    id: 'capability-reach',
    diagramType: 'Reach tree',
    name: 'Capability reach',
    question: 'Where is each Capability available, and which Business Rules attach to it?',
    note: 'Each Capability branches into the places its Contexts name and the Business Rules attached to it. A place is the most specific resource the Context resolves to. A Capability with neither is a leaf.',
    kinds: ['product', 'capability', 'interface', 'experience', 'screen', 'rule']
  },
  {
    id: 'journey-reach',
    diagramType: 'Reach tree',
    name: 'Journey reach',
    question: 'Where does each Journey take place, and which Business Rules attach to it?',
    note: 'Each Journey branches into the places its Scenarios\' Steps resolve to and the Business Rules attached to it. Places are derived from the Steps, so a Journey with no Capability-bearing Step names no place.',
    kinds: ['product', 'journey', 'interface', 'experience', 'screen', 'rule']
  },
  {
    id: 'rule-reach',
    diagramType: 'Reach tree',
    name: 'Rule reach',
    question: 'What is each Business Rule attached to, and where does it apply?',
    note: 'Each Business Rule branches into its authored attachment targets — Entities, Capabilities, Journeys and Scenarios — and the places its Contexts restrict it to. Derived Domains and inherited reach are excluded.',
    kinds: ['product', 'rule', 'entity', 'capability', 'journey', 'capability-scenario', 'journey-scenario', 'interface', 'experience', 'screen']
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
    id: 'what-it-keeps',
    diagramType: 'Entity relationship diagram',
    name: 'Entity relationships',
    question: 'What does the Product keep, and how do those things relate?',
    note: 'Each authored Entity relation is drawn once, from its declaring source to its target. Labels include both cardinalities: 1:N means one source to many targets. Disconnected Entities remain visible.',
    kinds: ['entity']
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
    id: 'rule-attachments',
    diagramType: 'Attachment matrix',
    name: 'Rule attachments',
    question: 'Where is each Business Rule explicitly attached?',
    note: 'Each cell is an authored Rule attachment. Details retain Entity operations, States, facts and Context restrictions. Derived Domains and inherited reach are excluded. An empty cell makes no permission or enforcement claim.',
    kinds: ['rule', 'entity', 'capability', 'journey', 'capability-scenario', 'journey-scenario', 'interface', 'experience', 'screen']
  },
  {
    id: 'what-changes-what',
    diagramType: 'Mutation matrix',
    name: 'What changes what',
    question: 'Which Capabilities create, change or remove each Entity?',
    note: 'Each row is an Entity; each column is a Capability. Capability and Journey Scenario Step effects are aggregated in their cells, showing creates, changes and removes with supporting Scenarios. Reads are excluded. An empty cell means no declared mutation.',
    kinds: ['entity', 'capability'],
  }
]

export const DEFAULT_PRODUCT_TOPOLOGY_VIEW: ProductTopologyViewId = 'domain-reach'

export function findProductTopologyView(id: ProductTopologyViewId): ProductTopologyView {
  return PRODUCT_TOPOLOGY_VIEWS.find(view => view.id === id) ?? PRODUCT_TOPOLOGY_VIEWS[0]!
}
