<script setup lang="ts">
/**
 * A parent's Scenarios, read inside the parent.
 *
 * A Scenario no longer opens a page. It was a third level of navigation for
 * material that only ever makes sense beside its siblings — you read a
 * Capability's Scenarios to compare them, and a page put each one alone.
 *
 * The chosen reading is split while its container supports two panes, then
 * becomes inline rather than squeezing the Scenario beside its sibling list.
 */
import type { AnyResourceView, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { childrenOf } from '../utils/pageSections'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
  /** A Scenario reached by URL or ⌘K: open on it rather than on the first. */
  selectedKey?: string | null
}>()

const emit = defineEmits<{ open: [resource: AnyResourceView] }>()

const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })

const children = computed<ScenarioView[]>(() => childrenOf(props.workspace, props.resource) as ScenarioView[])
const meta = computed(() => ENTITY_KIND_META[props.resource.kind])

/* Below the width needed by two panes, render the list as inline disclosures. */
const scenarioShellEl = ref<HTMLElement | null>(null)
const scenarioShellWidth = ref(0)

watch(scenarioShellEl, (resource, _previous, onCleanup) => {
  if (!resource || typeof ResizeObserver === 'undefined') return
  const measure = () => { scenarioShellWidth.value = resource.getBoundingClientRect().width }
  const observer = new ResizeObserver(([entry]) => {
    if (entry) scenarioShellWidth.value = entry.contentRect.width
  })
  measure()
  observer.observe(resource)
  onCleanup(() => observer.disconnect())
}, { immediate: true })

const inline = computed(() => scenarioShellWidth.value > 0 && scenarioShellWidth.value < 720)

const openKey = ref<string | null>(null)

function initial(): string | null {
  const requested = props.selectedKey
    && children.value.find(item => item.key === props.selectedKey)?.key
  if (requested) return requested
  return children.value[0]?.key ?? null
}

watch([children, () => props.selectedKey], () => {
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

  <!-- INLINE — below 720px, each expands where it is listed. -->
  <div
    v-else-if="inline"
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
        <BlrResourceBody
          v-model:scenario-route="scenarioRoute"
          v-model:route-columns="routeColumns"
          :workspace="workspace"
          :resource="item"
          @select="emit('open', $event)"
        />
      </div>
    </div>
  </div>

  <!-- SPLIT — the list never moves while you read. -->
  <div
    v-else
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
        <BlrResourceBody
          v-if="openScenario"
          v-model:scenario-route="scenarioRoute"
          v-model:route-columns="routeColumns"
          :workspace="workspace"
          :resource="openScenario"
          @select="emit('open', $event)"
        />
      </div>
    </div>
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
</style>
