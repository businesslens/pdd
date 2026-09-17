<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
const { pddVersion } = useRuntimeConfig().public
</script>

<template>
  <div class="flex min-w-0 items-center" :class="collapsed ? 'justify-center' : 'gap-2'" data-local-viewer-brand>
    <UTooltip :text="`BusinessLens v${pddVersion}`" :disabled="!collapsed" :content="{ side: 'right' }">
      <NuxtLink
        to="https://businesslens.io"
        external
        target="_blank"
        rel="noopener noreferrer"
        aria-label="BusinessLens"
        class="flex min-w-0 items-center"
      >
        <BusinessLensBrand :wordmark-height="18" :mark-only="collapsed" />
      </NuxtLink>
    </UTooltip>
    <UBadge v-if="!collapsed" color="neutral" variant="subtle" size="sm" data-pdd-version class="shrink-0 rounded-full font-mono text-[11px]">
      <span class="sr-only">PDD version {{ pddVersion }}</span>
      <span aria-hidden="true">v{{ pddVersion }}</span>
    </UBadge>
  </div>
</template>
