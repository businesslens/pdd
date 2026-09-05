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
import { VOCABULARY, type VocabularyEntry, type VocabularySlug } from './vocabulary.generated'
import { DOCS_ORIGIN } from './resourceDocs'
import type { ReportResourceKind, ReportScenarioType } from './reportWorkspace'

export interface VocabularyItem extends VocabularyEntry {
  slug: VocabularySlug
  href: string
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
 * definition reads identically in the documentation and in the report and no
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
export function termHref(slug: VocabularySlug): string {
  const entry = VOCABULARY[slug]
  return `${DOCS_ORIGIN}/${entry.page}${entry.anchor ? `#${entry.anchor}` : ''}`
}

export function termItem(slug: VocabularySlug): VocabularyItem {
  return { ...VOCABULARY[slug], slug, href: termHref(slug) }
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

export interface VocabularySection {
  /** Browse by docs cluster; a search reads as one ranked list. */
  group: string
  items: VocabularyItem[]
}

/**
 * Browse in documentation order. Search by name first, then by meaning.
 *
 * The panel searches the definition as well as the word: a reader who half
 * remembers "the thing that says who may" should land on Who may.
 */
export function vocabularySections(query = ''): VocabularySection[] {
  const needle = query.trim().toLowerCase()
  if (needle) {
    const rank = (item: VocabularyItem) => {
      const name = item.term.toLowerCase()
      if (name === needle) return 0
      if (name.includes(needle)) return 1
      return item.definition.toLowerCase().includes(needle) ? 2 : 3
    }
    // Stable sorting retains documentation order for equally relevant terms,
    // including names with distinct Scenario owners. Do not regroup afterward:
    // a definition in another docs group must not jump ahead of an exact name.
    const items = VOCABULARY_ITEMS.filter(item => rank(item) < 3)
      .sort((a, b) => rank(a) - rank(b))
    return items.length ? [{ group: 'Search results', items }] : []
  }
  const sections: VocabularySection[] = []
  for (const item of VOCABULARY_ITEMS) {
    let section = sections.find(candidate => candidate.group === item.group)
    if (!section) {
      section = { group: item.group, items: [] }
      sections.push(section)
    }
    section.items.push(item)
  }
  return sections
}
