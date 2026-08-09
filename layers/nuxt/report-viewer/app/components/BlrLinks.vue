<script setup lang="ts">
/**
 * A resolved relation row: "Capabilities · Checkout, Catalogue browsing".
 *
 * Backlinks are derived, so a view that shows them must also make clear they
 * are derived rather than authored — the arrow direction in the label does it.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, resolveEntity } from '../utils/reportWorkspace'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  ids: string[]
  kind: ReportEntityKind
  label?: string
  /** Emit `select` instead of rendering static text. */
  interactive?: boolean
  max?: number
}>(), {
  label: '',
  interactive: false,
  max: 0
})

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

const meta = computed(() => ENTITY_KIND_META[props.kind])
const entities = computed(() => props.ids
  .map(id => resolveEntity(props.workspace, props.kind, id))
  .filter((entity): entity is AnyEntityView => Boolean(entity)))
const shown = computed(() => props.max ? entities.value.slice(0, props.max) : entities.value)
const overflow = computed(() => entities.value.length - shown.value.length)
</script>

<template>
  <div v-if="entities.length" class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
    <span class="blr-field inline-flex items-center gap-1">
      <UIcon :name="meta.icon" class="size-3" />
      {{ label || meta.plural }}
    </span>
    <span class="flex flex-wrap gap-x-2 gap-y-1">
      <component
        :is="interactive ? 'button' : 'span'"
        v-for="entity in shown"
        :key="entity.key"
        :type="interactive ? 'button' : undefined"
        class="text-default"
        :class="interactive && 'rounded-sm underline decoration-(--ui-border-accented) underline-offset-3 transition-colors hover:text-highlighted hover:decoration-(--ui-text-dimmed)'"
        @click="interactive && emit('select', entity)"
      >
        {{ entity.title }}
      </component>
      <span v-if="overflow > 0" class="text-dimmed">+{{ overflow }}</span>
    </span>
  </div>
</template>
