<script setup lang="ts">
/**
 * One state of an Entity's composed lifecycle, on the shared flow canvas.
 *
 * A state is not a resource, so it opens nothing and carries no kind mark. It
 * says its name, whether it is where a thing starts, and — drawn hollow — when
 * no Step in the model ever leaves anything in it.
 */
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { FlowStateData } from '../utils/flowGraph'

const props = defineProps<NodeProps<FlowStateData>>()
const title = computed(() => props.data.terminal === 'start'
  ? 'Created here'
  : props.data.terminal === 'end'
    ? 'Removed here'
    : props.data.reached ? props.data.name : `${props.data.name} — no Step leaves anything in this state`)
</script>

<template>
  <!-- Arcs bind to a handle per side, as the resource boxes' do; without one
       Vue Flow anchors them to the top and bottom edges, and a left-to-right
       machine reads as a tangle of hooks. Nothing here is drawn. -->
  <div class="blr-flow-state-wrap">
    <Handle type="target" :position="targetPosition ?? Position.Left" class="blr-flow-state-handle" />
    <div
      v-if="data.terminal"
      class="blr-flow-terminal"
      :data-terminal="data.terminal"
      :title="title"
      role="img"
      :aria-label="title"
    />
    <div
      v-else
      class="blr-flow-state"
      :data-reached="data.reached"
      :data-initial="data.initial"
      :title="title"
    >
      <span class="min-w-0 truncate">{{ data.name }}</span>
      <span v-if="data.initial" class="blr-flow-state__note">start</span>
      <span v-else-if="!data.reached" class="blr-flow-state__note">unreached</span>
    </div>
    <Handle type="source" :position="sourcePosition ?? Position.Right" class="blr-flow-state-handle" />
  </div>
</template>

<style scoped>
.blr-flow-state-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.blr-flow-state-handle {
  width: 1px !important;
  height: 1px !important;
  min-width: 0 !important;
  min-height: 0 !important;
  border: none !important;
  background: transparent !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.blr-flow-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
  padding-inline: 0.75rem;
  border: 1px solid var(--ui-border-accented);
  border-radius: 999px;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.blr-flow-state[data-reached='false'] {
  border-style: dashed;
  background: transparent;
  color: var(--ui-text-muted);
  font-weight: 500;
}

.blr-flow-state__note {
  margin-inline-start: auto;
  color: var(--ui-text-dimmed);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.blr-flow-terminal {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: var(--ui-text-muted);
}

.blr-flow-terminal[data-terminal='end'] {
  background: transparent;
  border: 3px solid var(--ui-text-muted);
}
</style>
