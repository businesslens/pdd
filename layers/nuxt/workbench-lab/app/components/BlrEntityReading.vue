<script setup lang="ts">
/**
 * One entity, read. The page renders this, and so does the slideover.
 *
 * That is the point: a reader chooses a *container*, not a second design. The
 * peek used to be its own composition — different facts, different ordering,
 * different depth — which meant learning an entity twice and never being sure
 * the panel had left something out.
 *
 * The `page` axis decides how the tabs are arranged; `compact` tells it the
 * container is a panel rather than a page, which affects density and nothing
 * else.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { docsForEntityKind } from '../utils/model'
import { GRAPH_LED, parentOf, tabsFor, type PageTabId } from '../utils/pageSections'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  /** A Scenario to open inside its parent, when one was asked for by key. */
  selectedKey?: string | null
  /** Panel rather than page: tighter, and the header is drawn by the panel. */
  compact?: boolean
  /** Panel-only override: tabs down the left instead of across the top. */
  sideTabs?: boolean
}>(), { compact: false, sideTabs: false })

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
  focus: [entity: AnyEntityView]
}>()

const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })

const { page } = useWorkbenchLab()

/*
  A Scenario is read inside its parent.

  Reaching one by URL or ⌘K therefore lands on the parent with that Scenario
  chosen, rather than on a page of its own — the level this audition removed.
*/
const parent = computed(() => parentOf(props.workspace, props.entity))
const subject = computed(() => parent.value ?? props.entity)
const requestedChild = computed(() => parent.value ? props.entity.key : props.selectedKey ?? null)
const pageDocs = computed(() => docsForEntityKind(subject.value.kind))

const detailApart = computed(() => page.value === 'three')
const tabs = computed(() => tabsFor(props.workspace, subject.value, { detailApart: detailApart.value }))

const active = ref<PageTabId>('overview')

watch([tabs, requestedChild], () => {
  /* Landing on a Scenario means landing on its parent's Scenarios tab. */
  if (requestedChild.value && tabs.value.some(tab => tab.id === 'scenarios')) {
    active.value = 'scenarios'
    return
  }
  if (!tabs.value.some(tab => tab.id === active.value)) active.value = tabs.value[0]?.id ?? 'overview'
}, { immediate: true })

const current = computed(() => tabs.value.find(tab => tab.id === active.value) ?? tabs.value[0])

const graphLed = computed(() => GRAPH_LED.includes(subject.value.kind))

/* Two-column only where there is width for it, and never in a panel. */
const twoColumn = computed(() => page.value === 'dense' && !props.compact)
const disclosed = computed(() => page.value === 'disclosed')
const verticalTabs = computed(() => props.sideTabs || (page.value === 'vertical' && !props.compact))

const RIGHT_COLUMN = new Set(['connections', 'counterparts'])
const leftBlocks = computed(() => current.value?.blocks.filter(id => !RIGHT_COLUMN.has(id)) ?? [])
const rightBlocks = computed(() => current.value?.blocks.filter(id => RIGHT_COLUMN.has(id)) ?? [])

/* Disclosed keeps one Overview but folds the relational tail away. */
const DISCLOSABLE = new Set(['connections', 'counterparts', 'supporting'])
const openBlocks = ref<Set<string>>(new Set())
function toggleBlock(id: string) {
  const next = new Set(openBlocks.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openBlocks.value = next
}
watch(() => props.entity.key, () => { openBlocks.value = new Set() })

const blockLabel: Record<string, string> = {
  connections: 'Connections',
  counterparts: 'Also on',
  supporting: 'Supporting context'
}
</script>

<template>
  <div class="min-w-0">
    <div :class="verticalTabs ? 'flex min-w-0 gap-6' : 'min-w-0'">
      <!-- The tab set, across the top or down the side. -->
      <nav
        data-sticky-page-tabs
        :class="[
          verticalTabs
            ? 'sticky top-0 z-20 w-40 shrink-0 self-start space-y-0.5 border-e border-default bg-default/95 pe-2 backdrop-blur'
            : 'sticky top-0 z-20 mb-5 flex flex-wrap items-center gap-1 border-b border-default bg-default/95 backdrop-blur',
          !compact && 'pt-5'
        ]"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="verticalTabs ? 'blr-vtab' : 'blr-htab'"
          :data-current="tab.id === active"
          @click="active = tab.id"
        >
          <span class="min-w-0 truncate">{{ tab.label }}</span>
          <span v-if="tab.count !== undefined" class="blr-meta">{{ tab.count }}</span>
        </button>
        <div
          v-if="!compact"
          class="flex items-center gap-1.5"
          :class="verticalTabs ? 'mt-2 flex-col items-stretch' : 'ms-auto mb-1'"
        >
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
              :class="verticalTabs ? 'w-full justify-start' : ''"
            />
          </UTooltip>
          <UTooltip text="Show this entity on the topology canvas">
            <UButton
              icon="i-lucide-waypoints"
              color="neutral"
              variant="outline"
              size="xs"
              label="Neighbourhood"
              :class="verticalTabs ? 'w-full justify-start' : ''"
              @click="emit('focus', subject)"
            />
          </UTooltip>
        </div>
      </nav>

      <div
        class="min-w-0 flex-1 space-y-5"
        :class="verticalTabs && !compact ? 'pt-5' : ''"
      >
        <p v-if="current?.hint && current.id !== 'overview'" class="text-xs text-muted">{{ current.hint }}</p>

        <!-- SCENARIOS — split where two panes fit, inline where they do not. -->
        <BlrScenarios
          v-if="current?.id === 'scenarios'"
          v-model:scenario-route="scenarioRoute"
          v-model:route-columns="routeColumns"
          :workspace="workspace"
          :entity="subject"
          :selected-key="requestedChild"
          @select="emit('select', $event)"
        />

        <!-- DIAGRAM — the reach of a graph-led kind. Journey Steps live in Scenarios. -->
        <div v-else-if="current?.id === 'diagram'" class="overflow-hidden rounded-xl border border-default bg-default" :class="compact ? 'h-80' : 'h-[26rem]'">
          <BlrTopology
            v-if="graphLed"
            :workspace="workspace"
            :focus-id="subject.key"
            direction="LR"
            class="h-full"
            @inspect="emit('select', $event)"
          />
        </div>

        <!-- Everything else is blocks, arranged by the page option. -->
        <template v-else>
          <div v-if="twoColumn && rightBlocks.length" class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_19rem]">
            <div class="min-w-0 space-y-5">
              <BlrPageBlock
                v-for="id in leftBlocks"
                :key="id"
                :workspace="workspace"
                :entity="subject"
                :id="id"
                heading
                @select="emit('select', $event)"
                @open="emit('open', $event)"
              />
            </div>
            <aside class="min-w-0 space-y-5 xl:sticky xl:top-2 xl:self-start">
              <BlrPageBlock
                v-for="id in rightBlocks"
                :key="id"
                :workspace="workspace"
                :entity="subject"
                :id="id"
                heading
                @select="emit('select', $event)"
                @open="emit('open', $event)"
              />
            </aside>
          </div>

          <template v-else>
            <template v-for="id in current?.blocks ?? []" :key="id">
              <!-- Disclosed folds the relational tail; everything else is open. -->
              <div v-if="disclosed && DISCLOSABLE.has(id)" class="border-t border-default pt-3">
                <button type="button" class="blr-disclose" :aria-expanded="openBlocks.has(id)" @click="toggleBlock(id)">
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-4 shrink-0 text-dimmed transition-transform"
                    :class="openBlocks.has(id) && 'rotate-90'"
                  />
                  {{ blockLabel[id] ?? id }}
                </button>
                <div v-if="openBlocks.has(id)" class="pt-3">
                  <BlrPageBlock
                    :workspace="workspace"
                    :entity="subject"
                    :id="id"
                    @select="emit('select', $event)"
                    @open="emit('open', $event)"
                  />
                </div>
              </div>
              <BlrPageBlock
                v-else
                :workspace="workspace"
                :entity="subject"
                :id="id"
                heading
                @select="emit('select', $event)"
                @open="emit('open', $event)"
              />
            </template>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blr-htab {
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

.blr-htab:hover {
  color: var(--ui-text-highlighted);
}

.blr-htab[data-current='true'] {
  border-bottom-color: var(--ui-color-primary-500);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

.blr-vtab {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  border-inline-start: 2px solid transparent;
  font-size: 13px;
  color: var(--ui-text-muted);
}

.blr-vtab:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.blr-vtab[data-current='true'] {
  border-inline-start-color: var(--ui-color-primary-500);
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

.blr-disclose {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
  font-weight: 650;
  color: var(--ui-text-highlighted);
}
</style>
