<script setup lang="ts">
/**
 * A parent's Scenarios, five ways.
 *
 * The complaint: moving between a Capability or Journey and its Scenarios is
 * hard. Each option below answers it differently, and each answer costs
 * something — reading two Scenarios by leaving twice (cards), a page that grows
 * without bound (inline), or an order the model never promised (split).
 */
import type { AnyEntityView, ReportWorkspace, ScenarioView } from '../utils/model'
import { ENTITY_KIND_META } from '../utils/model'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  selectedKey?: string | null
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
}>()

const { child } = useWorkbenchLab()

const children = computed<ScenarioView[]>(() => {
  if (props.entity.kind === 'capability') return props.workspace.scenariosByCapability.get(props.entity.id) ?? []
  if (props.entity.kind === 'journey') return props.workspace.scenariosByJourney.get(props.entity.id) ?? []
  return []
})

const meta = computed(() => ENTITY_KIND_META[props.entity.kind])

/* Inline and split both need a current child; they differ in where it renders. */
const openKey = ref<string | null>(null)
watch(children, (list) => {
  if (child.value === 'split') openKey.value = list[0]?.key ?? null
  else openKey.value = null
}, { immediate: true })
watch(child, (mode) => {
  openKey.value = mode === 'split' ? children.value[0]?.key ?? null : null
})

const openChild = computed(() => children.value.find(item => item.key === openKey.value) ?? null)

function toggle(entity: ScenarioView) {
  openKey.value = openKey.value === entity.key ? null : entity.key
}
</script>

<template>
  <p v-if="!children.length" class="text-sm text-muted italic">
    No Scenarios name this {{ meta.label }}.
  </p>

  <!-- CARDS — one row each; a Scenario is a page of its own. -->
  <div v-else-if="child === 'cards'" class="space-y-2">
    <BlrEntityCard
      v-for="item in children"
      :key="item.key"
      :workspace="workspace"
      :entity="item"
      :active="item.key === selectedKey"
      @open="emit('open', $event)"
    />
  </div>

  <!-- STEPPER — numbered, so the child page can say "2 of 3" and move. -->
  <ol v-else-if="child === 'stepper'" class="divide-y divide-default overflow-hidden rounded-xl border border-default">
    <li v-for="(item, index) in children" :key="item.key">
      <button type="button" class="blr-step-row" :data-current="item.key === selectedKey" @click="emit('open', item)">
        <span class="blr-step-index">{{ index + 1 }}</span>
        <span class="min-w-0 flex-1">
          <span class="flex flex-wrap items-center gap-2">
            <span class="truncate text-sm font-medium text-highlighted">{{ item.title }}</span>
            <UBadge color="neutral" variant="subtle" size="sm">{{ item.kindName }}</UBadge>
            <UBadge v-if="item.result" color="neutral" variant="outline" size="sm">{{ item.result }}</UBadge>
          </span>
          <span class="mt-0.5 block truncate text-xs text-muted">{{ item.trigger || item.lead }}</span>
        </span>
        <span class="blr-meta shrink-0">{{ item.steps.length }} steps</span>
        <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-dimmed" />
      </button>
    </li>
  </ol>

  <!-- INLINE — a Scenario needs no page; it opens where it is listed. -->
  <div v-else-if="child === 'inline'" class="divide-y divide-default overflow-hidden rounded-xl border border-default">
    <div v-for="item in children" :key="item.key">
      <button type="button" class="blr-inline-head" :aria-expanded="item.key === openKey" @click="toggle(item)">
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
          <span class="mt-0.5 block truncate text-xs text-muted">{{ item.trigger || item.lead }}</span>
        </span>
        <span class="blr-meta shrink-0">{{ item.steps.length }} steps</span>
      </button>
      <div v-if="item.key === openKey" class="border-t border-muted bg-elevated/20 px-5 py-5">
        <BlrEntityBody :workspace="workspace" :entity="item" @select="emit('select', $event)" />
        <div class="mt-5 flex justify-end">
          <UButton
            color="neutral"
            variant="outline"
            size="xs"
            trailing-icon="i-lucide-arrow-right"
            label="Open its page"
            @click="emit('open', item)"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- SPLIT — list on the left, the chosen Scenario on the right, in place. -->
  <div v-else-if="child === 'split'" class="overflow-hidden rounded-xl border border-default">
    <div class="grid lg:grid-cols-[16rem_1fr]">
      <div class="border-b border-default lg:border-b-0 lg:border-e">
        <button
          v-for="(item, index) in children"
          :key="item.key"
          type="button"
          class="blr-split-row"
          :data-current="item.key === openKey"
          @click="openKey = item.key"
        >
          <span class="blr-step-index">{{ index + 1 }}</span>
          <span class="min-w-0 flex-1 text-start">
            <span class="block truncate text-sm text-highlighted">{{ item.title }}</span>
            <span class="block truncate text-[11px] text-dimmed">{{ item.kindName }}</span>
          </span>
        </button>
      </div>
      <div class="min-w-0 p-5">
        <template v-if="openChild">
          <header class="mb-4 flex flex-wrap items-center gap-2">
            <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ openChild.title }}</h3>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              trailing-icon="i-lucide-arrow-right"
              label="Its page"
              class="ms-auto"
              @click="emit('open', openChild)"
            />
          </header>
          <BlrEntityBody :workspace="workspace" :entity="openChild" @select="emit('select', $event)" />
        </template>
      </div>
    </div>
  </div>

  <!-- RAIL — the parent lists plainly; the sibling rail lives on the child page. -->
  <div v-else class="divide-y divide-default overflow-hidden rounded-xl border border-default">
    <button
      v-for="item in children"
      :key="item.key"
      type="button"
      class="blr-rail-row"
      :data-current="item.key === selectedKey"
      @click="emit('open', item)"
    >
      <BlrKind :kind="item.kind" :labelled="false" size="xs" />
      <span class="min-w-0 flex-1 truncate text-start text-sm text-highlighted">{{ item.title }}</span>
      <UBadge color="neutral" variant="subtle" size="sm">{{ item.kindName }}</UBadge>
      <span class="blr-meta">{{ item.steps.length }} steps</span>
    </button>
  </div>
</template>

<style scoped>
.blr-step-row,
.blr-split-row,
.blr-rail-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  text-align: start;
}

.blr-step-row:hover,
.blr-split-row:hover,
.blr-rail-row:hover {
  background: var(--ui-bg-elevated);
}

.blr-step-row[data-current='true'],
.blr-split-row[data-current='true'],
.blr-rail-row[data-current='true'] {
  background: color-mix(in srgb, var(--blr-slot-7) 8%, var(--ui-bg-elevated));
  box-shadow: inset 2px 0 0 var(--blr-slot-7);
}

.blr-step-index {
  display: flex;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--ui-bg-muted);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ui-text-muted);
}

.blr-inline-head {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
}

.blr-inline-head:hover {
  background: var(--ui-bg-elevated);
}
</style>
