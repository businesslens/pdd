<script setup lang="ts">
const props = withDefaults(defineProps<{
  rowCount?: 2 | 5
}>(), {
  rowCount: 2
})

const slots = useSlots()
const { visible } = useBusinessLensThemeLab()

useHead({
  htmlAttrs: {
    'data-businesslens-theme-lab-rows': computed(() => String(props.rowCount))
  }
})
</script>

<template>
  <div
    v-if="visible"
    data-businesslens-theme-lab-bar
    :data-row-count="rowCount"
    class="sticky top-0 z-[60] border-b border-default bg-elevated/85 backdrop-blur"
  >
    <slot name="before" />
    <BusinessLensThemeLabDivider v-if="slots.before" />
    <BusinessLensThemeLabBackgroundRow />
    <BusinessLensThemeLabDivider />
    <BusinessLensThemeLabLogoRow />
    <BusinessLensThemeLabDivider v-if="slots.after" />
    <slot name="after" />
  </div>
</template>
