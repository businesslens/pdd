/**
 * Three things to decide, five ways each — and nothing else changes.
 *
 * The Workbench structure is settled: a flat rail, collections that open
 * grouped, a peek from a list, a page for the reading. What is not settled is
 * how three specific parts of it *look*, and those are hard to judge from an
 * argument. So each axis varies alone, over the same model, inside the same
 * application, and the other two hold still while you look.
 *
 * Every option states what it costs. An audition where each option claims to be
 * good at everything decides nothing.
 */

export interface LabOption<Id extends string = string> {
  id: Id
  name: string
  /** What this option is trying to do. */
  premise: string
  /** What it gives up to do it. */
  cost: string
}

export interface LabAxis<Id extends string = string> {
  id: string
  name: string
  /** The complaint this axis exists to answer. */
  problem: string
  icon: string
  options: LabOption<Id>[]
}

export type PeekVariantId = 'zones' | 'prose' | 'spec' | 'map' | 'bars'
export type PageVariantId = 'scroll' | 'tabs' | 'split' | 'anchored' | 'accordion'
export type ChildVariantId = 'cards' | 'stepper' | 'inline' | 'split' | 'rail'

export const PEEK_AXIS: LabAxis<PeekVariantId> = {
  id: 'peek',
  name: 'Peek',
  problem: 'The slideover is hard to read.',
  icon: 'i-lucide-panel-right',
  options: [
    {
      id: 'zones',
      name: 'Zones',
      premise: 'Identity, a sentence, three facts, then what it connects to, as chips.',
      cost: 'Many small objects of similar weight; long relation labels crowd the chips.'
    },
    {
      id: 'prose',
      name: 'Prose',
      premise: 'The entity described in two sentences, with only the names as links.',
      cost: 'Counts are harder to compare; a long sentence hides its own structure.'
    },
    {
      id: 'spec',
      name: 'Spec sheet',
      premise: 'One aligned two-column table. Every fact and relation on its own row.',
      cost: 'Reads as data, not meaning; nothing is emphasised over anything else.'
    },
    {
      id: 'map',
      name: 'Map',
      premise: 'A small diagram of the entity and one hop, with the text minimal.',
      cost: 'A diagram at panel width holds few names; the lead has to shrink.'
    },
    {
      id: 'bars',
      name: 'Bars',
      premise: 'Relations as bars sized by count — the shape of an entity before its words.',
      cost: 'Bars imply comparability across kinds that may not be comparable.'
    }
  ]
}

export const PAGE_AXIS: LabAxis<PageVariantId> = {
  id: 'page',
  name: 'Page',
  problem: 'The drilldown page is too occupied.',
  icon: 'i-lucide-layout',
  options: [
    {
      id: 'scroll',
      name: 'One scroll',
      premise: 'Every section stacked in a fixed order. Nothing hidden, nothing to learn.',
      cost: 'Long. What you came for may be three screens down with no way to tell.'
    },
    {
      id: 'tabs',
      name: 'Tabs',
      premise: 'Overview, the authored detail, children, and connections as named tabs.',
      cost: 'You cannot see two tabs at once, and a tab can hide that it is empty.'
    },
    {
      id: 'split',
      name: 'Split',
      premise: 'The reading on the left; facts, connections and children stay on the right.',
      cost: 'Needs width. Below about 1200px it collapses back into one column.'
    },
    {
      id: 'anchored',
      name: 'Anchored',
      premise: 'One scroll, with a contents rail that says where you are and what is left.',
      cost: 'Still a long page; the rail costs width and adds a second thing to track.'
    },
    {
      id: 'accordion',
      name: 'Accordion',
      premise: 'Sections collapsed with their counts. Open only what you came for.',
      cost: 'Every reading starts with a click; comparing two sections means two clicks.'
    }
  ]
}

export const CHILD_AXIS: LabAxis<ChildVariantId> = {
  id: 'child',
  name: 'Scenarios',
  problem: 'Moving between a Capability or Journey and its Scenarios is hard.',
  icon: 'i-lucide-list-tree',
  options: [
    {
      id: 'cards',
      name: 'Cards',
      premise: 'Children listed on the parent page; each opens its own page.',
      cost: 'Reading two Scenarios means leaving and returning twice.'
    },
    {
      id: 'stepper',
      name: 'Stepper',
      premise: 'A child page knows its siblings: previous, next, and its position.',
      cost: 'Order becomes meaningful even where the model does not intend it to be.'
    },
    {
      id: 'inline',
      name: 'Inline',
      premise: 'Children expand where they are listed. A Scenario needs no page at all.',
      cost: 'A parent page with every Scenario open is longer than the page it replaced.'
    },
    {
      id: 'split',
      name: 'Split',
      premise: 'The parent page becomes a list on the left and one Scenario on the right.',
      cost: 'The parent’s own reading is pushed above or behind the split.'
    },
    {
      id: 'rail',
      name: 'Sibling rail',
      premise: 'A child page carries a rail of its siblings, so moving never leaves.',
      cost: 'A second rail beside the first; two levels of navigation on one screen.'
    }
  ]
}

export const LAB_AXES = [PEEK_AXIS, PAGE_AXIS, CHILD_AXIS]

export const LAB_DEFAULTS = {
  peek: 'zones' as PeekVariantId,
  page: 'scroll' as PageVariantId,
  child: 'cards' as ChildVariantId
}
