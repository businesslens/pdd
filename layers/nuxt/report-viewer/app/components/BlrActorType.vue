<script setup lang="ts">
/**
 * A concrete Actor's authored `kind`, drawn as the Actor mark itself.
 *
 * Actor is the only kind carrying two independent authored axes, and one glyph
 * can only carry one of them. The silhouette takes `kind`, at the same size as
 * every other kind's mark. The Product-boundary `relationship` is written as a
 * word wherever the surface has room — the card's title badge, the graph node's
 * sublabel, the peek's fact list — rather than stacked under the glyph, where it
 * sized the gutter it sat in and was dropped everywhere it did not fit.
 *
 * Both classifications still reach a reader from the mark alone, through the
 * tooltip.
 */
import type { ActorView } from '../utils/reportWorkspace'
import { ACTOR_KIND_META, ACTOR_RELATIONSHIP_META } from '../utils/reportWorkspace'
import { slotColor } from '../utils/reportPalette'

const props = withDefaults(defineProps<{
  actorKind: ActorView['actorKind']
  relationship: ActorView['relationship']
  size?: 'xs' | 'sm'
}>(), { size: 'sm' })

const kindMeta = computed(() => ACTOR_KIND_META[props.actorKind])
const relationshipMeta = computed(() => ACTOR_RELATIONSHIP_META[props.relationship])
const explanation = computed(() => `${relationshipMeta.value.label} ${kindMeta.value.label.toLowerCase()} Actor`)
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
