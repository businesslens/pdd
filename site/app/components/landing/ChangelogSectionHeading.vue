<script setup lang="ts">
// A release's `### Added`, `### Fixed` or `### Contributors`, led by its mark.
// Every release repeats these headings, so their ids carry a `-n` suffix.
const { id } = defineProps<{ id?: string }>()
const icon = computed(() => id ? changelogSectionIcon(id.replace(/-\d+$/, '')) : undefined)
</script>

<template>
  <ProseH3 :id="id">
    <span class="inline-flex items-center gap-2">
      <UIcon v-if="icon" :name="icon" class="size-5 shrink-0 text-primary" />
      <slot />
    </span>
  </ProseH3>
</template>
