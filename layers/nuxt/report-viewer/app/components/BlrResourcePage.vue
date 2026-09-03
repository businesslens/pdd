<script setup lang="ts">
/**
 * One resource reading, at one URL.
 *
 * Overview holds the resource's authored meaning, facts, Contexts, relations,
 * supporting material, and References. A Capability or Journey adds exactly
 * one peer tab for its Scenarios, and an Entity with States one for its
 * Lifecycle. A Scenario URL keeps the Scenario key in the address while
 * reading it inside its mandatory parent.
 *
 * The open tab is bindable, so a host can keep it in the URL: a Lifecycle a
 * reader cannot link to, return to, or refresh into is a modal with extra
 * steps, and `businesslens view` recompiles on save, so the tab has to outlive
 * an edit to the model.
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

/**
 * The reader's chosen tab, as the host keeps it. `overview` is the default and
 * the value a host leaves out of the URL. It is read, never written back when
 * it does not fit: a tab the page does not have — `lifecycle` on an Entity
 * whose States were just edited away — falls back to the Overview on screen
 * and is there again when the States return.
 */
const tab = defineModel<string>('tab', { default: 'overview' })
const active = ref<PageTabId>('overview')
const isTab = (id: string): id is PageTabId => tabs.value.some(item => item.id === id)

/* A Scenario key in the address outranks the tab: reading a Scenario is
   reading the Scenarios tab, and the key alone says so in the URL. */
watch([tabs, requestedChild], () => {
  if (requestedChild.value && isTab('scenarios')) {
    active.value = 'scenarios'
    return
  }
  active.value = isTab(tab.value) ? tab.value : 'overview'
}, { immediate: true })

watch(tab, (value) => {
  active.value = isTab(value) ? value : 'overview'
})

function select(id: PageTabId) {
  active.value = id
  tab.value = id
}

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
        @click="select(tab.id)"
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
