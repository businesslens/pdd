<script setup lang="ts">
/**
 * A parent's Scenarios, read inside the parent.
 *
 * A Scenario no longer opens a page. It was a third level of navigation for
 * material that only ever makes sense beside its siblings — you read a
 * Capability's Scenarios to compare them, and a page put each one alone.
 *
 * All five options keep the reading in the parent. What varies is where the
 * chosen Scenario appears and what happens to the list while you read it.
 */
import type { AnyEntityView, ReportWorkspace, ScenarioView } from '../utils/model'
import { ENTITY_KIND_META } from '../utils/model'
import { childrenOf } from '../utils/pageSections'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  /** A Scenario reached by URL or ⌘K: open on it rather than on the first. */
  selectedKey?: string | null
  /** Clears the page tabs above this sticky row without hard-coding a layout. */
  stickyTop?: string
}>(), { stickyTop: '2.5rem' })

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })

const { scenario: variant } = useWorkbenchLab()

const children = computed<ScenarioView[]>(() => childrenOf(props.workspace, props.entity) as ScenarioView[])
const meta = computed(() => ENTITY_KIND_META[props.entity.kind])

/* Split is the default reading, but below the width needed by its two panes it
   becomes the inline option rather than squeezing the Scenario beside a list. */
const scenarioShellEl = ref<HTMLElement | null>(null)
const scenarioShellWidth = ref(0)

watch(scenarioShellEl, (element, _previous, onCleanup) => {
  if (!element || typeof ResizeObserver === 'undefined') return
  const measure = () => { scenarioShellWidth.value = element.getBoundingClientRect().width }
  const observer = new ResizeObserver(([entry]) => {
    if (entry) scenarioShellWidth.value = entry.contentRect.width
  })
  measure()
  observer.observe(element)
  onCleanup(() => observer.disconnect())
}, { immediate: true })

const splitInline = computed(() => variant.value === 'split'
  && scenarioShellWidth.value > 0
  && scenarioShellWidth.value < 720)

/* Inline is the one option where "nothing chosen" is a legitimate state: the
   list is the reading until you open something. */
const openKey = ref<string | null>(null)

function initial(): string | null {
  const requested = props.selectedKey
    && children.value.find(item => item.key === props.selectedKey)?.key
  if (requested) return requested
  return variant.value === 'inline' ? null : children.value[0]?.key ?? null
}

watch([children, variant, () => props.selectedKey], () => {
  openKey.value = initial()
}, { immediate: true })

const openScenario = computed(() => children.value.find(item => item.key === openKey.value) ?? null)

function toggle(item: ScenarioView) {
  openKey.value = openKey.value === item.key ? null : item.key
}

const summary = (item: ScenarioView) => item.trigger || item.lead
</script>

<template>
  <p v-if="!children.length" class="text-sm text-muted italic">
    No Scenarios name this {{ meta.label }}.
  </p>

  <!-- INLINE — each expands where it is listed. -->
  <div
    v-else-if="variant === 'inline' || splitInline"
    ref="scenarioShellEl"
    class="divide-y divide-default overflow-hidden rounded-xl border border-default"
  >
    <div v-for="item in children" :key="item.key">
      <button type="button" class="blr-scn-head" :aria-expanded="item.key === openKey" @click="toggle(item)">
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4 shrink-0 text-dimmed transition-transform"
          :class="item.key === openKey && 'rotate-90'"
        />
        <span class="min-w-0 flex-1 text-start">
          <span class="flex flex-wrap items-center gap-2">
            <span class="truncate text-sm font-medium text-highlighted">{{ item.title }}</span>
            <UBadge color="neutral" variant="subtle" size="sm">{{ item.kindName }}</UBadge>
            <UBadge v-if="item.result" color="neutral" variant="outline" size="sm">{{ item.result }}</UBadge>
          </span>
          <span class="mt-0.5 block truncate text-xs text-muted">{{ summary(item) }}</span>
        </span>
        <span class="blr-meta shrink-0">{{ item.steps.length }} steps</span>
      </button>
      <div v-if="item.key === openKey" class="border-t border-muted bg-elevated/20 px-5 py-5">
        <BlrEntityBody
          v-model:scenario-route="scenarioRoute"
          v-model:route-columns="routeColumns"
          :workspace="workspace"
          :entity="item"
          @select="emit('select', $event)"
        />
      </div>
    </div>
  </div>

  <!-- SPLIT — the list never moves while you read. -->
  <div
    v-else-if="variant === 'split'"
    ref="scenarioShellEl"
    class="overflow-hidden rounded-xl border border-default"
  >
    <div class="grid grid-cols-[17rem_minmax(0,1fr)]">
      <div class="border-e border-default">
        <button
          v-for="(item, index) in children"
          :key="item.key"
          type="button"
          class="blr-scn-row"
          :data-current="item.key === openKey"
          @click="openKey = item.key"
        >
          <span class="blr-scn-index">{{ index + 1 }}</span>
          <span class="min-w-0 flex-1 text-start">
            <span class="block truncate text-sm text-highlighted">{{ item.title }}</span>
            <span class="block truncate text-[11px] text-dimmed">
              {{ item.kindName }}<template v-if="item.result"> · {{ item.result }}</template>
            </span>
          </span>
        </button>
      </div>
      <div class="min-w-0 p-5">
        <BlrEntityBody
          v-if="openScenario"
          v-model:scenario-route="scenarioRoute"
          v-model:route-columns="routeColumns"
          :workspace="workspace"
          :entity="openScenario"
          @select="emit('select', $event)"
        />
      </div>
    </div>
  </div>

  <!-- INDEX — a compact strip above, the reading at full width below. -->
  <div v-else-if="variant === 'index'" class="space-y-4">
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="(item, index) in children"
        :key="item.key"
        type="button"
        class="blr-scn-chip"
        :data-current="item.key === openKey"
        @click="openKey = item.key"
      >
        <span class="blr-scn-index">{{ index + 1 }}</span>
        <span class="truncate">{{ item.title }}</span>
      </button>
    </div>
    <div v-if="openScenario" class="space-y-3 border-t border-default pt-4">
      <header class="flex flex-wrap items-center gap-2">
        <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ openScenario.title }}</h3>
        <UBadge color="neutral" variant="subtle" size="sm">{{ openScenario.kindName }}</UBadge>
        <UBadge v-if="openScenario.result" color="neutral" variant="outline" size="sm">
          {{ openScenario.result }}
        </UBadge>
      </header>
      <BlrEntityBody
        v-model:scenario-route="scenarioRoute"
        v-model:route-columns="routeColumns"
        :workspace="workspace"
        :entity="openScenario"
        @select="emit('select', $event)"
      />
    </div>
  </div>

  <!-- TABS — the set is visible; one reads at a time. -->
  <div v-else-if="variant === 'tabs'" class="space-y-4">
    <div
      data-sticky-scenario-tabs
      class="sticky z-10 flex flex-wrap items-center gap-1 border-b border-default bg-default/95 backdrop-blur"
      :style="{ top: props.stickyTop }"
    >
      <button
        v-for="(item, index) in children"
        :key="item.key"
        type="button"
        class="blr-scn-tab"
        :data-current="item.key === openKey"
        :title="item.title"
        @click="openKey = item.key"
      >
        <span class="blr-scn-index">{{ index + 1 }}</span>
        <span class="max-w-40 truncate">{{ item.title }}</span>
      </button>
    </div>
    <BlrEntityBody
      v-if="openScenario"
      v-model:scenario-route="scenarioRoute"
      v-model:route-columns="routeColumns"
      :workspace="workspace"
      :entity="openScenario"
      @select="emit('select', $event)"
    />
  </div>

  <!-- SEQUENCE — all of them, in order, nothing to click. -->
  <div v-else class="space-y-8">
    <section v-for="(item, index) in children" :key="item.key" class="space-y-3">
      <header class="flex flex-wrap items-center gap-2 border-b border-default pb-2">
        <span class="blr-scn-index">{{ index + 1 }}</span>
        <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ item.title }}</h3>
        <UBadge color="neutral" variant="subtle" size="sm">{{ item.kindName }}</UBadge>
        <UBadge v-if="item.result" color="neutral" variant="outline" size="sm">{{ item.result }}</UBadge>
        <span class="blr-meta ms-auto">{{ item.steps.length }} steps</span>
      </header>
      <BlrEntityBody :workspace="workspace" :entity="item" @select="emit('select', $event)" />
    </section>
  </div>
</template>

<style scoped>
.blr-scn-head,
.blr-scn-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  text-align: start;
}

.blr-scn-head:hover,
.blr-scn-row:hover {
  background: var(--ui-bg-elevated);
}

.blr-scn-row[data-current='true'] {
  background: color-mix(in srgb, var(--blr-slot-7) 8%, var(--ui-bg-elevated));
  box-shadow: inset 2px 0 0 var(--blr-slot-7);
}

.blr-scn-index {
  display: inline-flex;
  width: 1.375rem;
  height: 1.375rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--ui-bg-muted);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ui-text-muted);
}

.blr-scn-chip {
  display: inline-flex;
  max-width: 18rem;
  align-items: center;
  gap: 0.375rem;
  padding: 0.1875rem 0.5rem 0.1875rem 0.1875rem;
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  font-size: 12px;
  color: var(--ui-text-muted);
}

.blr-scn-chip:hover {
  border-color: var(--ui-border-accented);
  color: var(--ui-text-highlighted);
}

.blr-scn-chip[data-current='true'] {
  border-color: transparent;
  background: color-mix(in srgb, var(--blr-slot-7) 12%, var(--ui-bg-elevated));
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

.blr-scn-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4375rem 0.625rem;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  color: var(--ui-text-muted);
}

.blr-scn-tab:hover {
  color: var(--ui-text-highlighted);
}

.blr-scn-tab[data-current='true'] {
  border-bottom-color: var(--blr-slot-7);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}
</style>
