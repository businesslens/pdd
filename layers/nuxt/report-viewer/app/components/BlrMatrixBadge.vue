<script setup lang="ts">
import type { MatrixBadgeTone } from '../utils/matrixBadges'

const props = defineProps<{
  label: string
  tone: MatrixBadgeTone
  accessibleLabel: string
  viewKey: string
  contentKey: unknown
}>()
const emit = defineEmits<{ open: [key: string] }>()
const open = ref(false)
let handingOffFocus = false

watch(open, value => { if (value) handingOffFocus = false })
// Paging keeps cells mounted. Dismiss portaled details when their view changes.
watch([() => props.viewKey, () => props.contentKey], () => {
  handingOffFocus = true
  open.value = false
})
function follow(key: string) {
  handingOffFocus = true
  open.value = false
  emit('open', key)
}
function onCloseAutoFocus(event: Event) {
  if (handingOffFocus) event.preventDefault()
}
</script>

<template>
  <UPopover v-model:open="open"
    :content="{ align: 'start', collisionPadding: 16, onCloseAutoFocus }"
    :ui="{ content: 'blr-matrix-popover' }">
    <button type="button" class="blr-matrix-badge" :data-effect="label" :data-tone="tone" :aria-label="accessibleLabel">
      {{ label }}<UIcon name="i-lucide-chevron-down" aria-hidden="true" />
    </button>
    <template #content>
      <div class="blr-matrix-popover-heading">
        <h3 class="blr-matrix-popover-resource"><slot name="heading" :follow="follow" /></h3>
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" aria-label="Close badge details" @click="open = false" />
      </div>
      <div class="blr-matrix-popover-body"><slot :follow="follow" /></div>
    </template>
  </UPopover>
</template>
