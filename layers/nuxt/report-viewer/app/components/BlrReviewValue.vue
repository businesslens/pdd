<script setup lang="ts">
import { resourceReviewKey, reviewValueChange } from '../utils/resourceReview'
import { reviewChangeMeta } from '../utils/reviewModel'

const props = defineProps<{ before?: unknown, after?: unknown, inline?: boolean, long?: boolean, label?: string }>()
const review = inject(resourceReviewKey, computed(() => null))
const change = computed(() => review.value ? reviewValueChange(props.before, props.after) : null)
const expanded = ref(false)
const slots = useSlots()
const previous = computed(() => typeof props.before === 'string' || typeof props.before === 'number' ? String(props.before) : '')
const disclosure = computed(() => props.long || previous.value.length > 100 || !!slots.before)
</script>

<template>
  <component v-if="change" :is="inline ? 'span' : 'div'" :class="['blr-review-value', inline && 'inline']" :data-inline-change="change" :data-review-field="label">
    <slot />
    <span v-if="change" class="ms-2 inline-flex items-center gap-2 align-baseline text-xs font-normal">
      <span class="blr-matrix-tone rounded border px-1.5 py-0.5" :data-tone="reviewChangeMeta[change].tone">{{ change === 'deleted' ? 'Removed' : reviewChangeMeta[change].label }}</span>
      <button v-if="change === 'modified' && disclosure" type="button" class="text-muted underline decoration-dotted underline-offset-2" :aria-expanded="expanded" @click.stop="expanded = !expanded">{{ expanded ? 'Hide previous' : 'Show previous' }}</button>
    </span>
    <span v-if="change === 'modified' && !disclosure && previous" class="mt-1 block text-xs font-normal text-muted">Previously: {{ previous }}</span>
    <div v-if="change === 'modified' && disclosure && expanded" class="mt-2 border-s-2 border-default ps-3 text-sm font-normal" data-previous-value>
      <p class="mb-1 text-xs text-muted">Previously</p>
      <slot name="before"><BlrProse v-if="long" :text="previous" /><p v-else>{{ previous }}</p></slot>
    </div>
  </component>
  <slot v-else />
</template>

<style scoped>
.blr-review-value { border-inline-start: 2px solid var(--ui-border-accented); padding-inline-start: 0.5rem; }
.blr-review-value[data-inline-change='added'] { border-color: var(--ui-color-success-500); }
.blr-review-value[data-inline-change='modified'] { border-color: var(--ui-color-warning-500); }
.blr-review-value[data-inline-change='deleted'] { border-color: var(--ui-color-error-500); }
</style>
