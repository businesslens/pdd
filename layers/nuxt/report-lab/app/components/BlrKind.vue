<script setup lang="ts">
/**
 * Entity-kind marker: colour, silhouette-free but always icon + label.
 *
 * Nine kinds is past what hue alone can separate, so this component never emits
 * a bare colour swatch — the label is part of the mark.
 */
import type { ReportEntityKind } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { slotColor } from '../utils/reportPalette'

const props = withDefaults(defineProps<{
  kind: ReportEntityKind
  count?: number | null
  size?: 'xs' | 'sm'
  /** Suppress the text label only where a nearby label already names the kind. */
  labelled?: boolean
}>(), {
  count: null,
  size: 'sm',
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
    class="inline-flex items-center gap-1.5 text-xs whitespace-nowrap"
    :title="meta.label"
  >
    <UIcon :name="meta.icon" class="size-3.5 shrink-0" :style="{ color }" />
    <span v-if="labelled" class="text-toned">{{ count === null ? meta.label : meta.plural }}</span>
    <span v-if="count !== null" class="font-mono text-toned tabular-nums">{{ count }}</span>
  </span>
</template>
