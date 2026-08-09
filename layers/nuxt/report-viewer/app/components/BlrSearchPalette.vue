<script setup lang="ts">
/**
 * ⌘K over the whole model.
 *
 * One palette for every entity kind, grouped in the fixed kind order so the
 * same result always appears in the same place. Selecting a result hands the
 * entity back to the Workbench. The two Scenario collections remain separate
 * search groups even though they share one rendered entity shape.
 */
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'
import type { AnyEntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { REPORT_ENTITY_KINDS } from '../utils/reportWorkspace'
import { entitiesOfKind } from '../utils/entityFacets'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{ workspace: ReportWorkspace }>()
const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

const open = defineModel<boolean>('open', { default: false })

/* `meta` is ⌘ on macOS and Ctrl elsewhere, so one binding covers both. */
defineShortcuts({
  meta_k: () => {
    open.value = !open.value
  }
})

function choose(entity: AnyEntityView) {
  emit('select', entity)
  open.value = false
}

function items(entities: AnyEntityView[], icon: string): CommandPaletteItem[] {
  return entities.map(entity => ({
    label: entity.title,
    description: firstSentence(entity.lead, 90),
    suffix: entity.id,
    icon,
    onSelect: () => choose(entity)
  }))
}

const groups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() =>
  REPORT_ENTITY_KINDS.flatMap((meta) => {
    if (meta.kind !== 'scenario') {
      const entities = entitiesOfKind(props.workspace, meta.kind)
      return [{ id: meta.kind, label: meta.plural, items: items(entities, meta.icon) }]
    }
    return [
      { id: 'capability-scenario', label: 'Capability Scenarios', items: items(props.workspace.capabilityScenarios, meta.icon) },
      { id: 'journey-scenario', label: 'Journey Scenarios', items: items(props.workspace.journeyScenarios, meta.icon) }
    ]
  }).filter(group => group.items.length))
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-2xl' }">
    <template #content>
      <UCommandPalette
        :groups="groups"
        placeholder="Search every entity in this model…"
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
