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
    <span class="blr-variation-mark" :data-size="size" role="img" :aria-label="explanation" data-variation-mark>
      <UIcon :name="icon" class="blr-variation-mark__kind" :style="{ color }" />
      <span class="blr-variation-mark__badge">
        <UIcon name="i-lucide-split" />
      </span>
    </span>
  </UTooltip>
</template>

<style scoped>
/* Sized exactly as BlrInterfaceType's type badge, so the two sub-icons match. */
.blr-variation-mark {
  position: relative;
  display: inline-flex;
  width: var(--blr-interface-mark-regular);
  height: var(--blr-interface-mark-regular);
  flex: 0 0 var(--blr-interface-mark-regular);
  align-items: flex-start;
  justify-content: flex-start;
}

.blr-variation-mark__kind {
  width: var(--blr-interface-kind-regular);
  height: var(--blr-interface-kind-regular);
}

.blr-variation-mark__badge {
  position: absolute;
  inset-inline-end: var(--blr-interface-badge-offset-regular);
  inset-block-end: var(--blr-interface-badge-offset-regular);
  display: inline-flex;
  width: var(--blr-interface-badge-regular);
  height: var(--blr-interface-badge-regular);
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--ui-bg);
  box-shadow: 0 0 0 1px var(--ui-border);
  color: var(--ui-text-highlighted);
}

.blr-variation-mark__badge :deep(svg) {
  width: var(--blr-interface-badge-glyph-regular);
  height: var(--blr-interface-badge-glyph-regular);
  stroke-width: 2.25;
}

.blr-variation-mark[data-size='xs'] {
  width: var(--blr-interface-mark-dense);
  height: var(--blr-interface-mark-dense);
  flex-basis: var(--blr-interface-mark-dense);
}

.blr-variation-mark[data-size='xs'] .blr-variation-mark__kind {
  width: var(--blr-interface-kind-dense);
  height: var(--blr-interface-kind-dense);
}

.blr-variation-mark[data-size='xs'] .blr-variation-mark__badge {
  inset-inline-end: var(--blr-interface-badge-offset-dense);
  inset-block-end: var(--blr-interface-badge-offset-dense);
  width: var(--blr-interface-badge-dense);
  height: var(--blr-interface-badge-dense);
}

.blr-variation-mark[data-size='xs'] .blr-variation-mark__badge :deep(svg) {
  width: var(--blr-interface-badge-glyph-dense);
  height: var(--blr-interface-badge-glyph-dense);
}
</style>
