<script setup lang="ts">
/**
 * An Entity that acts, drawn by its authored `kind` — the Actor mark.
 *
 * There is one resource type for things; an Actor is the subset that acts, and
 * it carries two independent authored axes where one glyph can only carry one.
 * The silhouette takes `kind`, at the same size as every other kind's mark.
 * Which side of the Product boundary it `acts` from is written as a word
 * wherever the surface has room — the card's title badge, the graph node's
 * sublabel, the peek's fact list — rather than stacked under the glyph, where it
 * sized the gutter it sat in and was dropped everywhere it did not fit.
 *
 * Both classifications still reach a reader from the mark alone, through the
 * tooltip.
 */
import type { ActingKind, ActingSide } from '../utils/reportWorkspace'
import { ACTOR_KIND_META, ACTOR_ACTS_META } from '../utils/reportWorkspace'
import { slotColor } from '../utils/reportPalette'

const props = withDefaults(defineProps<{
  actorKind: ActingKind
  acts: ActingSide
  size?: 'xs' | 'sm'
}>(), { size: 'sm' })

const kindMeta = computed(() => ACTOR_KIND_META[props.actorKind])
const actsMeta = computed(() => ACTOR_ACTS_META[props.acts])
const explanation = computed(() => `${actsMeta.value.label} ${kindMeta.value.label.toLowerCase()} that acts on the Product`)
const colorMode = useColorMode()
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
const actorColor = computed(() => slotColor(0, mounted.value && colorMode.value === 'dark'))
</script>

<template>
  <UTooltip :text="explanation" :delay-duration="150">
    <span
      class="blr-actor-mark"
      :data-size="size"
      role="img"
      :aria-label="explanation"
    >
      <UIcon :name="kindMeta.icon" class="blr-actor-mark__kind" :style="{ color: actorColor }" />
    </span>
  </UTooltip>
</template>

<style scoped>
/*
  The shared resource scale, not an Actor-specific one: nothing sits on top of
  this glyph, so an Actor's mark occupies exactly the box every other kind's
  does and a collection gutter stays a single column of aligned icons.
*/
.blr-actor-mark {
  display: inline-flex;
  width: var(--blr-resource-mark-regular);
  height: var(--blr-resource-mark-regular);
  flex: 0 0 var(--blr-resource-mark-regular);
  align-items: center;
  justify-content: center;
}

.blr-actor-mark__kind {
  width: 100%;
  height: 100%;
}

.blr-actor-mark[data-size='xs'] {
  width: var(--blr-resource-mark-dense);
  height: var(--blr-resource-mark-dense);
  flex-basis: var(--blr-resource-mark-dense);
}
</style>
