/**
 * The report designs currently on audition.
 *
 * Each entry is a *different answer to the same question* — how should a whole
 * Product Model be read? — not a restyling of one answer. They are kept side by
 * side so the choice is made by looking, and deleted once one wins.
 *
 * This generation starts from the conclusions in REPORT-VISUALIZATION-BRIEF.md:
 * purpose-built views over one shared model, contextual topology instead of a
 * universal graph, and complete entity content behind progressive disclosure.
 * Every design renders the full workspace; they differ in which question they
 * put first and how a reader moves from overview to one entity.
 */

export type ReportWidth = 'page' | 'wide' | 'full'

export interface ReportDesign {
  id: string
  name: string
  /** One line, shown on the audition chip. */
  tagline: string
  /** What this design optimises for, and what it gives up to get it. */
  approach: string
  icon: string
  /** The width the design was drawn for; the lab can override it. */
  width: ReportWidth
  /**
   * True when the design owns the viewport and scrolls internally — an app
   * surface rather than a document.
   */
  fills: boolean
  /** Component name resolved from the layer's auto-imported components. */
  component: string
}

export const SHIPPED_DESIGN_ID = 'shipped'

export const REPORT_DESIGNS: ReportDesign[] = [
  {
    id: SHIPPED_DESIGN_ID,
    name: 'Shipped',
    tagline: 'The current three-tab report',
    approach: 'Today’s baseline: five entity kinds, titles only, one measured column.',
    icon: 'i-lucide-file-text',
    width: 'page',
    fills: false,
    component: 'BusinessLensReportViewer'
  },
  {
    id: 'meridian',
    name: 'Meridian',
    tagline: 'Sectioned report app — one section per Product question',
    approach: 'The reference answer to the brief: a section rail, an overview and a list per section, and topology one tab inside the selected entity.',
    icon: 'i-lucide-layout-list',
    width: 'full',
    fills: true,
    component: 'BlrMeridian'
  },
  {
    id: 'inquiry',
    name: 'Inquiry',
    tagline: 'Product questions are the navigation',
    approach: 'The home is the questions themselves; each opens the one view built to answer it, and the question stays visible as the breadcrumb.',
    icon: 'i-lucide-circle-help',
    width: 'full',
    fills: true,
    component: 'BlrInquiry'
  },
  {
    id: 'canvas',
    name: 'Canvas',
    tagline: 'Scene-based topology with a docked inspector',
    approach: 'The most graph-forward take the brief allows: scoped scenes instead of one universal graph, expansion only on request.',
    icon: 'i-lucide-workflow',
    width: 'full',
    fills: true,
    component: 'BlrCanvas'
  },
  {
    id: 'tripane',
    name: 'Tripane',
    tagline: 'Nav, working view and inspector always on screen',
    approach: 'An IDE for the Product Model: selection never navigates away, and the inspector always carries the local topology.',
    icon: 'i-lucide-columns-3',
    width: 'full',
    fills: true,
    component: 'BlrTripane'
  },
  {
    id: 'narrative',
    name: 'Narrative',
    tagline: 'One scrolling story from access to constraints',
    approach: 'Reads front to back like a briefing: each chapter opens with its overview visual and unfolds entity detail inline.',
    icon: 'i-lucide-scroll-text',
    width: 'wide',
    fills: false,
    component: 'BlrNarrative'
  },
  {
    id: 'promises',
    name: 'Promises',
    tagline: 'Journeys first; everything else is their context',
    approach: 'Journey cards are the home. Screens, Capabilities and Rules are reached through the promise they serve.',
    icon: 'i-lucide-heart-handshake',
    width: 'full',
    fills: true,
    component: 'BlrPromises'
  },
  {
    id: 'gateway',
    name: 'Gateway',
    tagline: 'The Screen map is the front door',
    approach: 'Access contexts first: Interfaces are columns, Experiences are floors, and selecting a context scopes every other view.',
    icon: 'i-lucide-door-open',
    width: 'full',
    fills: true,
    component: 'BlrGateway'
  },
  {
    id: 'crossgrid',
    name: 'Crossgrid',
    tagline: 'Named matrices are the spine of the report',
    approach: 'Each matrix answers one written question; a cell explains its relationship, and topology appears per selected row.',
    icon: 'i-lucide-grid-3x3',
    width: 'full',
    fills: true,
    component: 'BlrCrossgrid'
  },
  {
    id: 'beacon',
    name: 'Beacon',
    tagline: 'Search-first explorer over the whole model',
    approach: 'An omnibox and a filterable index reach any entity in two keystrokes; views are tabs above a full-content detail canvas.',
    icon: 'i-lucide-search',
    width: 'full',
    fills: true,
    component: 'BlrBeacon'
  },
  {
    id: 'panorama',
    name: 'Panorama',
    tagline: 'A wall of live view tiles, each expandable',
    approach: 'Every purpose-built view is a tile showing its real shape; one click makes it the whole surface. Built for mixing and matching.',
    icon: 'i-lucide-layout-dashboard',
    width: 'full',
    fills: true,
    component: 'BlrPanorama'
  }
]

export const DEFAULT_REPORT_DESIGN = 'meridian'

export function findReportDesign(id: string | null | undefined): ReportDesign {
  return REPORT_DESIGNS.find(design => design.id === id)
    ?? REPORT_DESIGNS.find(design => design.id === DEFAULT_REPORT_DESIGN)!
}

export const REPORT_WIDTHS: Array<{ id: ReportWidth | 'auto', label: string, hint: string }> = [
  { id: 'auto', label: 'Auto', hint: 'Whatever the design was drawn for' },
  { id: 'page', label: 'Page', hint: 'One measured column' },
  { id: 'wide', label: 'Wide', hint: 'Broad, still bounded' },
  { id: 'full', label: 'Full', hint: 'Edge to edge' }
]

export const WIDTH_CLASS: Record<ReportWidth, string> = {
  page: 'mx-auto w-full max-w-5xl px-4 sm:px-6',
  wide: 'mx-auto w-full max-w-[112rem] px-4 sm:px-8',
  full: 'w-full px-4 sm:px-6 lg:px-8'
}
