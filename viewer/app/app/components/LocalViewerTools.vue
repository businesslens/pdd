<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
const { visible: themeLabVisible, toggle: toggleThemeLab } = useBusinessLensThemeLab()
</script>

<template>
  <div class="grid gap-1" data-local-viewer-tools>
    <UTooltip text="Documentation" :disabled="!collapsed" :content="{ side: 'right' }">
      <UButton
        :label="collapsed ? undefined : 'Documentation'"
        :square="collapsed"
        aria-label="Documentation"
        to="https://businesslens.io/docs"
        external
        target="_blank"
        rel="noopener noreferrer"
        icon="i-lucide-book-open"
        :trailing-icon="collapsed ? undefined : 'i-lucide-arrow-up-right'"
        color="neutral"
        variant="ghost"
        size="sm"
        class="w-full"
        :class="collapsed ? 'min-h-8 justify-center' : 'justify-start'"
        :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4', trailingIcon: 'ms-auto size-3' }"
      />
    </UTooltip>
    <UTooltip text="GitHub" :disabled="!collapsed" :content="{ side: 'right' }">
      <UButton
        :label="collapsed ? undefined : 'GitHub'"
        :square="collapsed"
        to="https://github.com/businesslens/pdd"
        external
        target="_blank"
        rel="noopener noreferrer"
        icon="i-simple-icons-github"
        :trailing-icon="collapsed ? undefined : 'i-lucide-arrow-up-right'"
        color="neutral"
        variant="ghost"
        size="sm"
        class="w-full"
        :class="collapsed ? 'min-h-8 justify-center' : 'justify-start'"
        :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4', trailingIcon: 'ms-auto size-3' }"
        aria-label="BusinessLens on GitHub"
      />
    </UTooltip>
    <UTooltip text="Theme lab" :disabled="!collapsed" :content="{ side: 'right' }">
      <UButton
        :label="collapsed ? undefined : 'Theme lab'"
        :square="collapsed"
        icon="i-lucide-sliders-horizontal"
        color="neutral"
        :variant="themeLabVisible ? 'soft' : 'ghost'"
        size="sm"
        class="w-full"
        :class="collapsed ? 'min-h-8 justify-center' : 'justify-start'"
        :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4' }"
        :aria-label="themeLabVisible ? 'Hide theme lab' : 'Show theme lab'"
        :aria-pressed="themeLabVisible"
        @click="toggleThemeLab"
      />
    </UTooltip>
    <div class="mt-2 flex items-center border-t border-default pt-3" :class="collapsed ? 'justify-center' : 'justify-end px-2'">
      <UTooltip text="Toggle color mode" :content="{ side: 'right' }">
        <UColorModeButton color="neutral" variant="ghost" size="sm" aria-label="Toggle color mode" :class="{ 'min-h-8': collapsed }" :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4' }" />
      </UTooltip>
    </div>
  </div>
</template>
