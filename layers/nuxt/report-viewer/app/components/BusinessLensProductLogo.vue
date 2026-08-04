<script setup lang="ts">
import placeholderSrc from '../assets/product-logo-placeholder.svg?url'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
}>(), {
  src: null,
  alt: ''
})

const failed = ref(false)
watch(() => props.src, () => {
  failed.value = false
})

const usesPlaceholder = computed(() => !props.src || failed.value)
const resolvedSrc = computed(() => usesPlaceholder.value ? placeholderSrc : props.src!)
</script>

<template>
  <img
    v-bind="$attrs"
    :src="resolvedSrc"
    :alt="alt"
    data-businesslens-logo
    :data-logo-source="src || undefined"
    :data-logo-fallback="usesPlaceholder ? 'true' : undefined"
    @error="failed = true"
  >
</template>
