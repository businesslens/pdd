<script setup lang="ts">
/**
 * An Entity named as a resource: its facet mark and title in one pill that
 * opens it.
 *
 * Every surface that refers to an Entity — a Step's effects, a Screen's
 * Presents, a Capability's What it changes, a Scenario's Ends with, the
 * Actor a Step names — draws this one chip, so the reader learns its shape
 * once. The words around it (a verb, a state, a reading) stay outside or
 * trail it through the default slot; the chip itself says only which thing.
 *
 * A read is a mention, not a claim about what can alter the thing, so the
 * `muted` variant draws it dashed and lighter: a row of reads and changes
 * cannot be misread as a row of changes.
 *
 * Its words sit on a shared baseline, one mark tall, and the marks centre on
 * that line, so the chip's baseline is its label's and the prose around it
 * lines up with the name rather than with the bottom of an icon.
 */
import type { EntityView } from '../utils/reportWorkspace'
import BlrResourceLink from './BlrResourceLink.vue'
import { entityFacetOf } from '../utils/reportWorkspace'

const props = defineProps<{
  entity: EntityView
  /** Replaces the title, e.g. `Collection (source)` for an aliased instance. */
  label?: string
  /** Dashed and lighter: the Entity is only read here. */
  muted?: boolean
  /** Drawn as the chip without being a link, inside a row that is itself one. */
  static?: boolean
}>()

const emit = defineEmits<{ select: [entity: EntityView] }>()

const text = computed(() => props.label ?? props.entity.title)
</script>

<template>
  <component
    :is="static ? 'span' : BlrResourceLink"
    :resource-key="static ? undefined : entity.key"
    class="inline-flex max-w-full items-baseline gap-1.5 rounded-full border px-2 py-0.5 font-sans text-xs leading-[1.125rem] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    :class="muted
      ? 'border-dashed border-muted bg-transparent font-normal text-muted hover:border-default hover:text-default'
      : 'border-default bg-elevated/60 font-medium text-highlighted hover:border-accented hover:bg-elevated'"
    :aria-label="static ? undefined : `Open Entity ${text}`"
    data-entity-chip
    :data-muted="muted || undefined"
    @open="emit('select', entity)"
  >
    <BlrEntityMark
      :facet="entityFacetOf(entity) ?? 'kept'"
      :acts="entity.acts"
      size="xs"
      class="shrink-0 self-center"
      :style="{ opacity: muted ? 0.55 : 1 }"
    />
    <span class="min-w-0 truncate">{{ text }}</span>
    <slot />
  </component>
</template>
