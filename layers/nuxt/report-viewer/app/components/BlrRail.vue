<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import { MAIN_RESOURCE_KINDS, MATRIX_DESTINATIONS } from '../utils/reportDestinations'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  activeSection: string
  counts: Record<ReportResourceKind, number>
  collapsed?: boolean
}>()

/* The rail changes the subject. A collection's Graph stays inside it. */
const emit = defineEmits<{ kind: [kind: ReportResourceKind], view: [section: string] }>()

type RailItem = NavigationMenuItem & { iconColor?: string, count?: number }
const RAIL_KINDS = MAIN_RESOURCE_KINDS.map(kind => ENTITY_KIND_META[kind])
const overviewItems = computed<RailItem[]>(() => [{
  label: 'Overview',
  icon: ENTITY_KIND_META.product.icon,
  iconColor: `var(--blr-slot-${ENTITY_KIND_META.product.slot})`,
  active: props.activeSection === 'overview',
  'data-current': props.activeSection === 'overview',
  'aria-label': 'Overview',
  onSelect: () => emit('kind', 'product')
}])
const items = computed<RailItem[][]>(() => [
  [
    ...MATRIX_DESTINATIONS.map(item => ({
      label: item.name,
      icon: item.icon,
      active: props.activeSection === item.section,
      'data-current': props.activeSection === item.section,
      'aria-label': item.name,
      onSelect: () => emit('view', item.section)
    }))
  ],
  [
    { label: 'Resources', type: 'label' },
    ...RAIL_KINDS.map(meta => ({
      label: meta.plural,
      icon: meta.icon,
      iconColor: `var(--blr-slot-${meta.slot})`,
      count: props.counts[meta.kind],
      active: props.activeSection === meta.kind,
      'data-current': props.activeSection === meta.kind,
      'aria-label': meta.plural,
      onSelect: () => emit('kind', meta.kind)
    }))
  ]
])
const menuUi = computed(() => ({
  link: ['blr-navitem gap-2.5 font-normal data-[current=true]:font-semibold', props.collapsed ? 'min-h-8 justify-center' : 'px-2.5'],
  label: 'px-2.5 pt-3 pb-1 font-mono text-[10px] tracking-widest uppercase text-dimmed'
}))
</script>

<template>
  <div>
    <div v-if="$slots.navigation" class="mb-1 border-b border-default px-1 pb-2">
      <slot name="navigation" :collapsed="collapsed" />
    </div>
    <UNavigationMenu
      :items="items"
      :collapsed="collapsed"
      orientation="vertical"
      color="neutral"
      tooltip
      aria-label="Report sections"
      :ui="menuUi"
    >
      <template #list-leading>
        <div data-report-overview-actions class="flex" :class="collapsed ? 'flex-col' : 'items-center gap-1'">
          <UNavigationMenu
            :items="overviewItems"
            :collapsed="collapsed"
            orientation="vertical"
            color="neutral"
            tooltip
            aria-label="Report overview"
            :class="collapsed ? 'w-full' : 'min-w-0 flex-1'"
            :ui="menuUi"
          >
            <template #item-leading="{ item }">
              <UIcon v-if="item.icon" :name="item.icon" class="shrink-0" :class="collapsed ? 'size-[17px]' : 'size-4'" :style="{ color: item.iconColor }" />
            </template>
          </UNavigationMenu>
          <slot name="overview-action" />
        </div>
      </template>
      <template #item-leading="{ item }">
        <UIcon v-if="item.icon" :name="item.icon" class="shrink-0" :class="collapsed ? 'size-[17px]' : 'size-4'" :style="{ color: item.iconColor }" />
      </template>
      <template #item-trailing="{ item }">
        <span v-if="!collapsed && item.count !== undefined" class="blr-meta">{{ item.count }}</span>
      </template>
    </UNavigationMenu>
  </div>
</template>
