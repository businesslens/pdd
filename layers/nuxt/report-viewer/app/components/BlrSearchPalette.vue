<script setup lang="ts">
/**
 * ⌘K over the whole model.
 *
 * One palette for every resource kind, grouped in the fixed kind order so the
 * same result always appears in the same place. Selecting a result hands the
 * resource back to the Product Report. The two Scenario collections are separate
 * kinds, so they fall out as separate groups without a special case.
 */
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { REPORT_ENTITY_KINDS } from '../utils/reportWorkspace'
import { resourcesOfKind } from '../utils/resourceFacets'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{ workspace: ReportWorkspace }>()
const emit = defineEmits<{ select: [resource: AnyResourceView] }>()

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

function items(resources: AnyResourceView[], icon: string): CommandPaletteItem[] {
  return resources.map(resource => ({
    label: resource.title,
    description: firstSentence(resource.lead, 90),
    suffix: resource.id,
    icon,
    onSelect: () => choose(resource)
  }))
}

const groups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() =>
  REPORT_ENTITY_KINDS
    .map(meta => ({
      id: meta.kind,
      label: meta.plural,
      items: items(resourcesOfKind(props.workspace, meta.kind), meta.icon)
    }))
    .filter(group => group.items.length))
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-2xl' }">
    <template #content>
      <UCommandPalette
        :groups="groups"
        placeholder="Search every resource in this model…"
        :fuse="{ fuseOptions: { keys: ['label', 'description', 'suffix'] } }"
        close
        class="h-96"
        @update:open="open = $event"
      >
        <template #empty>
          <p class="p-6 text-center text-sm text-muted italic">
            Nothing in this model matches that.
          </p>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>
