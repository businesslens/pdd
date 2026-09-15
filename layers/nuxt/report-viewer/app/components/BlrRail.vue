<script setup lang="ts">
import type { ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import { MAIN_RESOURCE_KINDS, MATRIX_DESTINATIONS } from '../utils/reportDestinations'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'

defineProps<{
  workspace: ReportWorkspace
  activeSection: string
  counts: Record<ReportResourceKind, number>
  /**
   * How many things differ from the host's baseline. Undefined where the host
   * has no comparison, and the row is absent; null where it has baselines but
   * no comparison yet, and the row carries no count.
   */
  changesCount?: number | null
}>()

/* The rail changes the subject, and only that. A collection's Graph is reached
   inside it; a matrix compares two collections, so it is a row of its own, and
   so is What changed, which compares two states of the whole model. */
const emit = defineEmits<{ kind: [kind: ReportResourceKind], view: [section: string], changes: [] }>()

const RAIL_KINDS = MAIN_RESOURCE_KINDS.map(kind => ENTITY_KIND_META[kind])
const isCurrent = (kind: ReportResourceKind, section: string) => kind === section
const overviewColor = `var(--blr-slot-${ENTITY_KIND_META.product.slot})`
</script>

<template>
  <nav>
    <div v-if="$slots.navigation" class="mb-1 border-b border-default px-1 pb-2">
      <slot name="navigation" />
    </div>

    <button
      type="button"
      class="blr-navitem"
      :data-current="activeSection === 'overview'"
      :style="{ '--kind-color': overviewColor }"
      @click="emit('kind', 'product')"
    >
      <UIcon :name="ENTITY_KIND_META.product.icon" class="size-4 shrink-0" :style="{ color: overviewColor }" />
      <span class="flex-1 truncate text-start">Overview</span>
    </button>
    <button
      v-for="item in MATRIX_DESTINATIONS"
      :key="item.section"
      type="button"
      class="blr-navitem"
      :data-current="activeSection === item.section"
      :aria-current="activeSection === item.section ? 'page' : undefined"
      :style="{ '--kind-color': overviewColor }"
      @click="emit('view', item.section)"
    >
      <UIcon :name="item.icon" class="size-4 shrink-0" :style="{ color: overviewColor }" />
      <span class="flex-1 truncate text-start">{{ item.name }}</span>
    </button>
    <button
      v-if="changesCount !== undefined"
      type="button"
      class="blr-navitem"
      :data-current="activeSection === 'changes'"
      :aria-current="activeSection === 'changes' ? 'page' : undefined"
      :style="{ '--kind-color': overviewColor }"
      data-rail-changes
      @click="emit('changes')"
    >
      <UIcon name="i-lucide-history" class="size-4 shrink-0" :style="{ color: overviewColor }" />
      <span class="flex-1 truncate text-start">What changed</span>
      <span v-if="changesCount !== null" class="blr-meta">{{ changesCount }}</span>
    </button>
    <p class="blr-navgroup mt-3">Resources</p>
    <button
      v-for="meta in RAIL_KINDS"
      :key="meta.kind"
      type="button"
      class="blr-navitem"
      :data-current="isCurrent(meta.kind, activeSection)"
      :aria-current="isCurrent(meta.kind, activeSection) ? 'page' : undefined"
      :style="{ '--kind-color': `var(--blr-slot-${meta.slot})` }"
      @click="emit('kind', meta.kind)"
    >
      <UIcon :name="meta.icon" class="size-4 shrink-0" :style="{ color: `var(--blr-slot-${meta.slot})` }" />
      <span class="flex-1 truncate text-start">{{ meta.plural }}</span>
      <span class="blr-meta">{{ counts[meta.kind] }}</span>
    </button>
  </nav>
</template>

<style scoped>
.blr-navgroup {
  padding: 0.4rem 0.625rem 0.25rem;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-navitem {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
  transition: background 0.12s ease, color 0.12s ease;
}

.blr-navitem:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.blr-navitem[data-current='true'] {
  background: color-mix(in srgb, var(--kind-color) 10%, var(--ui-bg-elevated));
  box-shadow: inset 2px 0 0 var(--kind-color);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}
</style>
