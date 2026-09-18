<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
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
        class="min-h-9 w-full gap-2.5 text-sm font-normal text-muted hover:text-highlighted"
        :class="collapsed ? 'justify-center' : 'justify-start'"
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
        class="min-h-9 w-full gap-2.5 text-sm font-normal text-muted hover:text-highlighted"
        :class="collapsed ? 'justify-center' : 'justify-start'"
        :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4', trailingIcon: 'ms-auto size-3' }"
        aria-label="BusinessLens on GitHub"
      />
    </UTooltip>
  </div>
</template>
