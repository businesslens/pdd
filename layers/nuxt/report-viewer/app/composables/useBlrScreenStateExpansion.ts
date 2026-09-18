/** View-state descriptions start closed and remember expansion per host/report/Screen. */
export function useBlrScreenStateExpansion(scope: Ref<string>, keys: Ref<string[]>) {
  const open = ref<string[]>([])
  const memory = useState<Record<string, string[]>>('blr:screen-state-expansion', () => ({}))
  let mounted = false
  let currentKey = ''
  const valid = (value: unknown): string[] => Array.isArray(value)
    ? [...new Set(value.filter((key): key is string => typeof key === 'string' && keys.value.includes(key)))]
    : []

  function restore() {
    currentKey = `blr:screen-states:${location.pathname}:${scope.value}`
    let saved: unknown = memory.value[currentKey]
    if (saved === undefined) {
      try { saved = JSON.parse(sessionStorage.getItem(currentKey) ?? 'null') } catch { /* Optional persistence. */ }
    }
    open.value = valid(saved)
  }
  // Hydrate first, then restore before the host restores the reading's scroll.
  onMounted(() => { mounted = true; restore() })
  watch(open, value => {
    if (!mounted) return
    memory.value[currentKey] = [...value]
    try { sessionStorage.setItem(currentKey, JSON.stringify(value)) } catch { /* Reading works without storage. */ }
  }, { flush: 'sync' })
  watch([scope, keys], ([nextScope], [previousScope]) => {
    if (mounted && nextScope !== previousScope) restore()
    else open.value = valid(open.value)
  })
  return open
}
