<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** Rows the host actually renders, including anything in the slots. */
  rowCount?: 1 | 2 | 3 | 4 | 5
}>(), {
  rowCount: 1
})

const slots = useSlots()
const { visible } = usePddKitThemeLab()

useHead({
  htmlAttrs: {
    'data-pdd-kit-theme-lab-rows': computed(() => String(props.rowCount))
  }
})
</script>

<template>
  <div
    v-if="visible"
    data-pdd-kit-theme-lab-bar
    :data-row-count="rowCount"
    class="sticky top-0 z-[60] border-b border-default bg-elevated/85 backdrop-blur"
  >
    <slot name="before" />
    <PddKitThemeLabDivider v-if="slots.before" />
    <PddKitThemeLabBackgroundRow />
    <PddKitThemeLabDivider v-if="slots.after" />
    <slot name="after" />
  </div>
</template>
