<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import { REPORT_PAGES } from '../utils/reportDestinations'

const props = defineProps<{
  workspace: ReportWorkspace
  activeSection: string
  counts: Record<ReportResourceKind, number>
  collapsed?: boolean
}>()

/* The rail changes the subject. Each collection keeps its drawings inside it. */
const emit = defineEmits<{ kind: [kind: ReportResourceKind] }>()

type RailItem = NavigationMenuItem & { iconColor?: string, count?: number }
const [OVERVIEW, ...COLLECTIONS] = REPORT_PAGES
const sectionOf = (kind: ReportResourceKind) => kind === 'product' ? 'overview' : kind
const activeColor = computed(() => {
  const page = REPORT_PAGES.find(item => sectionOf(item.kind) === props.activeSection)
  return page ? `var(--blr-slot-${page.slot})` : 'var(--ui-text-muted)'
})
const railItem = (page: typeof REPORT_PAGES[number]): RailItem => ({
  label: page.label,
  icon: page.icon,
  iconColor: `var(--blr-slot-${page.slot})`,
  active: props.activeSection === sectionOf(page.kind),
  'data-current': props.activeSection === sectionOf(page.kind),
  'aria-label': page.label,
  onSelect: () => emit('kind', page.kind)
})
const overviewItems = computed<RailItem[]>(() => [railItem(OVERVIEW!)])
const items = computed<RailItem[][]>(() => [
  [
    { label: 'Resources', type: 'label' },
    ...COLLECTIONS.map(page => ({ ...railItem(page), count: props.counts[page.kind] }))
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
        <!-- Overview is the Product's own page; a gap sets it apart from the collections below. -->
        <div data-report-overview-actions class="mb-4 flex gap-1" :class="collapsed ? 'flex-col' : 'items-center'">
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
