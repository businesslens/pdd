<script setup lang="ts">
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { resourceOpenerKey } from '../utils/resourceNavigation'
import { variationMembers, VARIATION_LABELS } from '../utils/variations'

const props = defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView, overview?: boolean }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const opener = inject(resourceOpenerKey, null)
const count = computed(() => variationMembers(props.workspace, props.resource).length)
function open() {
  if (opener) opener(props.resource.key, 'variations')
  else emit('open', props.resource)
}
</script>

<template>
  <span v-if="resource.variation && count > 1" class="flex flex-wrap items-baseline gap-x-1.5 text-xs text-muted" data-variation-link>
    <span v-if="!overview">{{ VARIATION_LABELS[resource.variation.kind] }} ·</span>
    <BlrResourceLink :resource-key="resource.key" tab="variations" class="whitespace-nowrap underline underline-offset-2" @open="open">
      {{ overview ? `View all ${count} variations` : `View ${count} variations` }}
    </BlrResourceLink>
    <slot />
  </span>
</template>
