/** Reference groups and previews keep their expansion per host/report/owner. */
export function useBlrReferenceExpansion(scope: Ref<string>, keys: Ref<string[]>, defaults: Ref<string[]>) {
  const choices = ref<Record<string, boolean>>({})
  const memory = useState<Record<string, Record<string, boolean>>>('blr:reference-expansion', () => ({}))
  let mounted = false
  let currentKey = ''
  function restore() {
    currentKey = `blr:references:${location.pathname}:${scope.value}`
    let saved: unknown = memory.value[currentKey]
    if (saved === undefined) {
      try { saved = JSON.parse(sessionStorage.getItem(currentKey) ?? 'null') } catch { /* Optional persistence. */ }
    }
    choices.value = saved && typeof saved === 'object' && !Array.isArray(saved)
      ? Object.fromEntries(Object.entries(saved).filter(([key, value]) => keys.value.includes(key) && typeof value === 'boolean'))
      : {}
  }
  // Newly added groups still open by default after a report recompile.
  const open = computed({
    get: () => keys.value.filter(key => choices.value[key] ?? defaults.value.includes(key)),
    set: (values: string[]) => {
      choices.value = Object.fromEntries(keys.value.map(key => [key, values.includes(key)]))
      if (!mounted) return
      memory.value[currentKey] = { ...choices.value }
      try { sessionStorage.setItem(currentKey, JSON.stringify(choices.value)) } catch { /* Optional persistence. */ }
    }
  })
  // Restore before the host restores this reading's scroll position.
  onMounted(() => { mounted = true; restore() })
  watch(scope, () => { if (mounted) restore() })
  return open
}
