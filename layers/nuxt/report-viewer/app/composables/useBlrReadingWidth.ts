export function useBlrReadingWidth() {
  const element = ref<HTMLElement>()
  const width = ref(1024)
  let observer: ResizeObserver | undefined
  onMounted(() => {
    observer = new ResizeObserver(entries => { width.value = entries[0]?.contentRect.width ?? width.value })
    if (element.value) observer.observe(element.value)
  })
  onBeforeUnmount(() => observer?.disconnect())
  return { element, width }
}
