<script setup lang="ts">
import type { DiagramNode } from '../utils/diagram'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
const props = defineProps<{ node: DiagramNode }>()
const emit = defineEmits<{ open: [key: string], toggle: [id: string, open: boolean] }>()
const meta = computed(() => props.node.kind ? ENTITY_KIND_META[props.node.kind] : undefined)
const color = computed(() => `var(--blr-slot-${props.node.colorSlot ?? meta.value?.slot ?? 0})`)
</script>

<template>
  <div class="blr-flow-node" :class="{ 'blr-flow-node--state': !node.kind, 'blr-flow-node--terminal': node.terminal }"
    :data-unreached="node.unreached || undefined" :data-resource-key="node.resourceKey" :style="{ '--node-color': color }">
    <component :is="node.resourceKey ? 'button' : 'div'" :type="node.resourceKey ? 'button' : undefined" class="blr-flow-node__main" :aria-description="node.description"
    @click.stop="node.resourceKey && emit('open', node.resourceKey)">
    <span v-if="meta" class="blr-flow-node__icon">
      <BlrEntityMark v-if="node.kind === 'entity' && node.entityFacet" :facet="node.entityFacet" :acts="node.acts" />
      <BlrInterfaceType v-else-if="node.kind === 'interface' && node.interfaceType" :type="node.interfaceType" />
      <UIcon v-else :name="meta.icon" class="size-5" />
    </span>
    <span v-else-if="node.terminal" class="blr-flow-terminal" :data-terminal="node.terminal" aria-hidden="true" />
    <span class="blr-flow-node__text">
      <strong class="blr-flow-node__title">{{ node.title }}</strong>
      <span v-if="node.note || meta" class="blr-flow-node__sub">{{ node.note || meta?.label }}</span>
      <span v-if="node.unreached" class="blr-flow-node__sub">unreached</span>
    </span>
    </component>
    <button v-if="node.branch" type="button" class="blr-flow-node__count" :aria-expanded="node.branch.open" :aria-label="`${node.branch.open ? 'Collapse' : 'Expand'} ${node.title}, ${node.branch.count} items`" @click.stop="emit('toggle', node.branch.id, !node.branch.open)">
      {{ node.branch.count }} <UIcon :name="node.branch.open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-3" />
    </button>
  </div>
</template>

<style scoped>
.blr-flow-node { display: flex; align-items: center; gap: 9px; width: 100%; min-height: 66px; padding: 10px 12px; box-sizing: border-box; border: 2px solid color-mix(in srgb, var(--node-color) 65%, var(--ui-border)); border-radius: 8px; background: color-mix(in srgb, var(--node-color) 6%, var(--ui-bg)); color: var(--ui-text-highlighted); text-align: start; }
.blr-flow-node__main { display: flex; align-items: center; gap: 9px; flex: 1; min-width: 0; text-align: inherit; border-radius: 4px; }
button.blr-flow-node__main { cursor: pointer; }
.blr-flow-node:has(button:hover), .blr-flow-node:focus-within { border-color: var(--node-color); box-shadow: 0 0 0 2px color-mix(in srgb, var(--node-color) 35%, transparent); }
.blr-flow-node button:focus-visible { outline: 2px solid var(--node-color); outline-offset: 3px; }
.blr-flow-node__icon { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 8px; background: color-mix(in srgb, var(--node-color) 18%, transparent); color: var(--node-color); }
.blr-flow-node__text { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; overflow-wrap: anywhere; }
.blr-flow-node__title { font-size: 14px; font-weight: 600; line-height: 1.35; }
.blr-flow-node__sub { font-size: 12px; line-height: 1.4; color: var(--ui-text-muted); }
.blr-flow-node__count { display: flex; align-items: center; gap: 3px; flex-shrink: 0; min-width: 32px; min-height: 28px; padding: 2px 5px; border-radius: 6px; background: color-mix(in srgb, var(--node-color) 16%, var(--ui-bg)); color: var(--ui-text); font: 12px var(--font-mono); text-align: center; cursor: pointer; }
.blr-flow-node--state { border-radius: 12px; background: var(--ui-bg); border-color: var(--ui-border-accented); }
.blr-flow-node--terminal { min-height: 48px; border-radius: 999px; }
.blr-flow-node[data-unreached] { border-style: dashed; }
.blr-flow-terminal { width: 16px; height: 16px; flex: 0 0 16px; border-radius: 50%; background: var(--ui-text-muted); }
.blr-flow-terminal[data-terminal='end'] { border: 3px double var(--ui-bg); outline: 2px solid var(--ui-text-muted); }
</style>
