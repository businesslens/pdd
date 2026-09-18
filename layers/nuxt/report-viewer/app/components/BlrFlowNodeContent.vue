<script setup lang="ts">
import { resourceNavigationKey } from '../utils/resourceNavigation'
import type { DiagramNode } from '../utils/diagram'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
const props = defineProps<{ node: DiagramNode, highlighted?: boolean }>()
const emit = defineEmits<{ open: [key: string], inspect: [key: string], toggle: [id: string, open: boolean] }>()
const navigation = inject(resourceNavigationKey, null)
const href = computed(() => props.node.resourceKey ? navigation?.href(props.node.resourceKey) : undefined)
function activate(event: MouseEvent) {
  if (href.value && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return
  event.preventDefault()
  if (props.node.resourceKey) emit('open', props.node.resourceKey)
  else if (props.node.inspectionKey) emit('inspect', props.node.inspectionKey)
}
const meta = computed(() => props.node.kind ? ENTITY_KIND_META[props.node.kind] : undefined)
const color = computed(() => `var(--blr-slot-${props.node.colorSlot ?? meta.value?.slot ?? 0})`)
const branchLabel = computed(() => props.node.branch
  ? `${props.node.branch.open ? 'Collapse' : 'Expand'} ${props.node.title} · ${props.node.branch.open ? 'Hide' : 'Show'} ${props.node.branch.count} ${props.node.branch.childrenLabel}`
  : '')
</script>

<template>
  <div class="blr-flow-node" :class="{ 'blr-flow-node--state': !node.kind, 'blr-flow-node--terminal': node.terminal, 'blr-flow-node--highlighted': highlighted }"
    :data-unreached="node.unreached || undefined" :data-resource-key="node.resourceKey" :style="{ '--node-color': color }">
    <component :is="href ? 'a' : node.resourceKey || node.inspectionKey ? 'button' : 'div'" :href="href" :type="(node.resourceKey || node.inspectionKey) && !href ? 'button' : undefined" :tabindex="node.resourceKey || node.inspectionKey ? undefined : 0" class="blr-flow-node__main" :aria-description="node.description"
    @click.stop="activate">
    <span v-if="meta" class="blr-flow-node__icon">
      <BlrEntityMark v-if="node.kind === 'entity' && node.entityFacet" :facet="node.entityFacet" :acts="node.acts" />
      <BlrInterfaceType v-else-if="node.kind === 'interface' && node.interfaceType" :type="node.interfaceType" />
      <UIcon v-else :name="meta.icon" class="size-5" />
    </span>
    <span v-else-if="node.terminal" class="blr-flow-terminal" :data-terminal="node.terminal" aria-hidden="true" />
    <span class="blr-flow-node__text">
      <strong class="blr-flow-node__title" :title="node.title">{{ node.title }}</strong>
      <span v-if="node.note || meta" class="blr-flow-node__sub" :title="node.note || meta?.label">{{ node.note || meta?.label }}</span>
      <span v-if="node.unreached" class="blr-flow-node__sub">unreached</span>
    </span>
    </component>
    <UTooltip v-if="node.branch" :text="branchLabel">
      <button type="button" class="blr-flow-node__count nodrag nopan" :aria-expanded="node.branch.open" :aria-label="branchLabel" @click.stop="emit('toggle', node.branch.id, !node.branch.open)">
        <UIcon v-if="node.branch.open" name="i-lucide-square-minus" class="size-3.5 text-muted" />
        <span v-else>+{{ node.branch.count }}</span>
      </button>
    </UTooltip>
  </div>
</template>

<style scoped>
.blr-flow-node { --node-border: color-mix(in srgb, var(--node-color) 65%, var(--ui-border)); position: relative; display: flex; width: 100%; color: var(--ui-text-highlighted); text-align: start; }
/* The control owns the complete visible card, including its padding and border. */
.blr-flow-node__main { display: flex; align-items: center; gap: 9px; flex: 1; min-width: 0; min-height: 66px; padding: 10px 12px; box-sizing: border-box; border: 2px solid var(--node-border); border-radius: 8px; background: color-mix(in srgb, var(--node-color) 6%, var(--ui-bg)); text-align: inherit; }
button.blr-flow-node__main { cursor: pointer; }
.blr-flow-node :focus-visible { outline: 2px solid var(--node-color); outline-offset: 3px; }
.blr-flow-node__icon { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 8px; background: color-mix(in srgb, var(--node-color) 18%, transparent); color: var(--node-color); }
.blr-flow-node__text { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
.blr-flow-node__title, .blr-flow-node__sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.blr-flow-node__title { font-size: 14px; font-weight: 600; line-height: 1.35; }
.blr-flow-node__sub { font-size: 12px; line-height: 1.4; color: var(--ui-text-muted); }
.blr-flow-node__count { position: absolute; top: -8px; inset-inline-end: -8px; z-index: 10; display: flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; border: 2px solid var(--ui-border-accented); border-radius: 9999px; background: var(--ui-bg); color: var(--ui-text-highlighted); font-size: 9px; font-weight: 500; cursor: pointer; transition: border-color 0.15s ease, background-color 0.15s ease; }
.blr-flow-node__count::before { content: ''; position: absolute; inset: -6px; border-radius: inherit; }
.blr-flow-node__count:hover { border-color: color-mix(in srgb, var(--ui-border-accented) 70%, var(--ui-text-dimmed)); background: var(--ui-bg-elevated); }
.blr-flow-node__count:focus-visible { outline-color: var(--ui-text-muted); }
.blr-flow-node__count[aria-expanded='true'] { top: -10px; inset-inline-end: -10px; z-index: 20; min-width: 22px; height: 22px; padding: 0 4px; }
.blr-flow-node__count[aria-expanded='true']::before { inset: -5px; }
.blr-flow-node--state { --node-border: var(--ui-border-accented); }
.blr-flow-node--state > .blr-flow-node__main { border-radius: 12px; background: var(--ui-bg); }
.blr-flow-node--terminal > .blr-flow-node__main { min-height: 48px; border-radius: 999px; }
.blr-flow-node[data-unreached] > .blr-flow-node__main { border-style: dashed; }
.blr-flow-node:has(.blr-flow-node__main:hover) > .blr-flow-node__main,
.blr-flow-node:focus-within > .blr-flow-node__main,
.blr-flow-node--highlighted > .blr-flow-node__main { border-color: var(--node-color); box-shadow: 0 0 0 2px color-mix(in srgb, var(--node-color) 35%, transparent); }
.blr-flow-node:has(.blr-flow-node__count:hover) > .blr-flow-node__main { border-color: var(--node-border); box-shadow: none; }
.blr-flow-terminal { width: 16px; height: 16px; flex: 0 0 16px; border-radius: 50%; background: var(--ui-text-muted); }
.blr-flow-terminal[data-terminal='end'] { border: 3px double var(--ui-bg); outline: 2px solid var(--ui-text-muted); }
</style>
