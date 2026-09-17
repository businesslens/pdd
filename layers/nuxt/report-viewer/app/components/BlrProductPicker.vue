<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { ReportProductLink } from '../utils/reportProducts'

const props = defineProps<{
  title: string
  logoSrc?: string | null
  products?: ReportProductLink[]
  collapsed?: boolean
}>()
const emit = defineEmits<{ navigate: [] }>()
const open = ref(false)

type ProductItem = DropdownMenuItem & { logoSrc?: string | null, current?: boolean }
const items = computed<ProductItem[]>(() => [
  { label: props.title, logoSrc: props.logoSrc, current: true, 'aria-current': 'true' },
  ...(props.products ?? []).filter(product => !product.active).map(product => ({
    label: product.label,
    logoSrc: product.logoSrc,
    to: product.to,
    onSelect: () => emit('navigate')
  }))
])
</script>

<template>
  <UDropdownMenu
    v-model:open="open"
    :modal="false"
    :items="items"
    :content="{ side: collapsed ? 'right' : 'bottom', align: 'start', sideOffset: 6 }"
    size="sm"
    :ui="{ content: 'w-64 max-w-[calc(100vw-2rem)]', item: 'items-center gap-2.5 py-2 text-sm font-normal', itemLabel: 'whitespace-normal' }"
  >
    <UTooltip :text="title" :disabled="!collapsed || open" :content="{ side: 'right' }">
      <UButton
        data-report-product-picker
        :aria-label="`Choose product: ${title}`"
        color="neutral"
        variant="outline"
        size="sm"
        class="gap-2.5 text-sm font-normal"
        :class="collapsed ? 'mx-auto flex min-h-8 w-8 justify-center px-0' : 'min-h-11 w-full justify-start px-2.5'"
        :trailing-icon="collapsed ? undefined : 'i-lucide-chevron-down'"
        :ui="{ trailingIcon: 'ms-auto size-4 shrink-0 text-muted' }"
      >
        <BusinessLensProductLogo :src="logoSrc" class="shrink-0 rounded object-contain" :class="collapsed ? 'size-[17px]' : 'size-6'" />
        <span v-if="!collapsed" class="truncate">{{ title }}</span>
      </UButton>
    </UTooltip>
    <template #item-leading="{ item }">
      <BusinessLensProductLogo :src="item.logoSrc" class="size-6 shrink-0 rounded object-contain" />
    </template>
    <template #item-trailing="{ item }">
      <template v-if="item.current">
        <UIcon name="i-lucide-check" class="size-4 shrink-0" />
        <span class="sr-only">Current product</span>
      </template>
    </template>
  </UDropdownMenu>
</template>

<style scoped>
[data-report-product-picker] {
  background-color: transparent;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ui-border) 55%, transparent);
  color: var(--ui-text-muted);
}

[data-report-product-picker]:is(:hover, [aria-expanded="true"]) {
  background-color: color-mix(in oklab, var(--ui-bg-elevated) 65%, transparent);
  color: var(--ui-text-highlighted);
}
</style>
