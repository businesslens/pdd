<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import { MAIN_RESOURCE_KINDS } from '../utils/reportDestinations'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  activeSection: string
  counts: Record<ReportResourceKind, number>
  collapsed?: boolean
}>()

/* The rail changes the subject. Each collection keeps its drawings inside it. */
const emit = defineEmits<{ kind: [kind: ReportResourceKind] }>()

type RailItem = NavigationMenuItem & { iconColor?: string, count?: number }
const RAIL_KINDS = MAIN_RESOURCE_KINDS.map(kind => ENTITY_KIND_META[kind])
const activeColor = computed(() => {
  const meta = props.activeSection === 'overview'
    ? ENTITY_KIND_META.product
    : RAIL_KINDS.find(kind => kind.kind === props.activeSection)
  return meta ? `var(--blr-slot-${meta.slot})` : 'var(--ui-text-muted)'
})
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
  root: 'gap-1',
  list: 'flex flex-col gap-1',
  link: ['blr-navitem min-h-9 gap-2.5 font-normal data-[current=true]:font-semibold', props.collapsed ? 'justify-center' : 'px-2.5'],
  label: 'px-2.5 pt-0 pb-1 font-mono text-[10px] tracking-widest uppercase text-dimmed',
  separator: 'h-4 bg-transparent'
}))
</script>

<template>
  <div :style="{ '--blr-rail-active-color': activeColor }">
    <div v-if="$slots.navigation" class="mb-4 px-1">
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
        <div data-report-overview-actions class="flex gap-1" :class="collapsed ? 'flex-col' : 'items-center'">
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

<style scoped>
/* Keep Nuxt UI's navigation and focus treatment, with the original rail tint. */
:deep(.blr-navitem[data-current='true']::before) {
  background: color-mix(in srgb, var(--blr-rail-active-color) 10%, var(--ui-bg-elevated));
  box-shadow: inset 2px 0 0 var(--blr-rail-active-color);
}
</style>
