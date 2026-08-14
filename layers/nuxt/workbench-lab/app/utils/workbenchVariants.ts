/**
 * Five ways to read one Product Model.
 *
 * The shipped Workbench answers "show me a collection, then one thing in it".
 * That is one answer, and it was reached by argument rather than by comparison.
 * These four alternatives each start from a different premise about what a
 * Product Model *is*, and each is complete enough to actually be used — a
 * sketch that cannot be navigated proves nothing.
 *
 * Every variation renders the same projection and the same entity primitives.
 * What differs is the organizing idea: what the primary axis is, what a click
 * means, and where depth goes. Nothing here changes the model, the report, or
 * what any entity means.
 *
 * This is the theme lab's pattern applied one level up. Auditions live in a lab
 * layer, behind a cookie, extended only by the local viewer — never by the
 * shipped package.
 */

export type WorkbenchVariantId = 'workbench' | 'atlas' | 'storyline' | 'ledger' | 'columns'

export interface WorkbenchVariant {
  id: WorkbenchVariantId
  name: string
  icon: string
  /** The premise: what this variation assumes a Product Model is. */
  premise: string
  /** What the reader does first, and what a click means. */
  gesture: string
  /** What it is likely to be bad at — stated so the audition is honest. */
  cost: string
}

export const WORKBENCH_VARIANTS: WorkbenchVariant[] = [
  {
    id: 'workbench',
    name: 'Workbench',
    icon: 'i-lucide-panels-top-left',
    premise: 'A model is ten collections, each with a containment worth grouping by.',
    gesture: 'Pick a collection, scan rows, peek to confirm, open the page to read.',
    cost: 'Cross-kind questions need the Topology destination; the rail is always a decision.'
  },
  {
    id: 'atlas',
    name: 'Atlas',
    icon: 'i-lucide-map',
    premise: 'A model is a territory. Position and adjacency carry the meaning.',
    gesture: 'Pan and zoom one map; toggle kinds as layers; select a box to read it beside the map.',
    cost: 'Reading long authored bodies on a canvas; finding an entity you cannot already see.'
  },
  {
    id: 'storyline',
    name: 'Storyline',
    icon: 'i-lucide-git-commit-horizontal',
    premise: 'A model is a set of promises unfolding in time.',
    gesture: 'Read a Journey left to right; its Scenarios are variant tracks below it.',
    cost: 'Everything not on a Journey — an unused Capability, a Screen nothing routes to.'
  },
  {
    id: 'ledger',
    name: 'Ledger',
    icon: 'i-lucide-table-2',
    premise: 'A model is a dataset. Every entity is a row; kind is just a column.',
    gesture: 'Type a query, sort, expand a row in place. Arrow keys move, Enter expands.',
    cost: 'Narrative and shape. A table cannot show you what a Journey feels like.'
  },
  {
    id: 'columns',
    name: 'Columns',
    icon: 'i-lucide-columns-3',
    premise: 'A model is three trees, and a tree is best walked one level at a time.',
    gesture: 'Pick an axis, then drill left to right. The last column is the reading.',
    cost: 'Entities with several parents appear in several paths; horizontal space runs out.'
  }
]

export const DEFAULT_WORKBENCH_VARIANT: WorkbenchVariantId = 'workbench'

export function findWorkbenchVariant(id: string | undefined): WorkbenchVariant {
  return WORKBENCH_VARIANTS.find(variant => variant.id === id)
    ?? WORKBENCH_VARIANTS[0]!
}
