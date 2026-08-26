<script setup lang="ts">
/**
 * ⌘K over the whole model.
 *
 * One palette for every element kind, grouped in the fixed kind order so the
 * same result always appears in the same place. Selecting a result hands the
 * element back to the Product Report. The two Scenario collections are separate
 * kinds, so they fall out as separate groups without a special case.
 */
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'
import type { AnyElementView, ReportWorkspace } from '../utils/reportWorkspace'
import { REPORT_ENTITY_KINDS } from '../utils/reportWorkspace'
import { elementsOfKind } from '../utils/elementFacets'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{ workspace: ReportWorkspace }>()
const emit = defineEmits<{ select: [element: AnyElementView] }>()

const open = defineModel<boolean>('open', { default: false })

/* `meta` is ⌘ on macOS and Ctrl elsewhere, so one binding covers both. */
defineShortcuts({
  meta_k: () => {
    open.value = !open.value
  }
})

function choose(element: AnyElementView) {
  emit('select', element)
  open.value = false
}

function items(elements: AnyElementView[], icon: string): CommandPaletteItem[] {
  return elements.map(element => ({
    label: element.title,
    description: firstSentence(element.lead, 90),
    suffix: element.id,
    icon,
    onSelect: () => choose(element)
  }))
}

const groups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() =>
  REPORT_ENTITY_KINDS
    .map(meta => ({
      id: meta.kind,
      label: meta.plural,
      items: items(elementsOfKind(props.workspace, meta.kind), meta.icon)
    }))
    .filter(group => group.items.length))
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-2xl' }">
    <template #content>
      <UCommandPalette
        :groups="groups"
        placeholder="Search every element in this model…"
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
