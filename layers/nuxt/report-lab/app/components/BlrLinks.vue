<script setup lang="ts">
/**
 * A resolved relation row: "Capabilities · Checkout, Catalogue browsing".
 *
 * Backlinks are derived, so a design that shows them must also make clear they
 * are derived rather than authored — the arrow direction in the label does it.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'

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
  .map(id => props.workspace.byId.get(id))
  .filter((entity): entity is AnyEntityView => Boolean(entity)))
const shown = computed(() => props.max ? entities.value.slice(0, props.max) : entities.value)
const overflow = computed(() => entities.value.length - shown.value.length)
</script>

<template>
  <div v-if="entities.length" class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
    <span class="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">
      <UIcon :name="meta.icon" class="size-3" />
      {{ label || meta.plural }}
    </span>
    <span class="flex flex-wrap gap-x-1.5 gap-y-1">
      <component
        :is="interactive ? 'button' : 'span'"
        v-for="entity in shown"
        :key="entity.id"
        :type="interactive ? 'button' : undefined"
        class="rounded border border-transparent text-toned"
        :class="interactive && 'hover:border-default hover:bg-elevated/60 px-1 -mx-1'"
        @click="interactive && emit('select', entity)"
      >
        {{ entity.title }}
      </component>
      <span v-if="overflow > 0" class="text-dimmed">+{{ overflow }}</span>
    </span>
  </div>
</template>
