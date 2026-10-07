<script setup lang="ts">
/**
 * ⌘K over the whole report.
 *
 * Pages come first: the rail's own destinations, under the labels the rail
 * prints, so a reader can move without returning to it. Every resource kind
 * follows, grouped in the fixed kind order so the same result always appears in
 * the same place. Selecting either hands it back to the Product Report, which
 * opens a page exactly as the rail does. The two Scenario collections are
 * separate kinds, so they fall out as separate groups without a special case.
 */
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'
import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import { REPORT_PAGES } from '../utils/reportDestinations'
import { REPORT_ENTITY_KINDS } from '../utils/reportWorkspace'
import { resourcesOfKind } from '../utils/resourceFacets'
import { firstSentence } from '../utils/reportMarkdown'
import { variationSetOf } from '../utils/variations'

const props = defineProps<{ workspace: ReportWorkspace }>()
const emit = defineEmits<{ select: [resource: AnyResourceView], page: [kind: ReportResourceKind] }>()

const open = defineModel<boolean>('open', { default: false })

/* `meta` is ⌘ on macOS and Ctrl elsewhere, so one binding covers both. */
defineShortcuts({
  meta_k: () => {
    open.value = !open.value
  }
})

function choose(resource: AnyResourceView) {
  emit('select', resource)
  open.value = false
}

function go(kind: ReportResourceKind) {
  emit('page', kind)
  open.value = false
}

const pages: CommandPaletteGroup<CommandPaletteItem> = {
  id: 'pages',
  label: 'Pages',
  items: REPORT_PAGES.map(page => ({ label: page.label, icon: page.icon, onSelect: () => go(page.kind) }))
}

/* A result keeps the name that matched. A Variation wears its set mark; an
   alternative adds a chip naming its Variation, the fact the name alone hides. */
function items(resources: AnyResourceView[], icon: string): CommandPaletteItem[] {
  return resources.map(resource => ({
    label: resource.title,
    description: firstSentence(resource.lead, 90),
    suffix: resource.id,
    icon,
    ...(resource.kind === 'variation' || resource.variation ? { slot: 'varied' as const, resource, set: variationSetOf(props.workspace, resource) } : {}),
    onSelect: () => choose(resource)
  }))
}

const groups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() => [
  pages,
  ...REPORT_ENTITY_KINDS
    .map(meta => ({
      id: meta.kind,
      label: meta.plural,
      items: items(resourcesOfKind(props.workspace, meta.kind), meta.icon)
    }))
    .filter(group => group.items.length)
])
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'blr-search-palette sm:max-w-2xl' }">
    <template #content>
      <UCommandPalette
        :groups="groups"
        placeholder="Search pages and resources…"
        :fuse="{ fuseOptions: { keys: ['label', 'description', 'suffix'] } }"
        close
        class="h-96"
        @update:open="open = $event"
      >
        <template #varied-leading="{ item }">
          <BlrKind v-if="item.resource.kind === 'variation'" kind="variation" :member-kind="item.resource.memberKind" :facet="item.resource.memberFacet" :labelled="false" class="shrink-0" />
          <UIcon v-else :name="item.icon" class="size-5 shrink-0 text-dimmed" />
        </template>
        <template #varied-label="{ item, ui }">
          <span :class="ui.itemLabelBase()">{{ item.label }}</span>
          <span :class="ui.itemLabelSuffix()">{{ item.suffix }}</span>
          <span v-if="item.resource.kind !== 'variation' && item.set" class="blr-search-set" data-search-variation>
            <BlrKind kind="variation" :member-kind="item.set.memberKind" :facet="item.set.memberFacet" :labelled="false" size="xs" aria-hidden="true" />{{ item.set.title }}
          </span>
        </template>
        <template #empty>
          <p class="p-6 text-center text-sm text-muted italic">
            No page or resource matches that.
          </p>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>

<style scoped>
.blr-search-set { display: inline-flex; align-items: center; gap: 4px; margin-inline-start: 8px; padding: 0 6px; border: 1px solid var(--ui-border-accented); border-radius: 5px; background: var(--ui-bg-elevated); font-size: 11px; font-weight: 500; line-height: 18px; color: var(--ui-text-highlighted); vertical-align: 1px; }
</style>
