import type { VocabularySlug } from '../utils/vocabulary.generated'

/**
 * The one vocabulary panel, reachable from wherever a word is rendered.
 *
 * A term appears at every depth of the page — a heading, a fact label, a word
 * inside another term's definition — and all of them mean the same thing by
 * "show me this". Passing that up through every component between would make
 * each one carry a concern it has nothing to do with, so the panel's state is
 * shared instead and the shell simply renders it.
 */
export function useVocabularyPanel() {
  const open = useState('blr-vocabulary-open', () => false)
  const lookup = useState<{ slug: VocabularySlug } | null>('blr-vocabulary-lookup', () => null)

  /** Open the panel, on one term when the reader named one. */
  function show(slug?: VocabularySlug) {
    // A fresh request also navigates when the same word is followed again.
    lookup.value = slug ? { slug } : null
    open.value = true
  }

  return { open, lookup, show }
}
