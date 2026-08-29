<script setup lang="ts">
/**
 * The navigation rail: which collection, never which resource.
 *
 * It lists *kinds*, and kinds do not nest — instances do. An earlier revision
 * indented the two Scenario kinds under the parent that owns them, which read
 * as a tree that gave up: schema 6 declares a complete Interface → Experience → Screen hierarchy as well
 * (Interface ⊃ Experience ⊃ Screen), so indenting two rows is either incomplete
 * or becomes a three-level tree inside a ten-row rail.
 *
 * Containment is shown where instances are: as the default grouping of a
 * collection and on the resource page. Both Scenario kinds are therefore read
 * from their parent rather than listed here, which is the same resolution the
 * documentation reached — a mandatory single parent is explained on its
 * parent's page, never on one of its own.
 *
 * There is no ranking group. Splitting the list into "product" and "structure"
 * puts an Experience below a Capability, and the model says no such thing.
 */
import type { ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, REPORT_ENTITY_KINDS } from '../utils/reportWorkspace'

defineProps<{
  workspace: ReportWorkspace
  activeSection: string
  counts: Record<ReportResourceKind, number>
}>()

const emit = defineEmits<{
  kind: [kind: ReportResourceKind]
  topology: []
}>()

/** A kind with a mandatory single parent is reached from that parent. */
const PARENTED: ReportResourceKind[] = ['capability-scenario', 'journey-scenario']

const RAIL_KINDS = REPORT_ENTITY_KINDS.filter(meta => !PARENTED.includes(meta.kind))

/** A parent row stays current while one of its Scenario pages is open. */
const SECTION_PARENT: Record<string, ReportResourceKind> = {
  'capability-scenario': 'capability',
  'journey-scenario': 'journey'
}

function isCurrent(kind: ReportResourceKind, section: string): boolean {
  return section === kind || SECTION_PARENT[section] === kind
}

const overviewColor = `var(--blr-slot-${ENTITY_KIND_META.product.slot})`
</script>

<template>
  <nav>
    <div v-if="$slots.navigation" class="mb-1 border-b border-default px-1 pb-2">
      <slot name="navigation" />
    </div>

    <p class="blr-navgroup">Explore</p>
    <button
      type="button"
      class="blr-navitem"
      :data-current="activeSection === 'overview'"
      :style="{ '--kind-color': overviewColor }"
      @click="emit('kind', 'product')"
    >
      <UIcon name="i-lucide-package" class="size-4 shrink-0" :style="{ color: overviewColor }" />
      <span class="flex-1 truncate text-start">Overview</span>
    </button>
    <button
      type="button"
      class="blr-navitem"
      :data-current="activeSection === 'topology'"
      :style="{ '--kind-color': overviewColor }"
      @click="emit('topology')"
    >
      <UIcon name="i-lucide-waypoints" class="size-4 shrink-0" :style="{ color: overviewColor }" />
      <span class="flex-1 truncate text-start">Topology</span>
    </button>

    <p class="blr-navgroup mt-3">Browse</p>
    <button
      v-for="meta in RAIL_KINDS"
      :key="meta.kind"
      type="button"
      class="blr-navitem"
      :data-current="isCurrent(meta.kind, activeSection)"
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
