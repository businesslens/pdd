/** Scenario expansion survives page changes and reloads, per host/report/parent. */
export function useBlrScenarioExpansion(scope: Ref<string>, keys: Ref<string[]>, selected: Ref<string | null>) {
  const open = ref<string[]>([])
  // Nuxt scopes this memory to the app/request; it also works when storage is denied.
  const memory = useState<Record<string, string[]>>('blr:scenario-expansion', () => ({}))
  let mounted = false
  let currentKey = ''
  const storageKey = () => `blr:scenarios:${location.pathname}:${scope.value}`
  const valid = (value: unknown): string[] => Array.isArray(value)
    ? [...new Set(value.filter((key): key is string => typeof key === 'string' && keys.value.includes(key)))]
    : []
  const includeSelected = (value: string[]) => selected.value && keys.value.includes(selected.value)
    ? [...new Set([...value, selected.value])]
    : value

  function save() {
    if (!mounted) return
    memory.value[currentKey] = [...open.value]
    try { sessionStorage.setItem(currentKey, JSON.stringify(open.value)) } catch { /* Optional persistence. */ }
  }
  function restore() {
    currentKey = storageKey()
    let saved: unknown = memory.value[currentKey]
    if (saved === undefined) {
      try { saved = JSON.parse(sessionStorage.getItem(currentKey) ?? 'null') } catch { /* Start closed if storage is malformed or denied. */ }
    }
    open.value = includeSelected(valid(saved))
  }

  // Restore after hydration, before the host restores this reading's scroll.
  onMounted(() => { mounted = true; restore() })
  watch(open, save, { flush: 'sync' })
  watch([scope, keys, selected], ([nextScope, , nextSelected], previous) => {
    if (mounted && nextScope !== previous[0]) { restore(); return }
    const next = valid(open.value)
    open.value = !previous.length || nextSelected !== previous[2] ? includeSelected(next) : next
  }, { immediate: true })
  return open
}
