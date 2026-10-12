import { catalogQueryFilters } from '~/utils/blueprintCatalog'

/** How long typing settles before the search is written into the URL. */
const SEARCH_URL_DELAY = 300

/**
 * The catalog's search and category filter.
 *
 * Search and category live in the URL — `?q=` and `?category=` — so a filtered
 * listing survives a reload, a trip to a record and back, and a shared link. The
 * server reads them too, which keeps the response deterministic for its URL and
 * still identical for every viewer: nothing here depends on who is asking.
 *
 * The URL is written with `replace`, not `push`. Each keystroke or chip is a
 * refinement of one visit, and a back button that steps through them one letter
 * at a time is a back button that does not leave the page.
 */
export function useCatalogFilters() {
  const route = useRoute()
  const router = useRouter()

  const path = route.path
  const initial = catalogQueryFilters(route.query)
  const search = ref(initial.search)
  const category = ref<string | undefined>(initial.category)

  // What this composable last wrote, so its own navigation is not read back as
  // a new URL. Without it, a letter typed while the previous write was still
  // resolving would be overwritten by the older search.
  let written: string | undefined

  function writeQuery() {
    // A debounced search can land after the reader has already opened a record.
    if (route.path !== path) return
    const { q: _q, category: _category, ...rest } = route.query
    const filters = {
      ...(search.value.trim() ? { q: search.value } : {}),
      ...(category.value ? { category: category.value } : {})
    }
    const current = catalogQueryFilters(route.query)
    if (current.search === (filters.q ?? '') && current.category === filters.category) return
    written = JSON.stringify(filters)
    void router.replace({ query: { ...rest, ...filters } })
  }

  watchDebounced(search, writeQuery, { debounce: SEARCH_URL_DELAY })
  watch(category, writeQuery)

  // Back, forward, and a link to a filtered listing all arrive through the URL.
  // Leaving for a record changes the query too; that one is not ours to read.
  watch(() => route.query, (query) => {
    if (route.path !== path) return
    const next = catalogQueryFilters(query)
    const own = JSON.stringify({
      ...(next.search.trim() ? { q: next.search } : {}),
      ...(next.category ? { category: next.category } : {})
    })
    if (own === written) {
      written = undefined
      return
    }
    if (next.search !== search.value) search.value = next.search
    if (next.category !== category.value) category.value = next.category
  })

  function clear() {
    search.value = ''
    category.value = undefined
    // Written now rather than after the search debounce, so the cleared URL and
    // the cleared listing arrive together.
    writeQuery()
  }

  return { search, category, clear }
}
