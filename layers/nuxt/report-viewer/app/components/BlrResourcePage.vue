<script setup lang="ts">
/** Complete resource content reused inside the URL-addressable slideover.
 * Scenarios remain inside their parent; Lifecycle belongs to an Entity.
 * The host places tabs above the scrolling reading and owns navigation.
 */
import type { AnyResourceView, EntityView, ReportWorkspace } from '../utils/reportWorkspace'
import type { ResourceChange } from 'businesslens/report'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading } from '../utils/topologyState'
import { parentOf, tabsFor, type PageTabId } from '../utils/pageSections'
import { resourceReviewKey, reviewResource } from '../utils/resourceReview'
import { comparisonReadings, readingChanged } from '../utils/resourceComparison'
import { COLUMN_CHOICES, type ColumnChoice } from '../composables/useColumns'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
  changes?: ReadonlyMap<string, ResourceChange>
  tabsTarget?: HTMLElement | null
  restorePosition?: boolean
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
const review = inject(resourceReviewKey, computed(() => null))
const earlierResource = computed(() => reviewResource(review.value, 'before', props.resource.key))
const earlierSubject = computed(() => earlierResource.value && review.value?.before ? parentOf(review.value.before.workspace, earlierResource.value) ?? earlierResource.value : null)
const tabs = computed(() => {
  const current = tabsFor(props.workspace, props.resource)
  if (!review.value) return current
  const before = earlierResource.value && review.value.before ? tabsFor(review.value.before.workspace, earlierResource.value) : []
  const order = ['overview', 'scenarios', 'lifecycle', 'connections', 'references']
  return [...new Set([...current, ...before].map(tab => tab.id))].sort((a, b) => order.indexOf(a) - order.indexOf(b)).map(id => {
    const afterTab = current.find(tab => tab.id === id), beforeTab = before.find(tab => tab.id === id)
    const key = id === 'references' ? props.resource.key : subject.value.key
    const earlier = comparisonReadings(review.value!.before, key).find(tab => tab.id === id)
    const later = comparisonReadings(review.value!.after, key).find(tab => tab.id === id)
    return { ...(afterTab ?? beforeTab)!, blocks: [...new Set([...(afterTab?.blocks ?? []), ...(beforeTab?.blocks ?? [])])], changed: readingChanged(earlier, later) }
  })
})
const showEarlier = ref(false)
const earlierSide = computed(() => showEarlier.value ? review.value?.before ?? null : null)
const displayedWorkspace = computed(() => earlierSide.value?.workspace ?? props.workspace)
const displayedSubject = computed(() => earlierSide.value && earlierSubject.value ? earlierSubject.value : subject.value)
const displayedResource = computed(() => earlierSide.value && earlierResource.value ? earlierResource.value : props.resource)
function openDisplayed(resource: AnyResourceView) {
  if (earlierSide.value && review.value) review.value.inspect(resource.key, earlierSide.value.state)
  else emit('open', resource)
}

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

/* A Scenario address defaults to its parent's Scenarios reading. An explicit
   References address reads the attachments owned by that Scenario. */
watch([tabs, requestedChild, tab], () => {
  if (requestedChild.value && (tab.value !== 'references' || !isTab('references')) && isTab('scenarios')) {
    active.value = 'scenarios'
    return
  }
  active.value = isTab(tab.value) ? tab.value : 'overview'
}, { immediate: true })

function select(id: string) {
  showEarlier.value = false
  if (!isTab(id)) return
  if (id !== 'scenarios' && id !== 'references' && requestedChild.value) emit('open', subject.value)
  active.value = id
  tab.value = id
}

watch([() => props.resource.key, review], () => { if (!review.value) showEarlier.value = false })
const current = computed(() => tabs.value.find(tab => tab.id === active.value) ?? tabs.value[0])
const scenariosList = useTemplateRef('scenariosList')
const scenarioKind = computed(() => subject.value.kind === 'journey' ? 'journey-scenario' as const : 'capability-scenario' as const)
const { columnsFor, setColumns } = useColumns()
const scenarioColumns = computed(() => columnsFor(scenarioKind.value, 1))
const columnItems = COLUMN_CHOICES.map(value => ({ value, label: `${value} per row` }))
</script>

<template>
  <div class="min-w-0" :class="current?.id === 'lifecycle' && 'flex h-full min-h-0 flex-col'">
    <!-- The host places the strip above the scrolling reading. It needs no
         painted sticky backdrop, and standalone use keeps it in normal flow. -->
    <Teleport :to="tabsTarget || 'body'" :disabled="!tabsTarget">
      <BlrPageTabs
        v-if="tabs.length > 1"
        :model-value="active"
        :items="tabs"
        :label="`${ENTITY_KIND_META[resource.kind].label} readings`"
        :class="!tabsTarget && 'mb-5'"
        @update:model-value="select"
      >
        <template v-if="current?.id === 'scenarios' && current.count" #actions>
          <div class="flex items-center gap-2" data-scenario-controls>
            <UFieldGroup size="sm">
              <UTooltip text="Expand all">
                <UButton icon="i-lucide-maximize-2" color="neutral" variant="outline" aria-label="Expand all" @click="scenariosList?.toggleAll(true)" />
              </UTooltip>
              <UTooltip text="Collapse all">
                <UButton icon="i-lucide-minimize-2" color="neutral" variant="outline" aria-label="Collapse all" @click="scenariosList?.toggleAll(false)" />
              </UTooltip>
            </UFieldGroup>
            <USelect
              :model-value="scenarioColumns"
              :items="columnItems"
              value-key="value"
              size="sm"
              variant="outline"
              class="hidden w-36 sm:inline-flex"
              icon="i-lucide-layout-grid"
              aria-label="Rows per line"
              @update:model-value="setColumns(scenarioKind, $event as ColumnChoice)"
            />
          </div>
        </template>
      </BlrPageTabs>
    </Teleport>

    <div v-if="review && earlierSubject && (active === 'lifecycle' || active === 'connections') && current && 'changed' in current && current.changed" class="mb-3 flex shrink-0 flex-wrap items-center gap-3 text-xs text-muted" data-review-version>
      <span>{{ showEarlier ? 'Earlier version' : 'Current version' }} · {{ current.label }} changed</span>
      <UButton :label="showEarlier ? 'Show current' : 'Show previous'" color="neutral" variant="outline" size="sm" @click="showEarlier = !showEarlier" />
    </div>
    <BlrReviewSnapshot :side="earlierSide">
    <div class="min-w-0" :class="current?.id === 'lifecycle' ? 'min-h-0 flex-1' : 'space-y-5'">
      <BlrScenariosList
        v-if="current?.id === 'scenarios'"
        ref="scenariosList"
        :workspace="workspace"
        :resource="subject"
        :changes="changes"
        :columns="scenarioColumns"
        :selected-key="requestedChild"
        :reveal-selected="!restorePosition"
        @open="openDisplayed"
      />

      <BlrEntityLifecycle
        v-else-if="current?.id === 'lifecycle' && subject.kind === 'entity'"
        :workspace="displayedWorkspace"
        :resource="(displayedSubject as EntityView)"
        @open="openDisplayed"
        @ready="emit('ready')"
      />

      <template v-else>
        <BlrPageBlock
          v-for="id in current?.blocks ?? []"
          :key="id"
          v-model:reading="reading"
          :workspace="displayedWorkspace"
          :resource="current?.id === 'references' ? displayedResource : displayedSubject"
          :id="id"
          :heading="current?.id === 'overview'"
          @open="openDisplayed"
        />
      </template>
    </div>
    </BlrReviewSnapshot>
  </div>
</template>
