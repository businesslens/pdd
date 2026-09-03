<script setup lang="ts">
/**
 * One resource reading, at one URL.
 *
 * Overview holds the resource's authored meaning, facts, Contexts, relations,
 * supporting material, and References. A Capability or Journey adds exactly
 * one peer tab for its Scenarios, and an Entity with States one for its
 * Lifecycle. A Scenario URL keeps the Scenario key in the address while
 * reading it inside its mandatory parent.
 */
import type { AnyResourceView, EntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { docsForResourceKind } from '../utils/resourceDocs'
import { parentOf, tabsFor, type PageTabId } from '../utils/pageSections'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
}>()

const emit = defineEmits<{
  open: [resource: AnyResourceView]
  focus: [resource: AnyResourceView]
}>()

const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })

const parent = computed(() => parentOf(props.workspace, props.resource))
const subject = computed(() => parent.value ?? props.resource)
const requestedChild = computed(() => parent.value ? props.resource.key : null)
const pageDocs = computed(() => docsForResourceKind(subject.value.kind))
const tabs = computed(() => tabsFor(props.workspace, subject.value))
const active = ref<PageTabId>('overview')

watch([tabs, requestedChild], () => {
  if (requestedChild.value && tabs.value.some(tab => tab.id === 'scenarios')) {
    active.value = 'scenarios'
    return
  }
  if (!tabs.value.some(tab => tab.id === active.value)) active.value = 'overview'
}, { immediate: true })

const current = computed(() => tabs.value.find(tab => tab.id === active.value) ?? tabs.value[0])
</script>

<template>
  <div class="-mt-5 min-w-0">
    <nav
      data-sticky-page-tabs
      class="sticky top-0 z-20 mb-5 flex flex-wrap items-center gap-1 border-b border-default bg-default/95 pt-5 backdrop-blur"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="blr-page-tab"
        :data-current="tab.id === active"
        @click="active = tab.id"
      >
        <span class="min-w-0 truncate">{{ tab.label }}</span>
        <span v-if="tab.count !== undefined" class="blr-meta">{{ tab.count }}</span>
      </button>

      <div class="ms-auto mb-1 flex items-center gap-1.5">
        <UTooltip :text="pageDocs.label">
          <UButton
            :to="pageDocs.url"
            external
            target="_blank"
            rel="noopener noreferrer"
            icon="i-lucide-book-open"
            color="neutral"
            variant="outline"
            size="xs"
            label="Docs"
            :aria-label="pageDocs.label"
          />
        </UTooltip>
        <UTooltip text="Show this resource on the topology canvas">
          <UButton
            icon="i-lucide-waypoints"
            color="neutral"
            variant="outline"
            size="xs"
            label="Neighbourhood"
            @click="emit('focus', subject)"
          />
        </UTooltip>
      </div>
    </nav>

    <div class="min-w-0 space-y-5">
      <p v-if="current?.hint" class="text-xs text-muted">{{ current.hint }}</p>

      <BlrScenarios
        v-if="current?.id === 'scenarios'"
        v-model:scenario-route="scenarioRoute"
        v-model:route-columns="routeColumns"
        :workspace="workspace"
        :resource="subject"
        :selected-key="requestedChild"
        @open="emit('open', $event)"
      />

      <BlrEntityLifecycle
        v-else-if="current?.id === 'lifecycle' && subject.kind === 'entity'"
        :workspace="workspace"
        :resource="(subject as EntityView)"
        @open="emit('open', $event)"
      />

      <template v-else>
        <BlrPageBlock
          v-for="id in current?.blocks ?? []"
          :key="id"
          :workspace="workspace"
          :resource="subject"
          :id="id"
          heading
          @open="emit('open', $event)"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.blr-page-tab {
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

.blr-page-tab:hover {
  color: var(--ui-text-highlighted);
}

.blr-page-tab[data-current='true'] {
  border-bottom-color: var(--ui-color-primary-500);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}
</style>
