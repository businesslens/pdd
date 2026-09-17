<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
const { pddVersion } = useRuntimeConfig().public
const { visible: themeLabVisible, toggle: toggleThemeLab } = useBusinessLensThemeLab()
</script>

<template>
  <div class="flex min-w-0 flex-1" :class="collapsed ? 'flex-col items-center gap-2' : 'items-start'" data-local-viewer-brand>
    <div class="flex min-w-0 flex-wrap items-center gap-1" :class="{ 'flex-1': !collapsed }">
      <UTooltip :text="`BusinessLens v${pddVersion}`" :disabled="!collapsed" :content="{ side: 'right' }">
        <NuxtLink
          to="https://businesslens.io"
          external
          target="_blank"
          rel="noopener noreferrer"
          aria-label="BusinessLens"
          class="flex min-h-8 shrink-0 items-center"
        >
          <BusinessLensBrand :wordmark-height="18" :mark-only="collapsed" />
        </NuxtLink>
      </UTooltip>
      <UBadge v-if="!collapsed" color="neutral" variant="subtle" size="sm" data-pdd-version class="shrink-0 rounded-full px-1 font-mono text-[11px]">
        <span class="sr-only">PDD version {{ pddVersion }}</span>
        <span aria-hidden="true">v{{ pddVersion }}</span>
      </UBadge>
    </div>
    <UTooltip text="Theme lab" :content="{ side: 'right' }">
      <UButton
        square
        icon="i-lucide-sliders-horizontal"
        color="neutral"
        :variant="themeLabVisible ? 'soft' : 'ghost'"
        size="sm"
        class="min-h-8 shrink-0 justify-center text-muted hover:text-highlighted"
        :class="{ 'min-w-8': collapsed }"
        :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4' }"
        :aria-label="themeLabVisible ? 'Hide theme lab' : 'Show theme lab'"
        :aria-pressed="themeLabVisible"
        @click="toggleThemeLab"
      />
    </UTooltip>
    <UTooltip text="Toggle color mode" :content="{ side: 'right' }">
      <UColorModeButton color="neutral" variant="ghost" size="sm" aria-label="Toggle color mode" class="min-h-8 min-w-8 shrink-0" :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4' }" />
    </UTooltip>
  </div>
</template>
