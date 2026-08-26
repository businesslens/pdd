<script setup lang="ts">
/** A non-interactive shelf caption inside a Product Topology graph. */
import type { NodeProps } from '@vue-flow/core'
import type { FlowLabelData } from '../utils/flowGraph'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'

const props = defineProps<NodeProps<FlowLabelData>>()
const meta = computed(() => ENTITY_KIND_META[props.data.kind])
const colorVar = computed(() => `var(--blr-slot-${meta.value.slot})`)
</script>

<template>
  <div class="blr-flow-label" :style="{ '--label-color': colorVar }">
    <UIcon :name="meta.icon" class="blr-flow-label__kind shrink-0" />
    <span class="min-w-0 flex-1 truncate">{{ data.label }}</span>
    <span class="blr-flow-label__count">{{ data.count }}</span>
  </div>
</template>

<style scoped>
.blr-flow-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  height: 100%;
  padding-inline: 0.4rem;
  color: var(--label-color);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  pointer-events: none;
}

.blr-flow-label__count {
  color: var(--ui-text-dimmed);
  font-variant-numeric: tabular-nums;
}

.blr-flow-label__kind {
  width: var(--blr-element-mark-dense);
  height: var(--blr-element-mark-dense);
  flex: 0 0 var(--blr-element-mark-dense);
}
</style>
