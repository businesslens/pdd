<script setup lang="ts">
/** One transparent reading switch, with optional controls for the active set. */
const props = defineProps<{
  items: { id: string, label: string, count?: number, changed?: boolean }[]
  label: string
}>()
const model = defineModel<string>({ required: true })
const tabs = useTemplateRef('tabs')
let resize: ResizeObserver | undefined
const tabList = () => tabs.value?.querySelector<HTMLElement>('[role="tablist"]')

/** Scroll only the strip, so revealing a tab never moves the reading behind it. */
function revealActive() {
  const list = tabList()
  const active = list?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
  if (!list || !active) return
  const bounds = list.getBoundingClientRect()
  const target = active.getBoundingClientRect()
  if (target.left < bounds.left) list.scrollLeft += target.left - bounds.left
  else if (target.right > bounds.right) list.scrollLeft += target.right - bounds.right
}

watch([model, () => props.items], () => { void nextTick(revealActive) }, { flush: 'post' })
onMounted(() => {
  const list = tabList()
  if (list) {
    resize = new ResizeObserver(revealActive)
    resize.observe(list)
  }
  void document.fonts.ready.then(revealActive)
})
onBeforeUnmount(() => resize?.disconnect())
</script>

<template>
  <div ref="tabs" class="@container flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2" data-page-tabs>
    <UTabs
      v-model="model"
      :items="items"
      value-key="id"
      :content="false"
      variant="link"
      color="neutral"
      size="md"
      as="nav"
      :aria-label="label"
      class="min-w-0 max-w-full shrink-0"
      :ui="{
        list: 'gap-1 border-0 p-0 m-0 overflow-x-auto [scrollbar-width:none]',
        trigger: 'shrink-0 rounded-none px-3 py-2 @max-sm:px-1 data-[state=active]:font-semibold focus-visible:-outline-offset-2',
        indicator: 'bottom-0 h-0.5 bg-(--ui-color-primary-500)'
      }"
    >
      <template #trailing="{ item }">
        <span v-if="item.changed" class="blr-matrix-tone rounded border px-1 text-[10px]" data-tone="changes" aria-label="Contains changes">~</span>
        <span v-if="item.count !== undefined" class="blr-meta">{{ item.count }}</span>
      </template>
    </UTabs>
    <div v-if="$slots.actions" class="ms-auto flex shrink-0 items-center gap-2 py-1">
      <slot name="actions" />
    </div>
  </div>
</template>
