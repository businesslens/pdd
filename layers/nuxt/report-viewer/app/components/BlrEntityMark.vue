<script setup lang="ts">
/**
 * An Entity drawn by the facet it plays: a person, a system, or a thing kept.
 *
 * There is one resource type for things, so the type glyph says only "a thing
 * of some kind" and cannot tell one row of a collection from the next. Here the
 * mark spends its slot on the facet instead, and the subset that does not act
 * is a value like the other two rather than a fallthrough to the type.
 *
 * An Actor carries two independent authored axes where one glyph can only carry
 * one. The silhouette takes the facet, at the same size as every other kind's mark.
 * Which side of the Product boundary it `acts` from is written as a word
 * wherever the surface has room — the card's title badge, the graph node's
 * sublabel, the peek's fact list — rather than stacked under the glyph, where it
 * sized the gutter it sat in and was dropped everywhere it did not fit.
 *
 * Both classifications still reach a reader from the mark alone, through the
 * tooltip.
 */
import type { ActingSide, EntityFacet } from '../utils/reportWorkspace'
import { ENTITY_FACET_META, ACTOR_ACTS_META } from '../utils/reportWorkspace'
import { slotColor } from '../utils/reportPalette'

const props = withDefaults(defineProps<{
  facet: EntityFacet
  /** Null for a thing that does not act; an Actor states the side it acts from. */
  acts?: ActingSide | null
  size?: 'xs' | 'sm'
}>(), { acts: null, size: 'sm' })

const facetMeta = computed(() => ENTITY_FACET_META[props.facet])
const explanation = computed(() => {
  if (props.facet === 'kept') return 'A thing the Product keeps, which does not act on it'
  const noun = facetMeta.value.label.toLowerCase()
  return props.acts
    ? `${ACTOR_ACTS_META[props.acts].label} ${noun} that acts on the Product`
    : `A ${noun} that acts on the Product`
})
const colorMode = useColorMode()
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
const entityColor = computed(() => slotColor(0, mounted.value && colorMode.value === 'dark'))
</script>

<template>
  <UTooltip :text="explanation" :delay-duration="150">
    <span
      class="blr-entity-mark"
      :data-size="size"
      role="img"
      :aria-label="explanation"
    >
      <UIcon :name="facetMeta.icon" class="blr-entity-mark__facet" :style="{ color: entityColor }" />
    </span>
  </UTooltip>
</template>

<style scoped>
/*
  The shared resource scale, not an Entity-specific one: nothing sits on top of
  this glyph, so the mark occupies exactly the box every other kind's does and a
  collection gutter stays a single column of aligned icons.
*/
.blr-entity-mark {
  display: inline-flex;
  width: var(--blr-resource-mark-regular);
  height: var(--blr-resource-mark-regular);
  flex: 0 0 var(--blr-resource-mark-regular);
  align-items: center;
  justify-content: center;
}

.blr-entity-mark__facet {
  width: 100%;
  height: 100%;
}

.blr-entity-mark[data-size='xs'] {
  width: var(--blr-resource-mark-dense);
  height: var(--blr-resource-mark-dense);
  flex-basis: var(--blr-resource-mark-dense);
}
</style>
