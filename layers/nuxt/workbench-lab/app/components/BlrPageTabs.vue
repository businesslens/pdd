<script setup lang="ts">
/**
 * Page · Tabs — the sections as named destinations.
 *
 * The most direct answer to "the page is too occupied": show one part at a
 * time, and let the strip say what the other parts are and how much is in them.
 * A reader who came for the Scenarios never scrolls past the Connections.
 *
 * The cost is that you cannot see two at once, and an empty tab still occupies
 * the strip — so tabs with nothing in them are not rendered at all, and each
 * carries its count rather than making you open it to find out.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { sectionsFor, type PageSectionId } from '../utils/pageSections'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  selectedKey?: string | null
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
  focus: [entity: AnyEntityView]
}>()

const sections = computed(() => sectionsFor(props.workspace, props.entity))
const active = ref<PageSectionId>('overview')

/* A tab that does not exist on the next entity would otherwise leave the page
   blank; fall back to the first one the new entity actually has. */
watch(sections, (list) => {
  if (!list.some(section => section.id === active.value)) active.value = list[0]?.id ?? 'overview'
}, { immediate: true })

const current = computed(() => sections.value.find(section => section.id === active.value) ?? sections.value[0])
</script>

<template>
  <article class="space-y-6">
    <BlrPageHeader
      :workspace="workspace"
      :entity="entity"
      @open="emit('open', $event)"
      @focus="emit('focus', $event)"
    />

    <div class="flex flex-wrap items-center gap-1 border-b border-default">
      <button
        v-for="section in sections"
        :key="section.id"
        type="button"
        class="blr-pagetab"
        :data-current="section.id === active"
        @click="active = section.id"
      >
        {{ section.label }}
        <span v-if="section.count !== undefined" class="blr-meta">{{ section.count }}</span>
      </button>
    </div>

    <div class="space-y-3">
      <p v-if="current?.hint" class="text-xs text-muted">{{ current.hint }}</p>
      <BlrPageSection
        v-if="current"
        :key="`${entity.key}:${current.id}`"
        :workspace="workspace"
        :entity="entity"
        :id="current.id"
        :selected-key="selectedKey"
        @select="emit('select', $event)"
        @open="emit('open', $event)"
        @focus="emit('focus', $event)"
      />
    </div>
  </article>
</template>

<style scoped>
.blr-pagetab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
  transition: color 0.12s ease, border-color 0.12s ease;
}

.blr-pagetab:hover {
  color: var(--ui-text-highlighted);
}

.blr-pagetab[data-current='true'] {
  border-bottom-color: var(--ui-color-primary-500);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}
</style>
