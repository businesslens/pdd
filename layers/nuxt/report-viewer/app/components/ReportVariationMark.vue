<script setup lang="ts">
/**
 * A Variation reads as the type it varies: that type's mark, badged in the
 * corner the viewer already badges an Interface's type or an Entity's facet.
 * The set's own glyph never stands alone on a set — only on the collection
 * that lists every set. On an Interface set the badge takes the type's corner:
 * its alternatives each carry their own type where they are read.
 */
import type { EntityFacet, ReportResourceKind } from '../utils/reportWorkspace'
import { ENTITY_FACET_META, ENTITY_KIND_META } from '../utils/reportWorkspace'
import { slotColor } from '../utils/reportPalette'

const props = withDefaults(defineProps<{
  kind: ReportResourceKind
  /** An Entity set is drawn by the facet its alternatives play, as each of them is. */
  facet?: EntityFacet | null
  size?: 'xs' | 'sm'
}>(), { facet: null, size: 'sm' })

const meta = computed(() => ENTITY_KIND_META[props.kind])
const icon = computed(() => props.kind === 'entity' && props.facet ? ENTITY_FACET_META[props.facet].icon : meta.value.icon)
const colorMode = useColorMode()
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
const color = computed(() => slotColor(meta.value.slot, mounted.value && colorMode.value === 'dark'))
const explanation = computed(() => `${meta.value.label} Variation`)
</script>

<template>
  <UTooltip :text="explanation" :delay-duration="150">
    <span class="report-variation-mark" :data-size="size" role="img" :aria-label="explanation" data-variation-mark>
      <UIcon :name="icon" class="report-variation-mark__kind" :style="{ color }" />
      <span class="report-variation-mark__badge">
        <UIcon name="i-lucide-split" />
      </span>
    </span>
  </UTooltip>
</template>

<style scoped>
/* Sized exactly as ReportInterfaceType's type badge, so the two sub-icons match. */
.report-variation-mark {
  position: relative;
  display: inline-flex;
  width: var(--report-interface-mark-regular);
  height: var(--report-interface-mark-regular);
  flex: 0 0 var(--report-interface-mark-regular);
  align-items: flex-start;
  justify-content: flex-start;
}

.report-variation-mark__kind {
  width: var(--report-interface-kind-regular);
  height: var(--report-interface-kind-regular);
}

.report-variation-mark__badge {
  position: absolute;
  inset-inline-end: var(--report-interface-badge-offset-regular);
  inset-block-end: var(--report-interface-badge-offset-regular);
  display: inline-flex;
  width: var(--report-interface-badge-regular);
  height: var(--report-interface-badge-regular);
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--ui-bg);
  box-shadow: 0 0 0 1px var(--ui-border);
  color: var(--ui-text-highlighted);
}

.report-variation-mark__badge :deep(svg) {
  width: var(--report-interface-badge-glyph-regular);
  height: var(--report-interface-badge-glyph-regular);
  stroke-width: 2.25;
}

.report-variation-mark[data-size='xs'] {
  width: var(--report-interface-mark-dense);
  height: var(--report-interface-mark-dense);
  flex-basis: var(--report-interface-mark-dense);
}

.report-variation-mark[data-size='xs'] .report-variation-mark__kind {
  width: var(--report-interface-kind-dense);
  height: var(--report-interface-kind-dense);
}

.report-variation-mark[data-size='xs'] .report-variation-mark__badge {
  inset-inline-end: var(--report-interface-badge-offset-dense);
  inset-block-end: var(--report-interface-badge-offset-dense);
  width: var(--report-interface-badge-dense);
  height: var(--report-interface-badge-dense);
}

.report-variation-mark[data-size='xs'] .report-variation-mark__badge :deep(svg) {
  width: var(--report-interface-badge-glyph-dense);
  height: var(--report-interface-badge-glyph-dense);
}
</style>
