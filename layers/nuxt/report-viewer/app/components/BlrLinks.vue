<script setup lang="ts">
/**
 * A resolved relation row: "Capabilities · Checkout, Catalogue browsing".
 *
 * Backlinks are derived, so a view that shows them must also make clear they
 * are derived rather than authored — the arrow direction in the label does it.
 */
import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, resolveResource } from '../utils/reportWorkspace'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  ids: string[]
  kind: ReportResourceKind
  label?: string
  /** Emit `select` instead of rendering static text. */
  interactive?: boolean
  max?: number
}>(), {
  label: '',
  interactive: false,
  max: 0
})

const emit = defineEmits<{ select: [resource: AnyResourceView] }>()

const meta = computed(() => ENTITY_KIND_META[props.kind])
const resources = computed(() => props.ids
  .map(id => resolveResource(props.workspace, props.kind, id))
  .filter((resource): resource is AnyResourceView => Boolean(resource)))
const shown = computed(() => props.max ? resources.value.slice(0, props.max) : resources.value)
const overflow = computed(() => resources.value.length - shown.value.length)
</script>

<template>
  <div v-if="resources.length" class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
    <span class="blr-field inline-flex items-center gap-1">
      <UIcon :name="meta.icon" class="size-3" />
      {{ label || meta.plural }}
    </span>
    <span class="flex flex-wrap gap-x-2 gap-y-1">
      <component
        :is="interactive ? 'button' : 'span'"
        v-for="resource in shown"
        :key="resource.key"
        :type="interactive ? 'button' : undefined"
        class="text-default"
        :class="interactive && 'inline-flex min-h-6 items-center rounded-sm underline decoration-(--ui-border-accented) underline-offset-3 transition-colors hover:text-highlighted hover:decoration-(--ui-text-dimmed)'"
        @click="interactive && emit('select', resource)"
      >
        {{ resource.title }}
      </component>
      <span v-if="overflow > 0" class="text-dimmed">+{{ overflow }}</span>
    </span>
  </div>
</template>
