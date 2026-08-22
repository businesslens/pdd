<script setup lang="ts">
/**
 * A container box: an Interface column or an Experience floor in the Screen
 * map. Children are real Vue Flow child nodes; this only draws the frame, the
 * kind-tinted header, and — when the container is legitimately empty — the
 * sentence explaining why that is a fact rather than a gap.
 */
import type { NodeProps } from '@vue-flow/core'
import type { FlowGroupData } from '../utils/flowGraph'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'

const props = defineProps<NodeProps<FlowGroupData>>()

const meta = computed(() => ENTITY_KIND_META[props.data.kind])
const colorVar = computed(() => `var(--blr-slot-${props.data.colorSlot ?? meta.value.slot})`)
</script>

<template>
  <div
    class="blr-flow-group"
    :class="{ 'is-selected': data.selected, 'is-dimmed': data.dimmed }"
    :style="{ '--group-color': colorVar }"
  >
    <div class="blr-flow-group__header">
      <span class="blr-flow-group__icon">
        <BlrInterfaceType
          v-if="data.kind === 'interface' && data.interfaceType"
          :type="data.interfaceType"
        />
        <UIcon v-else :name="meta.icon" class="blr-flow-group__kind" />
      </span>
      <span class="blr-flow-group__text">
        <span class="blr-flow-group__title">{{ data.title }}</span>
        <span class="blr-flow-group__sub">{{ data.sublabel }}</span>
      </span>
    </div>
    <p v-if="data.emptyNote" class="blr-flow-group__empty">
      {{ data.emptyNote }}
    </p>
  </div>
</template>

<style scoped>
.blr-flow-group {
  width: 100%;
  height: 100%;
  border: 1.5px dashed color-mix(in srgb, var(--group-color) 45%, var(--ui-border));
  border-radius: 12px;
  background: color-mix(in srgb, var(--group-color) 4%, transparent);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, opacity 0.2s ease;
}

.blr-flow-group:hover {
  border-color: var(--group-color);
}

.blr-flow-group.is-selected {
  border-style: solid;
  border-color: var(--group-color);
  box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--group-color) 55%, transparent);
}

.blr-flow-group.is-dimmed {
  opacity: 0.3;
}

.blr-flow-group__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem 0.4rem;
  border-bottom: 1px solid color-mix(in srgb, var(--group-color) 22%, transparent);
}

.blr-flow-group__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--blr-entity-mark-regular) + 0.375rem);
  height: calc(var(--blr-entity-mark-regular) + 0.375rem);
  flex-shrink: 0;
  border-radius: 7px;
  background: color-mix(in srgb, var(--group-color) 18%, transparent);
  color: var(--group-color);
}

.blr-flow-group__kind {
  width: var(--blr-entity-mark-regular);
  height: var(--blr-entity-mark-regular);
  flex: 0 0 var(--blr-entity-mark-regular);
}

.blr-flow-group__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.blr-flow-group__title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.blr-flow-group__sub {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-flow-group__empty {
  padding: 0.6rem 0.7rem;
  font-size: 0.7rem;
  font-style: italic;
  color: var(--ui-text-dimmed);
  line-height: 1.4;
}
</style>
