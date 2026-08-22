<script setup lang="ts">
/**
 * Entity-kind marker: colour, silhouette-free but always icon + label.
 *
 * Nine kinds is past what hue alone can separate, so this component never emits
 * a bare colour swatch — the label is part of the mark.
 */
import type { ReportEntityKind } from '../utils/reportWorkspace'
import type { ReportInterface } from 'businesslens/report'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { slotColor } from '../utils/reportPalette'

const props = withDefaults(defineProps<{
  kind: ReportEntityKind
  count?: number | null
  size?: 'xs' | 'sm'
  /** A concrete Interface can retain its kind and disclose its authored type. */
  interfaceType?: ReportInterface['type'] | null
  /** Suppress the text label only where a nearby label already names the kind. */
  labelled?: boolean
}>(), {
  count: null,
  size: 'sm',
  interfaceType: null,
  labelled: true
})

const colorMode = useColorMode()
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

const meta = computed(() => ENTITY_KIND_META[props.kind])
const color = computed(() => slotColor(meta.value.slot, mounted.value && colorMode.value === 'dark'))
</script>

<template>
  <span
    class="blr-kind inline-flex items-center gap-1.5 text-xs whitespace-nowrap"
    :data-size="size"
    :title="meta.label"
  >
    <BlrInterfaceType
      v-if="kind === 'interface' && interfaceType"
      :type="interfaceType"
      :size="size"
    />
    <UIcon v-else :name="meta.icon" class="blr-kind__icon shrink-0" :style="{ color }" />
    <span v-if="labelled" class="text-toned">{{ count === null ? meta.label : meta.plural }}</span>
    <span v-if="count !== null" class="font-mono text-toned tabular-nums">{{ count }}</span>
  </span>
</template>

<style scoped>
.blr-kind__icon {
  width: var(--blr-entity-mark-regular);
  height: var(--blr-entity-mark-regular);
  flex: 0 0 var(--blr-entity-mark-regular);
}

.blr-kind[data-size='xs'] > .blr-kind__icon {
  width: var(--blr-entity-mark-dense);
  height: var(--blr-entity-mark-dense);
  flex-basis: var(--blr-entity-mark-dense);
}
</style>
