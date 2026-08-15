/**
 * Three decisions left open, five options each.
 *
 * The Workbench structure is settled and the first round of auditions decided
 * three things:
 *
 * - the page is **tabbed**, and Detail, Connections and Also-on belong *in* the
 *   Overview rather than beside it — they are what an overview is for;
 * - the slideover shows **the same thing the page shows**, so a reader picks a
 *   container rather than learning two readings of one entity;
 * - a Scenario is read **inside its parent**, inline or split. A Scenario page
 *   was a level of navigation nobody asked for.
 *
 * What is left is how far to take each. Every option states what it costs,
 * because an audition where each option claims to be good at everything decides
 * nothing.
 */

export interface LabOption<Id extends string = string> {
  id: Id
  name: string
  premise: string
  cost: string
}

export interface LabAxis<Id extends string = string> {
  id: string
  name: string
  /** The decision this axis is still holding open. */
  question: string
  icon: string
  options: LabOption<Id>[]
}

export type PageVariantId = 'two' | 'three' | 'vertical' | 'disclosed' | 'dense'
export type PanelVariantId = 'narrow' | 'wide' | 'sheet' | 'sidetabs' | 'none'
export type ScenarioVariantId = 'inline' | 'split' | 'index' | 'tabs' | 'sequence'

export const PAGE_AXIS: LabAxis<PageVariantId> = {
  id: 'page',
  name: 'Page',
  question: 'How few tabs can the page get away with?',
  icon: 'i-lucide-layout',
  options: [
    {
      id: 'two',
      name: 'Two tabs',
      premise: 'Overview holds everything about the entity. Scenarios is the only other tab.',
      cost: 'The Overview is long for a Screen, which authors states, actions and information.'
    },
    {
      id: 'three',
      name: 'Detail apart',
      premise: 'Overview keeps identity and relations; the authored body gets its own tab.',
      cost: 'Splits the two things a reader most often wants side by side.'
    },
    {
      id: 'vertical',
      name: 'Side tabs',
      premise: 'The same tabs down the left, so their names stay visible while you read.',
      cost: 'Costs about 11rem of reading width on every page, tabbed or not.'
    },
    {
      id: 'disclosed',
      name: 'Disclosed',
      premise: 'One Overview, with relations and references as disclosures at its end.',
      cost: 'Back to one long scroll for anyone who wanted the connections.'
    },
    {
      id: 'dense',
      name: 'Two column',
      premise: 'Overview in two columns: the reading left, relations and scopes right.',
      cost: 'Needs width; below 1280px it stacks and reads like the two-tab option.'
    }
  ]
}

export const PANEL_AXIS: LabAxis<PanelVariantId> = {
  id: 'panel',
  name: 'Slideover',
  question: 'The same reading as the page — but in how much room?',
  icon: 'i-lucide-panel-right',
  options: [
    {
      id: 'narrow',
      name: 'Narrow',
      premise: '28rem. A glance beside the list you called it from.',
      cost: 'Tabs wrap, and the authored body reads in a column half the page width.'
    },
    {
      id: 'wide',
      name: 'Wide',
      premise: '44rem. Enough for steps and states to read as they do on the page.',
      cost: 'Covers most of the list, so the place you came from stops being visible.'
    },
    {
      id: 'sheet',
      name: 'Sheet',
      premise: 'Near full width. The page, with a close button instead of a back button.',
      cost: 'If it covers everything, it is a page — and pages already have URLs.'
    },
    {
      id: 'sidetabs',
      name: 'Side tabs',
      premise: '40rem with the tabs down the left edge, so no tab strip wraps.',
      cost: 'Two navigation columns on screen at once, counting the rail.'
    },
    {
      id: 'none',
      name: 'No slideover',
      premise: 'A row opens the page. One container, one reading, nothing to choose.',
      cost: 'Every glance costs the list you were scanning, and a trip back.'
    }
  ]
}

export const SCENARIO_AXIS: LabAxis<ScenarioVariantId> = {
  id: 'scenario',
  name: 'Scenarios',
  question: 'Read inside the parent — expanded, or beside a list?',
  icon: 'i-lucide-list-tree',
  options: [
    {
      id: 'inline',
      name: 'Inline',
      premise: 'Each Scenario expands where it is listed. One open at a time.',
      cost: 'The list is pushed down as you read, so the next Scenario moves.'
    },
    {
      id: 'split',
      name: 'Split',
      premise: 'A list on the left, the chosen Scenario on the right. The list never moves.',
      cost: 'The Scenario reads in a narrower column than the page it sits on.'
    },
    {
      id: 'index',
      name: 'Index',
      premise: 'A compact index above, the chosen Scenario at full width below it.',
      cost: 'Long Scenario lists push the reading below the fold.'
    },
    {
      id: 'tabs',
      name: 'Tabs',
      premise: 'Each Scenario is a tab. The set is visible; only one reads at a time.',
      cost: 'Ten Capability Scenarios make ten tabs, and tab strips do not scale.'
    },
    {
      id: 'sequence',
      name: 'Sequence',
      premise: 'Every Scenario rendered in order. Nothing to click, comparison is free.',
      cost: 'The longest option by far, and the parent’s own reading is above all of it.'
    }
  ]
}

export const LAB_AXES = [PAGE_AXIS, PANEL_AXIS, SCENARIO_AXIS]

export const LAB_DEFAULTS = {
  page: 'two' as PageVariantId,
  panel: 'wide' as PanelVariantId,
  scenario: 'split' as ScenarioVariantId
}
