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
/* A Variation wears the color of the type it varies; only its mark's sub-icon is in ink. */
const color = computed(() => `var(--report-slot-${props.node.colorSlot ?? (props.node.kind === 'variation' && props.node.memberKind ? ENTITY_KIND_META[props.node.memberKind].slot : meta.value?.slot) ?? 0})`)
/* A lone alternative says its set beside its type: "Journey · Post-purchase". */
const subtitle = computed(() => props.node.note || (props.node.alternativeOf ? `${meta.value?.label} · ${props.node.alternativeOf}` : meta.value?.label))
const branchLabel = computed(() => props.node.branch
  ? `${props.node.branch.open ? 'Collapse' : 'Expand'} ${props.node.title} · ${props.node.branch.open ? 'Hide' : 'Show'} ${props.node.branch.count} ${props.node.branch.childrenLabel}`
  : '')
</script>

<template>
  <div class="report-flow-node" :class="{ 'report-flow-node--state': !node.kind, 'report-flow-node--terminal': node.terminal, 'report-flow-node--group': node.group, 'report-flow-node--highlighted': highlighted }"
    :data-unreached="node.unreached || undefined" :data-conditional="node.conditional ? '' : undefined" :data-absent="node.absent ? '' : undefined" :data-resource-key="node.resourceKey" :style="{ '--node-color': color }">
    <component :is="href ? 'a' : node.resourceKey || node.inspectionKey ? 'button' : 'div'" :href="href" :type="(node.resourceKey || node.inspectionKey) && !href ? 'button' : undefined" :tabindex="node.resourceKey || node.inspectionKey ? undefined : 0" class="report-flow-node__main" :aria-description="node.description"
    @click.stop="activate">
    <span v-if="meta" class="report-flow-node__icon">
      <ReportVariationMark v-if="node.kind === 'variation' && node.memberKind" :kind="node.memberKind" :facet="node.entityFacet" />
      <ReportEntityMark v-else-if="node.kind === 'entity' && node.entityFacet" :facet="node.entityFacet" :acts="node.acts" />
      <ReportInterfaceType v-else-if="node.kind === 'interface' && node.interfaceType" :type="node.interfaceType" />
      <UIcon v-else :name="meta.icon" class="size-5" />
      <!-- An alternative drawn on its own wears the variation sub-icon, as a set's mark does. -->
      <span v-if="node.alternativeOf && node.kind !== 'variation'" class="report-flow-node__varied" aria-hidden="true"><UIcon name="i-lucide-split" /></span>
    </span>
    <span v-else-if="node.terminal" class="report-flow-terminal" :data-terminal="node.terminal" aria-hidden="true" />
    <span class="report-flow-node__text">
      <strong class="report-flow-node__title" :title="node.title">{{ node.title }}</strong>
      <span v-if="node.absent" class="report-flow-node__sub"><span class="report-absent-badge">{{ node.absent }}</span></span>
      <span v-else-if="node.note || meta" class="report-flow-node__sub" :title="subtitle">{{ subtitle }}</span>
      <span v-if="node.unreached" class="report-flow-node__sub">unreached</span>
      <!-- Held only under some alternatives: the variation mark and which. -->
      <span v-if="node.conditional" class="report-flow-node__sub report-flow-node__condition" :title="node.conditional"><UIcon name="i-lucide-split" class="size-3 shrink-0" />{{ node.conditional }}</span>
    </span>
    </component>
    <UTooltip v-if="node.branch" :text="branchLabel">
      <button type="button" class="report-flow-node__count nodrag nopan" :aria-expanded="node.branch.open" :aria-label="branchLabel" @click.stop="emit('toggle', node.branch.id, !node.branch.open)">
        <UIcon v-if="node.branch.open" name="i-lucide-square-minus" class="size-3.5 text-muted" />
        <span v-else>+{{ node.branch.count }}</span>
      </button>
    </UTooltip>
  </div>
</template>

<style scoped>
.report-flow-node { --node-border: color-mix(in srgb, var(--node-color) 65%, var(--ui-border)); position: relative; display: flex; width: 100%; color: var(--ui-text-highlighted); text-align: start; }
/* The control owns the complete visible card, including its padding and border. */
.report-flow-node__main { display: flex; align-items: center; gap: 9px; flex: 1; min-width: 0; min-height: 66px; padding: 10px 12px; box-sizing: border-box; border: 2px solid var(--node-border); border-radius: 8px; background: color-mix(in srgb, var(--node-color) 6%, var(--ui-bg)); text-align: inherit; }
button.report-flow-node__main { cursor: pointer; }
.report-flow-node :focus-visible { outline: 2px solid var(--node-color); outline-offset: 3px; }
.report-flow-node__icon { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 8px; background: color-mix(in srgb, var(--node-color) 18%, transparent); color: var(--node-color); }
.report-flow-node__text { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
.report-flow-node__title, .report-flow-node__sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.report-flow-node__title { font-size: 14px; font-weight: 600; line-height: 1.35; }
.report-flow-node__sub { font-size: 12px; line-height: 1.4; color: var(--ui-text-muted); }
.report-flow-node__count { position: absolute; top: -8px; inset-inline-end: -8px; z-index: 10; display: flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; border: 2px solid var(--ui-border-accented); border-radius: 9999px; background: var(--ui-bg); color: var(--ui-text-highlighted); font-size: 9px; font-weight: 500; cursor: pointer; transition: border-color 0.15s ease, background-color 0.15s ease; }
.report-flow-node__count::before { content: ''; position: absolute; inset: -6px; border-radius: inherit; }
.report-flow-node__count:hover { border-color: color-mix(in srgb, var(--ui-border-accented) 70%, var(--ui-text-dimmed)); background: var(--ui-bg-elevated); }
.report-flow-node__count:focus-visible { outline-color: var(--ui-text-muted); }
.report-flow-node__count[aria-expanded='true'] { top: -10px; inset-inline-end: -10px; z-index: 20; min-width: 22px; height: 22px; padding: 0 4px; }
.report-flow-node__count[aria-expanded='true']::before { inset: -5px; }
.report-flow-node--state { --node-border: var(--ui-border-accented); }
.report-flow-node--state > .report-flow-node__main { border-radius: 12px; background: var(--ui-bg); }
.report-flow-node--terminal > .report-flow-node__main { min-height: 48px; border-radius: 999px; }
/* A frame's header: the same card, compact and borderless, on the frame's own tint. */
.report-flow-node--group > .report-flow-node__main { min-height: 0; padding: 8px 12px; border: 0; border-radius: 12px 0 12px 0; background: transparent; }
.report-flow-node--group .report-flow-node__icon { width: 26px; height: 26px; border-radius: 6px; }
.report-flow-node--group .report-flow-node__icon :deep(.size-5) { width: 1rem; height: 1rem; }
.report-flow-node--group .report-flow-node__title { font-size: 13px; }
.report-flow-node--group:has(.report-flow-node__main:hover) > .report-flow-node__main,
.report-flow-node--group:focus-within > .report-flow-node__main,
.report-flow-node--group.report-flow-node--highlighted > .report-flow-node__main { box-shadow: none; background: color-mix(in srgb, var(--node-color) 10%, transparent); }
.report-flow-node[data-unreached] > .report-flow-node__main,
.report-flow-node[data-conditional] > .report-flow-node__main { border-style: dashed; }
.report-flow-node__condition { display: flex; align-items: center; gap: 4px; }
.report-flow-node__icon { position: relative; }
.report-flow-node__varied { position: absolute; inset-inline-end: -4px; inset-block-end: -4px; display: flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 9999px; background: var(--ui-bg); box-shadow: 0 0 0 1px var(--ui-border); color: var(--ui-text-highlighted); }
.report-flow-node__varied :deep(svg) { width: 9px; height: 9px; stroke-width: 2.25; }
/* Not at this place: muted and struck, the tree's same reading. */
.report-flow-node[data-absent] > .report-flow-node__main { border-style: dashed; background: transparent; opacity: 0.7; }
.report-flow-node[data-absent] .report-flow-node__title { font-weight: 500; color: var(--ui-text-muted); text-decoration: line-through; }
.report-flow-node[data-absent] .report-flow-node__icon { opacity: 0.5; }
.report-flow-node:has(.report-flow-node__main:hover) > .report-flow-node__main,
.report-flow-node:focus-within > .report-flow-node__main,
.report-flow-node--highlighted > .report-flow-node__main { border-color: var(--node-color); box-shadow: 0 0 0 2px color-mix(in srgb, var(--node-color) 35%, transparent); }
.report-flow-node:has(.report-flow-node__count:hover) > .report-flow-node__main { border-color: var(--node-border); box-shadow: none; }
.report-flow-terminal { width: 16px; height: 16px; flex: 0 0 16px; border-radius: 50%; background: var(--ui-text-muted); }
.report-flow-terminal[data-terminal='end'] { border: 3px double var(--ui-bg); outline: 2px solid var(--ui-text-muted); }
</style>
