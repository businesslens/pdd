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
 * The page's name, its type, and the ways out of it belong to the surface and
 * are drawn by the host above this component — an exit leads out of the
 * resource whichever tab is open, so it is not part of the strip. With one tab
 * there is nothing to switch, and the strip does not render.
 *
 * The open tab is bindable, so a host can keep it in the URL: a Lifecycle a
 * reader cannot link to, return to, or refresh into is a modal with extra
 * steps, and `businesslens view` recompiles on save, so the tab has to outlive
 * an edit to the model.
 */
import type { AnyResourceView, EntityView, ReportWorkspace } from '../utils/reportWorkspace'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading } from '../utils/topologyState'
import { parentOf, tabsFor, type PageTabId } from '../utils/pageSections'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
}>()

const emit = defineEmits<{
  open: [resource: AnyResourceView]
  ready: []
}>()

const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })
const reading = defineModel<TopologyReading>('reading', { default: defaultTopologyReading })

const parent = computed(() => parentOf(props.workspace, props.resource))
const subject = computed(() => parent.value ?? props.resource)
const requestedChild = computed(() => parent.value ? props.resource.key : null)
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
watch([tabs, requestedChild, tab], () => {
  if (requestedChild.value && isTab('scenarios')) {
    active.value = 'scenarios'
    return
  }
  active.value = isTab(tab.value) ? tab.value : 'overview'
}, { immediate: true })

function select(id: PageTabId) {
  if (id === 'overview' && requestedChild.value) emit('open', subject.value)
  active.value = id
  tab.value = id
}

const current = computed(() => tabs.value.find(tab => tab.id === active.value) ?? tabs.value[0])
</script>

<template>
  <div class="min-w-0">
    <nav
      v-if="tabs.length > 1"
      data-sticky-page-tabs
      class="sticky top-0 z-20 -mt-5 mb-5 flex flex-wrap items-center gap-1 border-b border-default bg-default/95 pt-5 backdrop-blur"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="blr-surface-tab"
        :data-current="tab.id === active"
        :aria-selected="tab.id === active"
        @click="select(tab.id)"
      >
        <span class="min-w-0 truncate">{{ tab.label }}</span>
        <span v-if="tab.count !== undefined" class="blr-meta">{{ tab.count }}</span>
      </button>
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
        @ready="emit('ready')"
      />

      <template v-else>
        <BlrPageBlock
          v-for="id in current?.blocks ?? []"
          :key="id"
          v-model:reading="reading"
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

