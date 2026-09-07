/**
 * The report's vocabulary, as the popovers and panel need it.
 *
 * The definitions themselves are generated from the `terms:` frontmatter of the
 * docs page that owns each word, so nothing here restates a meaning: this file
 * only decides how the report addresses them. A word explained on two pages —
 * Trigger belongs to both Scenario types — carries the owner in its slug, and
 * the surface picks the one it is actually rendering.
 *
 * Every popover and panel row links out to the owning page. The
 * one line is what a reader stuck mid-sentence needs; the page is what a reader
 * who wants the argument needs, and the report is not that page.
 */
import { VOCABULARY, VOCABULARY_LEADS, type VocabularyEntry, type VocabularySlug } from './vocabulary.generated'
import { DOCS_ORIGIN } from './resourceDocs'
import type { ReportResourceKind, ReportScenarioType } from './reportWorkspace'

export interface VocabularyItem extends VocabularyEntry {
  slug: VocabularySlug
}

const SLUGS = Object.keys(VOCABULARY) as VocabularySlug[]

/** One term, by slug. The generated module stays the single source of them. */
export function vocabularyTerm(slug: VocabularySlug): VocabularyEntry {
  return VOCABULARY[slug]
}

/**
 * A definition split into plain runs and the words that point at other terms.
 *
 * Which words those are is decided once, when the vocabulary is generated, so a
 * definition reads identically in the popover and panel and no
 * surface gets to have an opinion about what a sentence meant.
 */
export interface DefinitionSegment {
  text: string
  /** Present when this run is a word the reader can follow. */
  slug?: VocabularySlug
}

export function definitionSegments(slug: VocabularySlug): DefinitionSegment[] {
  const entry: VocabularyEntry = VOCABULARY[slug]
  const segments: DefinitionSegment[] = []
  let at = 0
  for (const [from, to, target] of entry.mentions) {
    if (from > at) segments.push({ text: entry.definition.slice(at, from) })
    segments.push({ text: entry.definition.slice(from, to), slug: target as VocabularySlug })
    at = to
  }
  if (at < entry.definition.length) segments.push({ text: entry.definition.slice(at) })
  return segments
}

/** The page that explains the term in full, at the heading that does it. */
export function termHref(slug: VocabularySlug, base = DOCS_ORIGIN): string {
  const entry = VOCABULARY[slug]
  return `${base.replace(/\/$/, '')}/${entry.page}${entry.anchor ? `#${entry.anchor}` : ''}`
}

/** A docs host supplies its page basename; pages without terms start at Product. */
export function vocabularyPageContext(page: string): VocabularySlug {
  return Object.hasOwn(VOCABULARY_LEADS, page) ? VOCABULARY_LEADS[page]! : 'product'
}

export function termItem(slug: VocabularySlug): VocabularyItem {
  return { ...VOCABULARY[slug], slug }
}

export const VOCABULARY_ITEMS: VocabularyItem[] = SLUGS.map(termItem)

/**
 * The word for a resource type, which the rail and every collection show before
 * a reader has read anything at all.
 *
 * Typed against both sides on purpose: a new resource kind cannot ship without
 * a term, and a term renamed out of the docs stops compiling here rather than
 * rendering an empty popover.
 */
export const KIND_TERM: Record<ReportResourceKind, VocabularySlug> = {
  product: 'product',
  interface: 'interface',
  experience: 'experience',
  screen: 'screen',
  domain: 'domain',
  entity: 'entity',
  capability: 'capability',
  journey: 'journey',
  'capability-scenario': 'capability-scenario',
  'journey-scenario': 'journey-scenario',
  rule: 'business-rule'
}

/** A Scenario's own words, chosen by the type of Scenario being read. */
export function scenarioTerm(
  scenarioType: ReportScenarioType,
  word: 'trigger' | 'outcome' | 'route' | 'decision-point' | 'edge-case'
): VocabularySlug {
  return `${scenarioType}-scenario-${word}`
}

export interface VocabularyPage {
  page: string
  title: string
  /**
   * The term the section is named for. The section head states it; no row inside
   * the section repeats it.
   */
  lead: VocabularyItem
  /** The section's remaining words, in documentation order. */
  items: VocabularyItem[]
}

/** Browsing groups model-wide terms under Product; documentation links keep their owner. */
export function vocabularySection(slug: VocabularySlug): string {
  const page = VOCABULARY[slug].page
  return page === 'product-model' ? 'product' : page
}

/**
 * Browsing follows documentation order, with Model overview folded into Product.
 * Product leads that combined section; all other sections retain their page lead.
 *
 * Search does not group. A reader who typed a word wants that word ranked, so
 * the flat list keeps every term as a row, leads included.
 */
export const VOCABULARY_PAGES: VocabularyPage[] = [...new Set(VOCABULARY_ITEMS.map(item => vocabularySection(item.slug)))]
  .map((page) => {
    const lead = VOCABULARY_LEADS[page]!
    return {
      page,
      title: VOCABULARY[lead].pageTitle,
      lead: termItem(lead),
      items: VOCABULARY_ITEMS.filter(item => vocabularySection(item.slug) === page && item.slug !== lead)
    }
  })

/**
 * Browse in documentation order. Search by name or alias first, then by meaning.
 *
 * The panel searches the definition as well as the word: a reader who half
 * remembers "the thing that says who may" should land on Who may.
 */
export function vocabularyMatches(query = ''): VocabularyItem[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return VOCABULARY_ITEMS
  const rank = (item: VocabularyItem) => {
    const names = item.searchNames.map(name => name.toLowerCase())
    if (names.includes(needle)) return 0
    if (names.some(name => name.includes(needle))) return 1
    return item.definition.toLowerCase().includes(needle) ? 2 : 3
  }
  // Stable sorting retains documentation order for equally relevant terms,
  // including names with distinct Scenario owners. Search stays ranked rather
  // than regrouping a definition ahead of an exact name on another page.
  return VOCABULARY_ITEMS.filter(item => rank(item) < 3)
    .sort((a, b) => rank(a) - rank(b))
}
