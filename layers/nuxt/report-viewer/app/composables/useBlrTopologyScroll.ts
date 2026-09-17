/** Per-reading anchors, kept outside the Product Model and isolated by report/host. */
export function useBlrTopologyScroll(key: Ref<string>) {
  const element = ref<HTMLElement>()
  let currentKey = key.value
  let mounted = false
  let restoring = false
  let restoration = 0
  const memory = new Map<string, string>()
  const storageKey = (value: string) => `businesslens:topology:${location.pathname}:${value}`
  function save() {
    if (!mounted || restoring || !element.value || element.value.querySelector('[data-diagram-pending="true"]')) return
    const pane = element.value
    const top = pane.getBoundingClientRect().top
    const anchors = [...pane.querySelectorAll<HTMLElement>('[data-occurrence-id], [data-group-id], [data-resource-key]')]
    const anchor = anchors.find(item => item.getBoundingClientRect().top >= top)
    const anchorKey = (item: HTMLElement) => item.dataset.occurrenceId ?? item.dataset.groupId ?? item.dataset.resourceKey
    const value = JSON.stringify({ top: pane.scrollTop, left: pane.scrollLeft,
      anchor: anchor?.dataset.occurrenceId ?? anchor?.dataset.groupId ?? anchor?.dataset.resourceKey,
      // The same Entity can occur on several Steps. Restore the occurrence we
      // left, rather than jumping to its first mention earlier in the Scenario.
      occurrence: anchor ? anchors.filter(item => anchorKey(item) === anchorKey(anchor)).indexOf(anchor) : 0,
      offset: anchor ? anchor.getBoundingClientRect().top - top : 0,
      nested: [...pane.querySelectorAll<HTMLElement>('.blr-diagram-scroll')].map(item => ({ top: item.scrollTop, left: item.scrollLeft })) })
    memory.set(currentKey, value)
    try { sessionStorage.setItem(storageKey(currentKey), value) } catch { /* Private storage may be unavailable. */ }
  }
  async function restore() {
    if (!mounted) return
    const attempt = ++restoration
    restoring = true
    await nextTick()
    await document.fonts.ready
    if (attempt !== restoration || !mounted) return
    if (!element.value) { restoring = false; return }
    // ELK finishes after the first paint. Keep the saved viewport until its ready event.
    if (element.value.querySelector('[data-diagram-pending="true"]')) return
    try {
      const raw = memory.get(currentKey) ?? sessionStorage.getItem(storageKey(currentKey))
      const value = raw ? JSON.parse(raw) : null
      const pane = element.value
      pane.scrollTop = value?.top ?? 0
      pane.scrollLeft = value?.left ?? 0
      if (value?.anchor) {
        const anchor = [...pane.querySelectorAll<HTMLElement>('[data-occurrence-id], [data-group-id], [data-resource-key]')].filter(item => (item.dataset.occurrenceId ?? item.dataset.groupId ?? item.dataset.resourceKey) === value.anchor)[value.occurrence ?? 0]
        if (anchor) pane.scrollTop += anchor.getBoundingClientRect().top - pane.getBoundingClientRect().top - value.offset
      }
      pane.querySelectorAll<HTMLElement>('.blr-diagram-scroll').forEach((item, index) => {
        item.scrollTop = value?.nested?.[index]?.top ?? 0
        item.scrollLeft = value?.nested?.[index]?.left ?? Number(item.dataset.initialScrollLeft ?? 0)
      })
    } catch { /* Malformed or denied storage does not prevent reading. */ }
    await nextTick()
    requestAnimationFrame(() => { if (attempt === restoration) restoring = false })
  }
  watch(key, next => { save(); currentKey = next; void restore() }, { flush: 'pre' })
  onMounted(() => { mounted = true; void restore() })
  onBeforeUnmount(() => { save(); mounted = false; restoration++ })
  function hasSaved() {
    if (memory.has(key.value)) return true
    if (!import.meta.client) return false
    try { return Boolean(sessionStorage.getItem(storageKey(key.value))) } catch { return false }
  }
  return { element, save, restore, hasSaved }
}
