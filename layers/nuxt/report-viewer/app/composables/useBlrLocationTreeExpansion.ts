/**
 * Expansion for a location tree read through filters and a search, shared by
 * Coverage and the References catalog.
 *
 * Two axes share one remembered set: folders, keyed by their path, and the
 * explanation behind a location, keyed apart from it. Folders of the whole tree
 * are open by default and explanations wait to be asked for.
 *
 * A filter or search only narrows what is drawn. What it hides keeps its own
 * state — the defaults come from the whole tree, and Expand all and Collapse all
 * change only what is on screen — so clearing a filter restores what the reader
 * had. A search reveals the locations it matched by opening every folder above
 * them without rewriting that remembered set: a folder put away during a search
 * stays away until the search changes.
 */
export function useBlrLocationTreeExpansion(options: {
  scope: Ref<string>
  /** Every folder and explanation key the unfiltered tree can hold. */
  keys: Ref<string[]>
  /** Folders of the unfiltered tree, open unless the reader closed them. */
  defaults: Ref<string[]>
  /** Folders of the tree as currently narrowed. */
  branches: Ref<string[]>
  /** Explanation keys of the tree as currently narrowed. */
  readable: Ref<string[]>
  query: Ref<string>
}) {
  const expansion = useBlrReferenceExpansion(options.scope, options.keys, options.defaults)
  const searching = computed(() => Boolean(options.query.value.trim()))
  const revealed = computed(() => searching.value ? options.branches.value : [])
  const dismissed = ref<string[]>([])
  watch(options.query, () => { dismissed.value = [] })

  const expanded = computed(() => searching.value
    ? [...new Set([...expansion.value, ...revealed.value])].filter(key => !dismissed.value.includes(key))
    : expansion.value)

  function toggle(key: string) {
    if (revealed.value.includes(key)) {
      dismissed.value = dismissed.value.includes(key)
        ? dismissed.value.filter(value => value !== key)
        : [...dismissed.value, key]
      return
    }
    expansion.value = expansion.value.includes(key)
      ? expansion.value.filter(value => value !== key)
      : [...expansion.value, key]
  }

  function expandAll(open: boolean) {
    const visible = new Set([...options.branches.value, ...options.readable.value])
    expansion.value = open
      ? [...new Set([...expansion.value, ...visible])]
      : expansion.value.filter(key => !visible.has(key))
    dismissed.value = open ? [] : revealed.value
  }

  return { expansion, expanded, toggle, expandAll }
}
