<script setup lang="ts">
import type { ProductReport } from 'businesslens/report'

/**
 * Where the problems open.
 *
 * On a desktop they dock under the report like an editor's Problems panel:
 * the report keeps its own space above and stays usable, so a reader can
 * keep a problem in view while opening the resource it names. The panel
 * closes with its ✕, Escape inside it, or the chip again. On a phone, where
 * a docked panel would leave no room to read, the same list opens as a
 * bottom sheet, like the Filters sheet.
 */
defineProps<{ report: ProductReport | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ resource: [key: string] }>()

const phone = ref(false)
let query: MediaQueryList | undefined
const measure = () => { phone.value = Boolean(query?.matches) }
onMounted(() => {
  query = window.matchMedia('(width < 640px)')
  query.addEventListener('change', measure)
  measure()
})
onBeforeUnmount(() => query?.removeEventListener('change', measure))

const panel = ref<{ focus: () => void } | null>(null)
watch(open, (next) => { if (next && !phone.value) void nextTick(() => panel.value?.focus()) })

function follow(key: string) {
  // The sheet covers the reading it would open; the docked panel stays beside it.
  if (phone.value) open.value = false
  emit('resource', key)
}
</script>

<template>
  <UDrawer
    v-if="phone"
    v-model:open="open"
    title="Problems"
    description="Problems with the Product Model files"
    :ui="{ content: 'max-h-[70dvh]', container: 'min-h-0 gap-0 p-0', header: 'sr-only', body: 'flex min-h-0 flex-col p-0 sm:p-0' }"
  >
    <template #body>
      <LocalProblemsContent :report="report" @close="open = false" @resource="follow" />
    </template>
  </UDrawer>
  <section
    v-else-if="open"
    class="local-problems-panel"
    role="region"
    aria-label="Problems"
    data-local-problems-panel
    @keydown.esc.stop="open = false"
  >
    <LocalProblemsContent ref="panel" :report="report" @close="open = false" @resource="follow" />
  </section>
</template>

<style scoped>
.local-problems-panel {
  flex: none;
  height: clamp(11rem, 32vh, 20rem);
  border-top: 1px solid var(--ui-border);
  background: var(--ui-bg);
  box-shadow: 0 -6px 18px rgb(0 0 0 / 0.05);
}
</style>
