<script setup lang="ts">
import { resourceNavigationKey } from '../utils/resourceNavigation'
const props = defineProps<{ resourceKey: string }>()
const emit = defineEmits<{ open: [] }>()
const navigation = inject(resourceNavigationKey, null)
const href = computed(() => navigation?.href(props.resourceKey))
function select(event: MouseEvent) {
  event.stopPropagation()
  if (href.value && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return
  event.preventDefault()
  emit('open')
}
</script>

<template>
  <component :is="href ? 'a' : 'button'" :href="href" :type="href ? undefined : 'button'" :data-resource-key="resourceKey" @click="select"><slot /></component>
</template>
