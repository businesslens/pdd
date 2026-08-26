<script setup lang="ts">
/**
 * A resolved relation row: "Capabilities · Checkout, Catalogue browsing".
 *
 * Backlinks are derived, so a view that shows them must also make clear they
 * are derived rather than authored — the arrow direction in the label does it.
 */
import type { AnyElementView, ReportElementKind, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, resolveElement } from '../utils/reportWorkspace'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  ids: string[]
  kind: ReportElementKind
  label?: string
  /** Emit `select` instead of rendering static text. */
  interactive?: boolean
  max?: number
}>(), {
  label: '',
  interactive: false,
  max: 0
})

const emit = defineEmits<{ select: [element: AnyElementView] }>()

const meta = computed(() => ENTITY_KIND_META[props.kind])
const elements = computed(() => props.ids
  .map(id => resolveElement(props.workspace, props.kind, id))
  .filter((element): element is AnyElementView => Boolean(element)))
const shown = computed(() => props.max ? elements.value.slice(0, props.max) : elements.value)
const overflow = computed(() => elements.value.length - shown.value.length)
</script>

<template>
  <div v-if="elements.length" class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
    <span class="blr-field inline-flex items-center gap-1">
      <UIcon :name="meta.icon" class="size-3" />
      {{ label || meta.plural }}
    </span>
    <span class="flex flex-wrap gap-x-2 gap-y-1">
      <component
        :is="interactive ? 'button' : 'span'"
        v-for="element in shown"
        :key="element.key"
        :type="interactive ? 'button' : undefined"
        class="text-default"
        :class="interactive && 'inline-flex min-h-6 items-center rounded-sm underline decoration-(--ui-border-accented) underline-offset-3 transition-colors hover:text-highlighted hover:decoration-(--ui-text-dimmed)'"
        @click="interactive && emit('select', element)"
      >
        {{ element.title }}
      </component>
      <span v-if="overflow > 0" class="text-dimmed">+{{ overflow }}</span>
    </span>
  </div>
</template>
