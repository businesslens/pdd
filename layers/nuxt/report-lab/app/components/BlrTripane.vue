<script setup lang="ts">
/**
 * Tripane — an IDE for the Product Model.
 *
 * Persistent zones, nothing ever navigates away:
 * - LEFT: kind switcher (Product + all nine kinds, with counts) over a
 *   searchable, keyboard-navigable entity list for the active kind.
 * - CENTER: the working view for the active kind — journey browser
 *   (cards ⇄ table + full detail), the shared Screen map with a journey
 *   overlay, Domain-grouped Capabilities with two named matrices, ranked
 *   Business-Rule impact, access-context cards, scenario flow lanes,
 *   domain cards, and the Product identity/coverage page.
 * - INSPECTOR: the shared BlrInspector slideover. It is non-modal, stays
 *   open across selections and re-targets to each new one, so selecting
 *   anything in the center inspects it without moving the working view.
 */
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type {
  ActorView,
  AnyEntityView,
  CapabilityView,
  DomainView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportEntityKind,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  ScreenView
} from '../utils/reportWorkspace'
import { ENTITY_KIND_META, REPORT_ENTITY_KINDS, resolveEntities } from '../utils/reportWorkspace'
import { buildScreenMap } from '../utils/flowGraph'
import { firstSentence } from '../utils/reportMarkdown'

const UButton = resolveComponent('UButton')

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

/* ------------------------------------------------------------------ */
/* Selection state: activeKind/activeId drive the center working view; */
/* the inspector follows every selection and never moves the center.   */
/* ------------------------------------------------------------------ */

const activeKind = ref<ReportEntityKind>('product')
const activeId = ref<string | null>(null)
const inspected = ref<AnyEntityView | null>(null)
const inspectorTab = ref<'detail' | 'map'>('detail')
const query = ref('')
const journeyView = ref<'cards' | 'table'>('cards')
const journeyOverlayId = ref<string | null>(null)
const expandedRules = ref<string[]>([])
const listEl = ref<HTMLElement | null>(null)

const activeMeta = computed(() => ENTITY_KIND_META[activeKind.value])
const activeEntity = computed(() =>
  (activeId.value && props.workspace.byId.get(activeId.value)) || null)

const kindCounts = computed<Record<string, number>>(() => ({
  actor: props.workspace.counts.actors,
  interface: props.workspace.counts.interfaces,
  experience: props.workspace.counts.experiences,
  screen: props.workspace.counts.screens,
  domain: props.workspace.counts.domains,
  capability: props.workspace.counts.capabilities,
  journey: props.workspace.counts.journeys,
  scenario: props.workspace.counts.scenarios,
  rule: props.workspace.counts.rules
}))

function listFor(kind: ReportEntityKind): AnyEntityView[] {
  switch (kind) {
    case 'actor': return props.workspace.actors
    case 'interface': return props.workspace.interfaces
    case 'experience': return props.workspace.experiences
    case 'screen': return props.workspace.screens
    case 'domain': return props.workspace.domains
    case 'capability': return props.workspace.capabilities
    case 'journey': return props.workspace.journeys
    case 'scenario': return props.workspace.scenarios
    case 'rule': return props.workspace.rules
    default: return []
  }
}

const listEntities = computed<AnyEntityView[]>(() => {
  const all = listFor(activeKind.value)
  const needle = query.value.trim().toLowerCase()
  if (!needle) return all
  return all.filter(entity =>
    entity.title.toLowerCase().includes(needle) || entity.id.toLowerCase().includes(needle))
})

function setKind(kind: ReportEntityKind) {
  activeKind.value = kind
  query.value = ''
  activeId.value = null
}

/** Left-list activation: the one gesture that moves the center view. */
function activate(entity: AnyEntityView) {
  activeId.value = entity.id
  inspect(entity)
}

/** Any selection anywhere re-targets the open inspector, never the center. */
function inspect(entity: AnyEntityView) {
  inspected.value = entity
  inspectorTab.value = 'detail'
}

function inspectId(id: string) {
  const entity = props.workspace.byId.get(id)
  if (entity) inspect(entity)
}

/* Keyboard navigation: arrows walk the filtered list, Enter confirms. */
function moveSelection(delta: number) {
  const list = listEntities.value
  if (!list.length) return
  const index = list.findIndex(entity => entity.id === activeId.value)
  const next = index === -1
    ? (delta > 0 ? list[0] : list[list.length - 1])
    : list[Math.min(list.length - 1, Math.max(0, index + delta))]
  if (next) activate(next)
  nextTick(() => {
    listEl.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  })
}

function onListKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveSelection(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveSelection(-1)
  } else if (event.key === 'Enter' && activeEntity.value) {
    event.preventDefault()
    activate(activeEntity.value)
  }
}

function onSearchEnter() {
  const first = listEntities.value[0]
  if (first) activate(first)
}

/* ------------------------------------------------------------------ */
/* Journeys                                                            */
/* ------------------------------------------------------------------ */

const JOURNEY_VIEW_TABS = [
  { value: 'cards', label: 'Cards', icon: 'i-lucide-layout-grid' },
  { value: 'table', label: 'Table', icon: 'i-lucide-table' }
]

const activeJourney = computed<JourneyView | null>(() =>
  activeEntity.value?.kind === 'journey' ? activeEntity.value : null)

const activeJourneyScenarios = computed<ScenarioView[]>(() =>
  activeJourney.value
    ? props.workspace.scenariosByJourney.get(activeJourney.value.id) ?? []
    : [])

function scenarioTitles(journey: JourneyView): string[] {
  return (props.workspace.scenariosByJourney.get(journey.id) ?? []).map(item => item.title)
}

const titlesOf = (ids: string[]) => resolveEntities(props.workspace, ids).map(entity => entity.title).join(', ')

function sortableHeader(label: string) {
  return ({ column }: { column: { getIsSorted: () => false | 'asc' | 'desc', toggleSorting: (desc: boolean) => void } }) => {
    const sorted = column.getIsSorted()
    return h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      size: 'sm',
      label,
      trailingIcon: sorted ? (sorted === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down',
      class: '-mx-2.5 font-medium',
      onClick: () => column.toggleSorting(sorted === 'asc')
    })
  }
}

const countCell = (count: number, hint: string) =>
  h('span', { class: 'blr-meta', title: hint || undefined }, String(count))

const journeyColumns: TableColumn<JourneyView>[] = [
  {
    accessorKey: 'title',
    header: sortableHeader('Journey'),
    cell: ({ row }) => h('div', { class: 'min-w-0 max-w-64' }, [
      h('p', { class: 'truncate font-medium text-highlighted' }, row.original.title),
      h('p', { class: 'truncate text-xs text-muted' }, firstSentence(row.original.lead, 90))
    ])
  },
  {
    id: 'actors',
    accessorFn: journey => journey.actorIds.length,
    header: sortableHeader('Actors'),
    cell: ({ row }) => countCell(row.original.actorIds.length, titlesOf(row.original.actorIds))
  },
  {
    id: 'contexts',
    accessorFn: journey => journey.availability.length,
    header: sortableHeader('Contexts'),
    cell: ({ row }) => countCell(row.original.availability.length, row.original.availability
      .map(pair => pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : pair.interfaceTitle)
      .join(', '))
  },
  {
    id: 'capabilities',
    accessorFn: journey => journey.capabilityIds.length,
    header: sortableHeader('Capabilities'),
    cell: ({ row }) => countCell(row.original.capabilityIds.length, titlesOf(row.original.capabilityIds))
  },
  {
    id: 'screens',
    accessorFn: journey => journey.screenIds.length,
    header: sortableHeader('Screens'),
    cell: ({ row }) => countCell(row.original.screenIds.length, titlesOf(row.original.screenIds))
  },
  {
    id: 'scenarios',
    accessorFn: journey => journey.scenarioIds.length,
    header: sortableHeader('Scenarios'),
    cell: ({ row }) => countCell(row.original.scenarioIds.length, titlesOf(row.original.scenarioIds))
  },
  {
    id: 'rules',
    accessorFn: journey => journey.ruleIds.length,
    header: sortableHeader('Rules'),
    cell: ({ row }) => countCell(row.original.ruleIds.length, titlesOf(row.original.ruleIds))
  },
  {
    accessorKey: 'stepCount',
    header: sortableHeader('Steps'),
    cell: ({ row }) => countCell(row.original.stepCount, '')
  }
]

/* ------------------------------------------------------------------ */
/* Screen map                                                          */
/* ------------------------------------------------------------------ */

const overlayJourney = computed<JourneyView | null>(() => {
  if (!journeyOverlayId.value) return null
  const entity = props.workspace.byId.get(journeyOverlayId.value)
  return entity?.kind === 'journey' ? entity : null
})

const screenMap = computed(() => buildScreenMap(props.workspace, {
  emphasizeScreenIds: overlayJourney.value ? new Set(overlayJourney.value.screenIds) : null,
  selectedId: inspected.value?.id ?? null
}))

function toggleOverlay(journeyId: string) {
  journeyOverlayId.value = journeyOverlayId.value === journeyId ? null : journeyId
}

/* ------------------------------------------------------------------ */
/* Capabilities: domain groups and the two named matrices              */
/* ------------------------------------------------------------------ */

const capabilityGroups = computed(() => {
  const groups = props.workspace.domains.map(domain => ({
    id: domain.id,
    title: domain.title,
    lead: domain.lead,
    domain: true,
    capabilities: props.workspace.capabilitiesByDomain.get(domain.id) ?? []
  }))
  const undomained = props.workspace.capabilitiesByDomain.get('') ?? []
  if (undomained.length) {
    groups.push({
      id: '',
      title: 'No Domain',
      lead: 'Capabilities the model does not assign to a Domain.',
      domain: false,
      capabilities: undomained
    })
  }
  return groups
})

type MatrixKind = 'journeys' | 'contexts'
const matrixCell = ref<{ matrix: MatrixKind, capabilityId: string, targetKey: string } | null>(null)

interface MatrixSpec {
  id: MatrixKind
  question: string
  note: string
  columns: Array<{ key: string, label: string }>
  on: (capability: CapabilityView, key: string) => boolean
}

/** The two named matrices; each is headed by the question it answers. */
const matrices = computed<MatrixSpec[]>(() => {
  const specs: MatrixSpec[] = []
  if (props.workspace.journeys.length) {
    specs.push({
      id: 'journeys',
      question: 'Which Product promises depend on each Capability?',
      note: 'Capabilities × Journeys — a dot is an authored “uses” declaration. Click a cell for the explanation.',
      columns: props.workspace.journeys.map(journey => ({ key: journey.id, label: journey.title })),
      on: (capability, key) => capability.journeyIds.includes(key)
    })
  }
  if (props.workspace.pairs.length) {
    specs.push({
      id: 'contexts',
      question: 'Where can each Capability be reached?',
      note: 'Capabilities × access contexts (Interface, or Interface › Experience) — a dot is a declared availability scope.',
      columns: props.workspace.pairs.map(pair => ({ key: pair.key, label: pairLabel(pair) })),
      on: (capability, key) => capability.availability.some(item => item.key === key)
    })
  }
  return specs
})

function pickCell(matrix: MatrixKind, capabilityId: string, targetKey: string) {
  const same = matrixCell.value
    && matrixCell.value.matrix === matrix
    && matrixCell.value.capabilityId === capabilityId
    && matrixCell.value.targetKey === targetKey
  matrixCell.value = same ? null : { matrix, capabilityId, targetKey }
  if (!same) inspectId(capabilityId)
}

function isCellPicked(matrix: MatrixKind, capabilityId: string, targetKey: string): boolean {
  return !!matrixCell.value
    && matrixCell.value.matrix === matrix
    && matrixCell.value.capabilityId === capabilityId
    && matrixCell.value.targetKey === targetKey
}

function pairLabel(pair: { interfaceTitle: string, experienceTitle: string }): string {
  return pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : `${pair.interfaceTitle} (direct)`
}

const matrixNote = computed(() => {
  const cell = matrixCell.value
  if (!cell) return ''
  const capability = props.workspace.byId.get(cell.capabilityId)
  if (capability?.kind !== 'capability') return ''
  if (cell.matrix === 'journeys') {
    const journey = props.workspace.byId.get(cell.targetKey)
    if (journey?.kind !== 'journey') return ''
    return journey.capabilityIds.includes(capability.id)
      ? `“${journey.title}” declares “${capability.title}” among the Capabilities it uses — this promise depends on it.`
      : `“${journey.title}” does not declare “${capability.title}” — this promise does not depend on it.`
  }
  const pair = props.workspace.pairs.find(item => item.key === cell.targetKey)
  if (!pair) return ''
  return capability.availability.some(item => item.key === cell.targetKey)
    ? `“${capability.title}” declares availability in ${pairLabel(pair)}.`
    : `“${capability.title}” declares no availability in ${pairLabel(pair)}.`
})

/* ------------------------------------------------------------------ */
/* Business rules: ranked by explicit binding count, impact on expand  */
/* ------------------------------------------------------------------ */

function ruleDirectCount(rule: RuleView): number {
  return rule.domainIds.length + rule.capabilityIds.length
    + rule.journeyIds.length + rule.scenarioIds.length
}

const rankedRules = computed(() => [...props.workspace.rules].sort((left, right) =>
  ruleDirectCount(right) - ruleDirectCount(left) || left.title.localeCompare(right.title)))

function toggleRule(id: string) {
  expandedRules.value = expandedRules.value.includes(id)
    ? expandedRules.value.filter(item => item !== id)
    : [...expandedRules.value, id]
}

interface RuleImpact {
  derivedCapabilities: CapabilityView[]
  derivedJourneys: JourneyView[]
  derivedScreens: ScreenView[]
}

/** Derived reach, each hop factual: via Domain, via Capability, via Scenario. */
function ruleImpact(rule: RuleView): RuleImpact {
  const directCapabilities = new Set(rule.capabilityIds)
  const derivedCapabilities = props.workspace.capabilities.filter(capability =>
    !!capability.domainId
    && rule.domainIds.includes(capability.domainId)
    && !directCapabilities.has(capability.id))
  const reachedCapabilities = new Set([
    ...rule.capabilityIds,
    ...derivedCapabilities.map(capability => capability.id)
  ])
  const scenarioJourneyIds = new Set(rule.scenarioIds
    .map((id) => {
      const scenario = props.workspace.byId.get(id)
      return scenario?.kind === 'scenario' ? scenario.journeyId : null
    })
    .filter((id): id is string => Boolean(id)))
  const derivedJourneys = props.workspace.journeys.filter(journey =>
    !rule.journeyIds.includes(journey.id)
    && (journey.capabilityIds.some(id => reachedCapabilities.has(id)) || scenarioJourneyIds.has(journey.id)))
  const derivedScreens = props.workspace.screens.filter(screen =>
    screen.capabilityIds.some(id => reachedCapabilities.has(id)))
  return { derivedCapabilities, derivedJourneys, derivedScreens }
}

/* ------------------------------------------------------------------ */
/* Scenarios: flow lanes grouped by Journey                            */
/* ------------------------------------------------------------------ */

const scenarioGroups = computed(() => props.workspace.journeys
  .map(journey => ({ journey, scenarios: props.workspace.scenariosByJourney.get(journey.id) ?? [] }))
  .filter(group => group.scenarios.length))

const orphanScenarios = computed(() => props.workspace.scenarios
  .filter(scenario => !props.workspace.byId.has(scenario.journeyId)))

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  complete: 'success',
  partial: 'warning',
  draft: 'neutral'
}

const authoredCounts = computed<Array<[string, number]>>(() => [
  ['Actors', props.workspace.counts.actors],
  ['Interfaces', props.workspace.counts.interfaces],
  ['Experiences', props.workspace.counts.experiences],
  ['Screens', props.workspace.counts.screens],
  ['Domains', props.workspace.counts.domains],
  ['Capabilities', props.workspace.counts.capabilities],
  ['Journeys', props.workspace.counts.journeys],
  ['Scenarios', props.workspace.counts.scenarios],
  ['Business rules', props.workspace.counts.rules]
])

const derivedCounts = computed<Array<[string, number]>>(() => [
  ['Steps', props.workspace.counts.steps],
  ['Decision points', props.workspace.counts.decisionPoints],
  ['Branches', props.workspace.counts.branches],
  ['Edge cases', props.workspace.counts.edgeCases],
  ['Screen states', props.workspace.counts.screenStates],
  ['Entry points', props.workspace.counts.entryPoints],
  ['References', props.workspace.counts.references],
  ['Availability scopes', props.workspace.counts.availabilityPairs]
])

const ACCESS_TONE: Record<string, 'success' | 'warning' | 'error'> = {
  public: 'success',
  authenticated: 'warning',
  restricted: 'error'
}
</script>

<template>
  <div class="blr-tripane flex h-full min-h-0 flex-col text-sm">
    <!-- Status bar: product identity at a glance, IDE title-bar style. -->
    <header class="flex shrink-0 items-center gap-3 border-b border-default px-4 py-2.5">
      <img v-if="logoSrc" :src="logoSrc" alt="" class="size-6 shrink-0 rounded-md border border-muted bg-elevated object-contain p-0.5">
      <UIcon v-else name="i-lucide-package" class="size-5 shrink-0 text-primary" />
      <button
        type="button"
        class="truncate text-sm font-semibold tracking-tight text-highlighted hover:text-primary"
        title="Open the Product identity view"
        @click="setKind('product')"
      >
        {{ workspace.identity.title }}
      </button>
      <span class="hidden truncate text-sm text-muted lg:inline">{{ workspace.identity.summary }}</span>
      <span class="ms-auto flex shrink-0 items-center gap-2.5">
        <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">
          coverage: {{ workspace.coverage.status }}
        </UBadge>
        <span class="blr-meta hidden sm:inline">{{ workspace.identity.schemaVersion }}</span>
        <span class="blr-meta hidden md:inline">{{ workspace.identity.generatedAt.slice(0, 10) }}</span>
      </span>
    </header>

    <div class="flex min-h-0 flex-1">
      <!-- LEFT: kind switcher + searchable entity list -->
      <nav class="flex w-64 shrink-0 flex-col border-e border-default">
        <div class="shrink-0 border-b border-default p-2">
          <button
            type="button"
            class="blr-navitem"
            :data-current="activeKind === 'product'"
            :style="{ '--kind-color': 'var(--blr-slot-9)' }"
            @click="setKind('product')"
          >
            <UIcon name="i-lucide-package" class="size-4 shrink-0" style="color: var(--blr-slot-9)" />
            <span class="flex-1 truncate text-start">Product</span>
            <span class="blr-meta">id</span>
          </button>
          <button
            v-for="meta in REPORT_ENTITY_KINDS"
            :key="meta.kind"
            type="button"
            class="blr-navitem"
            :data-current="activeKind === meta.kind"
            :style="{ '--kind-color': `var(--blr-slot-${meta.slot})` }"
            @click="setKind(meta.kind)"
          >
            <UIcon :name="meta.icon" class="size-4 shrink-0" :style="{ color: `var(--blr-slot-${meta.slot})` }" />
            <span class="flex-1 truncate text-start">{{ meta.plural }}</span>
            <span class="blr-meta">{{ kindCounts[meta.kind] }}</span>
          </button>
        </div>

        <template v-if="activeKind !== 'product'">
          <div class="shrink-0 border-b border-default p-2">
            <UInput
              v-model="query"
              icon="i-lucide-search"
              size="sm"
              variant="outline"
              class="w-full"
              :placeholder="`Filter ${activeMeta.plural.toLowerCase()}…`"
              @keydown.enter.prevent="onSearchEnter"
              @keydown.down.prevent="moveSelection(1)"
            />
          </div>
          <div
            ref="listEl"
            class="blr-pane flex-1 p-2 outline-none"
            tabindex="0"
            role="listbox"
            :aria-label="`${activeMeta.plural} list`"
            @keydown="onListKeydown"
          >
            <button
              v-for="entity in listEntities"
              :key="entity.id"
              type="button"
              class="blr-listitem"
              :data-active="entity.id === activeId"
              :style="{ '--kind-color': `var(--blr-slot-${ENTITY_KIND_META[entity.kind].slot})` }"
              @click="activate(entity)"
            >
              <span class="blr-listitem__tick" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm text-highlighted">{{ entity.title }}</span>
                <span
                  v-if="entity.kind === 'scenario'"
                  class="block truncate text-xs text-muted"
                >{{ (entity as ScenarioView).journeyTitle }}</span>
              </span>
            </button>
            <p v-if="!listEntities.length" class="px-2 py-3 text-sm text-muted italic">
              {{ query ? `No ${activeMeta.plural.toLowerCase()} match “${query}”.` : `This model declares no ${activeMeta.plural.toLowerCase()}.` }}
            </p>
          </div>
          <p class="blr-meta shrink-0 border-t border-default px-3 py-2">
            ↑↓ move · Enter select
          </p>
        </template>
        <p v-else class="blr-pane flex-1 p-4 text-sm leading-6 text-muted">
          Identity, coverage and every reference of this report render in the
          working view. Pick a kind above to browse its entities.
        </p>
      </nav>

      <!-- CENTER: the working view for the active kind -->
      <section class="flex min-w-0 flex-1 flex-col">
        <header class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-default px-4 py-2.5">
          <UIcon :name="activeMeta.icon" class="size-4" :style="{ color: `var(--blr-slot-${activeMeta.slot})` }" />
          <span class="blr-eyebrow">
            {{ activeKind === 'product' ? 'Product identity' : activeMeta.plural }}
          </span>
          <span v-if="activeKind !== 'product'" class="blr-meta">
            {{ listEntities.length }}<template v-if="listEntities.length !== listFor(activeKind).length"> / {{ listFor(activeKind).length }}</template>
          </span>
          <UTabs
            v-if="activeKind === 'journey'"
            v-model="journeyView"
            :items="JOURNEY_VIEW_TABS"
            :content="false"
            color="neutral"
            size="xs"
            class="ms-auto"
          />
          <span v-else-if="activeKind === 'screen'" class="ms-auto text-xs text-muted">
            Interfaces are columns; Experiences are nested groups. Click a box to inspect.
          </span>
        </header>

        <!-- Screens fill the pane with the shared map; everything else scrolls. -->
        <div v-if="activeKind === 'screen'" class="flex min-h-0 flex-1 flex-col">
          <div v-if="workspace.journeys.length" class="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-default px-4 py-2">
            <span class="blr-field me-1">Journey overlay</span>
            <UButton
              v-for="journey in workspace.journeys"
              :key="journey.id"
              :label="journey.title"
              :color="journeyOverlayId === journey.id ? 'primary' : 'neutral'"
              :variant="journeyOverlayId === journey.id ? 'soft' : 'outline'"
              size="xs"
              class="rounded-full"
              :title="`Fade Screens outside “${journey.title}”`"
              @click="toggleOverlay(journey.id)"
            />
            <UButton v-if="journeyOverlayId" icon="i-lucide-x" color="neutral" variant="ghost" size="xs" label="Clear" @click="journeyOverlayId = null" />
            <span v-if="overlayJourney" class="text-xs text-muted">
              {{ overlayJourney.screenIds.length }} Screens participate (derived)
            </span>
          </div>
          <div v-if="workspace.interfaces.length" class="min-h-0 flex-1">
            <BlrFlowCanvas :nodes="screenMap.nodes" @select="inspectId" />
          </div>
          <p v-else class="p-6 text-sm text-muted italic">
            This model declares no Interfaces, so there is no visible surface to map.
          </p>
        </div>

        <div v-else class="blr-pane flex-1 p-5">
          <!-- PRODUCT: identity, coverage, counts, references -->
          <div v-if="activeKind === 'product'" class="mx-auto max-w-3xl space-y-8">
            <div class="space-y-2.5">
              <h2 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">
                {{ workspace.identity.title }}
              </h2>
              <p class="text-base leading-7 text-default">{{ workspace.identity.summary }}</p>
              <div class="flex flex-wrap items-center gap-1.5 pt-1">
                <UBadge v-if="workspace.identity.categoryLabel" color="primary" variant="subtle" size="sm">
                  {{ workspace.identity.categoryLabel }}
                </UBadge>
                <UBadge v-for="tag in workspace.identity.tags" :key="tag" color="neutral" variant="outline" size="sm">
                  {{ tag }}
                </UBadge>
                <span v-if="workspace.identity.license" class="blr-meta">
                  license: {{ workspace.identity.license }}
                </span>
              </div>
            </div>
            <BlrProse :text="workspace.identity.description" />
            <section v-if="workspace.identity.intent" class="space-y-1.5">
              <h3 class="blr-field">Intent</h3>
              <BlrProse :text="workspace.identity.intent" />
            </section>
            <section v-if="workspace.identity.supportingContent" class="space-y-1.5">
              <h3 class="blr-field">Supporting context</h3>
              <BlrProse :text="workspace.identity.supportingContent" />
            </section>
            <section v-if="workspace.identity.authors.length" class="space-y-1.5">
              <h3 class="blr-field">Authors</h3>
              <ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <li v-for="author in workspace.identity.authors" :key="author.name">
                  <a
                    v-if="author.url"
                    :href="author.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary underline underline-offset-2"
                  >{{ author.name }}</a>
                  <span v-else class="text-default">{{ author.name }}</span>
                </li>
              </ul>
            </section>

            <section class="space-y-3 border-t border-default pt-5">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-semibold tracking-tight text-highlighted">Coverage</h3>
                <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">
                  {{ workspace.coverage.status }}
                </UBadge>
              </div>
              <BlrProse :text="workspace.coverage.rationale" />
              <div class="grid gap-4 sm:grid-cols-2">
                <div v-if="workspace.coverage.method.length" class="space-y-1.5">
                  <p class="blr-field">Method</p>
                  <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                    <li v-for="(item, index) in workspace.coverage.method" :key="index">{{ item }}</li>
                  </ul>
                </div>
                <div v-if="workspace.coverage.sourceAreas.length" class="space-y-1.5">
                  <p class="blr-field">Source areas</p>
                  <ul class="space-y-1">
                    <li v-for="(item, index) in workspace.coverage.sourceAreas" :key="index" class="blr-meta">{{ item }}</li>
                  </ul>
                </div>
                <div v-if="workspace.coverage.unmapped.length" class="space-y-1.5">
                  <p class="blr-field">Unmapped</p>
                  <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                    <li v-for="(item, index) in workspace.coverage.unmapped" :key="index">{{ item }}</li>
                  </ul>
                </div>
                <div v-if="workspace.coverage.limitations.length" class="space-y-1.5">
                  <p class="blr-field">Limitations</p>
                  <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                    <li v-for="(item, index) in workspace.coverage.limitations" :key="index">{{ item }}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section class="space-y-3 border-t border-default pt-5">
              <h3 class="text-base font-semibold tracking-tight text-highlighted">Model counts</h3>
              <div class="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5">
                <div v-for="[label, value] in authoredCounts" :key="label">
                  <p class="font-mono text-lg text-highlighted tabular-nums">{{ value }}</p>
                  <p class="blr-field">{{ label }}</p>
                </div>
              </div>
              <p class="blr-field pt-1">Depth (derived from the model)</p>
              <div class="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5">
                <div v-for="[label, value] in derivedCounts" :key="label">
                  <p class="font-mono text-lg text-highlighted tabular-nums">{{ value }}</p>
                  <p class="blr-field">{{ label }}</p>
                </div>
              </div>
            </section>

            <section class="space-y-3 border-t border-default pt-5">
              <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />
              <div v-if="workspace.references.length" class="space-y-1.5">
                <p class="blr-field">All references in the model <span class="blr-meta">{{ workspace.references.length }}</span></p>
                <ul class="space-y-1">
                  <li
                    v-for="(group, index) in workspace.references"
                    :key="`${group.ownerId}-${index}`"
                    class="flex min-w-0 items-center gap-2 text-sm"
                  >
                    <BlrKind :kind="group.ownerKind" :labelled="false" size="xs" />
                    <button
                      type="button"
                      class="shrink-0 truncate text-default hover:text-primary"
                      :disabled="group.ownerKind === 'product'"
                      @click="inspectId(group.ownerId)"
                    >
                      {{ group.ownerTitle }}
                    </button>
                    <span class="blr-meta truncate">
                      {{ group.reference.title || group.reference.target }}
                    </span>
                    <span class="blr-meta ms-auto shrink-0">
                      {{ group.reference.kind }} · {{ group.reference.role }}
                    </span>
                  </li>
                </ul>
              </div>
              <p class="blr-meta">
                Generated by {{ workspace.identity.generator.name }} v{{ workspace.identity.generator.version }}
                · schema {{ workspace.identity.schemaVersion }} · {{ workspace.identity.generatedAt }}
              </p>
            </section>
          </div>

          <!-- JOURNEYS: cards ⇄ table browser + full detail -->
          <div v-else-if="activeKind === 'journey'" class="space-y-5">
            <div v-if="journeyView === 'cards'" class="grid gap-4 xl:grid-cols-2">
              <article
                v-for="journey in listEntities as JourneyView[]"
                :key="journey.id"
                class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
                :class="journey.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
                @click="activate(journey)"
              >
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ journey.title }}</h3>
                  <BlrKind kind="scenario" :count="journey.scenarioIds.length" :labelled="false" size="xs" />
                </div>
                <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ journey.lead }}</p>
                <div class="mt-2.5 space-y-1.5" @click.stop>
                  <BlrLinks :workspace="workspace" :ids="journey.actorIds" kind="actor" interactive @select="inspect" />
                  <BlrAvail :pairs="journey.availability" label="" />
                  <div v-if="scenarioTitles(journey).length" class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span class="blr-field">Scenarios</span>
                    <span class="text-sm text-default">{{ scenarioTitles(journey).join(' · ') }}</span>
                  </div>
                  <BlrLinks :workspace="workspace" :ids="journey.capabilityIds" kind="capability" :max="4" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="journey.screenIds" kind="screen" :max="4" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="journey.ruleIds" kind="rule" :max="3" interactive @select="inspect" />
                </div>
              </article>
            </div>

            <div v-else>
              <UTable
                :data="listEntities as JourneyView[]"
                :columns="journeyColumns"
                class="rounded-xl border border-default bg-default"
                :ui="{ tr: 'cursor-pointer' }"
                :on-select="(_event: Event, row: any) => activate(row.original)"
              />
              <p class="pt-2 text-sm text-muted">
                Screens and Rules include derived participation (via Scenarios and Capabilities); Steps is the authored step depth.
                Hover a count for the names behind it; click a row to read the Journey in full.
              </p>
            </div>

            <!-- Full journey detail: the complete promise, scenarios included. -->
            <article v-if="activeJourney" class="space-y-4 border-t border-default pt-5">
              <header class="flex flex-wrap items-center gap-2.5">
                <BlrKind kind="journey" />
                <h3 class="text-xl font-semibold tracking-tight text-highlighted">{{ activeJourney.title }}</h3>
                <code class="blr-meta rounded bg-muted px-1.5 py-0.5">{{ activeJourney.id }}</code>
              </header>
              <BlrProse :text="activeJourney.lead" />
              <section v-if="activeJourney.intent" class="space-y-1.5">
                <h4 class="blr-field">Intent</h4>
                <BlrProse :text="activeJourney.intent" />
              </section>
              <BlrAvail :pairs="activeJourney.availability" :entry-points="activeJourney.entryPoints" />
              <div class="space-y-1.5">
                <BlrLinks :workspace="workspace" :ids="activeJourney.actorIds" kind="actor" interactive @select="inspect" />
                <BlrLinks :workspace="workspace" :ids="activeJourney.capabilityIds" kind="capability" interactive @select="inspect" />
                <BlrLinks :workspace="workspace" :ids="activeJourney.domainIds" kind="domain" label="Domains (derived)" interactive @select="inspect" />
                <BlrLinks :workspace="workspace" :ids="activeJourney.screenIds" kind="screen" label="Screens (derived)" interactive @select="inspect" />
                <BlrLinks :workspace="workspace" :ids="activeJourney.ruleIds" kind="rule" label="Constrained by" interactive @select="inspect" />
              </div>

              <section class="space-y-3">
                <h4 class="text-base font-semibold tracking-tight text-highlighted">Scenarios <span class="blr-meta ms-1">{{ activeJourneyScenarios.length }}</span></h4>
                <p v-if="!activeJourneyScenarios.length" class="text-sm text-muted italic">
                  This Journey declares no Scenarios.
                </p>
                <article
                  v-for="scenario in activeJourneyScenarios"
                  :key="scenario.id"
                  class="rounded-xl border border-default bg-default p-4"
                >
                  <header class="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      class="text-base font-semibold tracking-tight text-highlighted hover:text-primary"
                      @click="inspect(scenario)"
                    >
                      {{ scenario.title }}
                    </button>
                    <UBadge color="neutral" variant="subtle" size="sm">{{ scenario.kindName }}</UBadge>
                  </header>
                  <dl class="mt-3 space-y-3">
                    <div>
                      <dt class="blr-field">Trigger</dt>
                      <dd class="mt-0.5 text-sm leading-6 text-default">{{ scenario.trigger }}</dd>
                    </div>
                    <div>
                      <dt class="blr-field">Steps · {{ scenario.steps.length }}</dt>
                      <dd>
                        <ol class="mt-1 space-y-1">
                          <li v-for="(step, index) in scenario.steps" :key="index" class="flex gap-2.5 text-sm">
                            <span class="blr-meta w-5 shrink-0 pt-0.5 text-end">{{ index + 1 }}</span>
                            <span class="leading-6 text-default">{{ step }}</span>
                          </li>
                        </ol>
                      </dd>
                    </div>
                    <div v-if="scenario.decisionPoints.length">
                      <dt class="blr-field">Decision points · {{ scenario.decisionPoints.length }}</dt>
                      <dd class="mt-1 space-y-2">
                        <div
                          v-for="(point, index) in scenario.decisionPoints"
                          :key="index"
                          class="rounded-lg border border-dashed border-default p-3"
                        >
                          <p class="text-sm font-medium text-highlighted">{{ point.title }}</p>
                          <p class="mt-0.5 text-sm text-muted">{{ point.question }}</p>
                          <ul class="mt-2 space-y-1.5">
                            <li
                              v-for="(branch, branchIndex) in point.branches"
                              :key="branchIndex"
                              class="flex flex-wrap items-baseline gap-1.5 text-xs"
                            >
                              <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-default">{{ branch.condition }}</span>
                              <UIcon name="i-lucide-arrow-right" class="size-3 self-center text-dimmed" />
                              <span class="text-dimmed">{{ branch.outcome }}</span>
                            </li>
                          </ul>
                        </div>
                      </dd>
                    </div>
                    <div>
                      <dt class="blr-field">Outcome</dt>
                      <dd class="mt-0.5 text-sm leading-6 text-default">{{ scenario.outcome }}</dd>
                    </div>
                    <div v-if="scenario.edgeCases.length">
                      <dt class="blr-field">Edge cases · {{ scenario.edgeCases.length }}</dt>
                      <dd>
                        <ul class="mt-1 list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed">
                          <li v-for="(item, index) in scenario.edgeCases" :key="index">{{ item }}</li>
                        </ul>
                      </dd>
                    </div>
                  </dl>
                  <div class="mt-2.5 space-y-1.5">
                    <BlrLinks :workspace="workspace" :ids="scenario.screenIds" kind="screen" interactive @select="inspect" />
                    <BlrLinks :workspace="workspace" :ids="scenario.ruleIds" kind="rule" label="Constrained by" interactive @select="inspect" />
                  </div>
                </article>
              </section>
            </article>
            <p v-else class="text-sm text-muted italic">
              Select a Journey to read its complete promise — scenarios, decisions, edge cases and rules.
            </p>
          </div>
          <!-- CAPABILITIES: domain groups + two named matrices -->
          <div v-else-if="activeKind === 'capability'" class="space-y-6">
            <div class="grid gap-4 xl:grid-cols-2">
              <section
                v-for="group in capabilityGroups"
                :key="group.id || 'no-domain'"
                class="rounded-xl border border-default bg-default p-4"
              >
                <header class="flex items-center gap-2">
                  <BlrKind kind="domain" :labelled="false" size="xs" />
                  <button
                    v-if="group.domain"
                    type="button"
                    class="text-base font-semibold tracking-tight text-highlighted hover:text-primary"
                    @click="inspectId(group.id)"
                  >
                    {{ group.title }}
                  </button>
                  <span v-else class="text-base font-semibold tracking-tight text-muted">{{ group.title }}</span>
                  <span class="blr-meta ms-auto">{{ group.capabilities.length }}</span>
                </header>
                <p class="mt-1 text-sm text-muted">{{ firstSentence(group.lead, 120) }}</p>
                <ul class="mt-2.5 space-y-1.5">
                  <li
                    v-for="capability in group.capabilities"
                    :key="capability.id"
                    class="rounded-lg border px-3 py-2 transition"
                    :class="capability.id === activeId ? 'border-primary bg-primary/5' : 'border-default hover:border-accented'"
                  >
                    <button
                      type="button"
                      class="flex w-full items-baseline gap-2 text-start"
                      @click="activate(capability)"
                    >
                      <span class="text-sm font-medium text-highlighted">{{ capability.title }}</span>
                      <span class="min-w-0 flex-1 truncate text-sm text-muted">{{ firstSentence(capability.lead, 90) }}</span>
                    </button>
                    <p class="blr-meta mt-1 flex flex-wrap gap-x-3">
                      <span>{{ capability.journeyIds.length }} journeys</span>
                      <span>{{ capability.screenIds.length }} screens</span>
                      <span>{{ capability.ruleIds.length }} rules</span>
                      <span>{{ capability.availability.length }} contexts</span>
                      <span>(derived counts)</span>
                    </p>
                  </li>
                  <li v-if="!group.capabilities.length" class="text-sm text-muted italic">
                    No Capabilities in this Domain yet.
                  </li>
                </ul>
              </section>
            </div>

            <section
              v-for="matrix in workspace.capabilities.length ? matrices : []"
              :key="matrix.id"
              class="space-y-2.5"
            >
              <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ matrix.question }}</h3>
              <p class="text-sm text-muted">{{ matrix.note }}</p>
              <div class="overflow-x-auto rounded-xl border border-default bg-default">
                <table class="blr-matrix">
                  <thead>
                    <tr>
                      <th class="blr-matrix__corner">Capability</th>
                      <th v-for="column in matrix.columns" :key="column.key" class="blr-matrix__col">
                        <span :title="column.label">{{ column.label }}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="capability in workspace.capabilities" :key="capability.id">
                      <th class="blr-matrix__row">
                        <button type="button" class="hover:text-primary" @click="inspect(capability)">
                          {{ capability.title }}
                        </button>
                      </th>
                      <td v-for="column in matrix.columns" :key="column.key" class="blr-matrix__cell">
                        <button
                          type="button"
                          class="blr-matrix__dot"
                          :data-on="matrix.on(capability, column.key)"
                          :data-picked="isCellPicked(matrix.id, capability.id, column.key)"
                          :title="`${capability.title} × ${column.label}`"
                          @click="pickCell(matrix.id, capability.id, column.key)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <div
              v-if="matrixNote"
              class="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-default px-4 py-3"
            >
              <UIcon name="i-lucide-corner-down-right" class="size-3.5 shrink-0 text-dimmed" />
              <span class="min-w-0 flex-1 text-sm text-default">{{ matrixNote }}</span>
            </div>
            <p v-if="!workspace.capabilities.length" class="text-sm text-muted italic">
              This model declares no Capabilities.
            </p>
          </div>

          <!-- RULES: ranked by explicit binding count, expandable impact -->
          <div v-else-if="activeKind === 'rule'" class="space-y-2.5">
            <p class="text-sm text-muted">
              Ranked by the count of authored attachments (Domains, Capabilities, Journeys, Scenarios) — a count, not a judgement.
            </p>
            <article
              v-for="(rule, rank) in rankedRules"
              :key="rule.id"
              class="rounded-xl border bg-default transition"
              :class="rule.id === activeId ? 'border-primary' : 'border-default hover:border-accented'"
            >
              <button
                type="button"
                class="flex w-full items-center gap-3 px-4 py-2.5 text-start"
                @click="toggleRule(rule.id); activate(rule)"
              >
                <span class="blr-meta w-5 shrink-0 text-end">{{ rank + 1 }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium text-highlighted">{{ rule.title }}</span>
                  <span class="block truncate text-sm text-muted">{{ firstSentence(rule.statement, 110) }}</span>
                </span>
                <span class="blr-meta shrink-0">
                  {{ ruleDirectCount(rule) }} explicit bindings
                </span>
                <UIcon
                  :name="expandedRules.includes(rule.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="size-4 shrink-0 text-dimmed"
                />
              </button>
              <div v-if="expandedRules.includes(rule.id)" class="space-y-3 border-t border-default px-4 py-3.5">
                <BlrProse :text="rule.statement" />
                <div v-if="rule.rationale" class="space-y-1">
                  <p class="blr-field">Rationale</p>
                  <BlrProse :text="rule.rationale" />
                </div>
                <div class="grid gap-4 lg:grid-cols-2">
                  <div class="space-y-1.5 rounded-xl border border-default bg-default p-4">
                    <p class="blr-field">Direct attachments (authored)</p>
                    <BlrLinks :workspace="workspace" :ids="rule.domainIds" kind="domain" interactive @select="inspect" />
                    <BlrLinks :workspace="workspace" :ids="rule.capabilityIds" kind="capability" interactive @select="inspect" />
                    <BlrLinks :workspace="workspace" :ids="rule.journeyIds" kind="journey" interactive @select="inspect" />
                    <BlrLinks :workspace="workspace" :ids="rule.scenarioIds" kind="scenario" interactive @select="inspect" />
                    <p v-if="!ruleDirectCount(rule)" class="text-sm text-muted italic">
                      Attached to nothing explicitly.
                    </p>
                  </div>
                  <div class="space-y-1.5 rounded-xl border border-dashed border-accented p-4">
                    <p class="blr-field">Derived reach (computed)</p>
                    <BlrLinks :workspace="workspace" :ids="ruleImpact(rule).derivedCapabilities.map(item => item.id)" kind="capability" label="Capabilities · via Domain" interactive @select="inspect" />
                    <BlrLinks :workspace="workspace" :ids="ruleImpact(rule).derivedJourneys.map(item => item.id)" kind="journey" label="Journeys · via Capability or Scenario" interactive @select="inspect" />
                    <BlrLinks :workspace="workspace" :ids="ruleImpact(rule).derivedScreens.map(item => item.id)" kind="screen" label="Screens · via Capability" interactive @select="inspect" />
                    <p
                      v-if="!ruleImpact(rule).derivedCapabilities.length && !ruleImpact(rule).derivedJourneys.length && !ruleImpact(rule).derivedScreens.length"
                      class="text-sm text-muted italic"
                    >
                      No further reach derives from the direct attachments.
                    </p>
                  </div>
                </div>
                <BlrAvail
                  :pairs="rule.availability"
                  label="Scoped to"
                  inherited-note="Not narrowed to specific Interface availability scopes."
                />
              </div>
            </article>
            <p v-if="!rankedRules.length" class="text-sm text-muted italic">
              This model declares no Business rules.
            </p>
          </div>
          <!-- ACTORS: who they are and where they enter -->
          <div v-else-if="activeKind === 'actor'" class="grid gap-4 xl:grid-cols-2">
            <article
              v-for="actor in listEntities as ActorView[]"
              :key="actor.id"
              class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
              :class="actor.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
              @click="activate(actor)"
            >
              <header class="flex items-center gap-2">
                <BlrKind kind="actor" :labelled="false" />
                <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ actor.title }}</h3>
                <UBadge color="neutral" variant="subtle" size="sm">{{ actor.actorKind }} · {{ actor.relationship }}</UBadge>
              </header>
              <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ actor.lead }}</p>
              <div class="mt-2.5 space-y-1.5" @click.stop>
                <BlrLinks :workspace="workspace" :ids="actor.interfaceIds" kind="interface" label="Enters" interactive @select="inspect" />
                <BlrLinks :workspace="workspace" :ids="actor.experienceIds" kind="experience" label="Enters" interactive @select="inspect" />
                <BlrLinks :workspace="workspace" :ids="actor.journeyIds" kind="journey" label="Performs" interactive @select="inspect" />
                <p v-if="!actor.interfaceIds.length && !actor.experienceIds.length" class="text-sm text-muted italic">
                  No access context lists this Actor.
                </p>
              </div>
            </article>
            <p v-if="!listEntities.length" class="text-sm text-muted italic">No Actors to show.</p>
          </div>

          <!-- INTERFACES: access contexts — who enters, what is reachable -->
          <div v-else-if="activeKind === 'interface'" class="grid gap-4 xl:grid-cols-2">
            <article
              v-for="item in listEntities as InterfaceView[]"
              :key="item.id"
              class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
              :class="item.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
              @click="activate(item)"
            >
              <header class="flex items-center gap-2">
                <BlrKind kind="interface" :labelled="false" />
                <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ item.title }}</h3>
              </header>
              <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ item.lead }}</p>
              <div class="mt-2.5 space-y-1.5" @click.stop>
                <BlrLinks :workspace="workspace" :ids="item.actorIds" kind="actor" label="Who enters" interactive @select="inspect" />
                <ul v-if="item.entryPoints.length" class="space-y-1">
                  <li v-for="point in item.entryPoints" :key="point.path" class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-corner-down-right" class="size-3 shrink-0 text-dimmed" />
                    <span class="blr-meta truncate">{{ point.path }}</span>
                  </li>
                </ul>
                <div v-if="item.capabilityBoundary" class="space-y-0.5">
                  <p class="blr-field">Capability boundary</p>
                  <p class="text-sm leading-6 text-default">{{ item.capabilityBoundary }}</p>
                </div>
                <BlrLinks :workspace="workspace" :ids="item.experienceIds" kind="experience" label="Experiences within" interactive @select="inspect" />
                <div class="space-y-1.5 border-t border-default pt-2">
                  <p class="blr-field">Available here (derived)</p>
                  <BlrLinks :workspace="workspace" :ids="item.capabilityIds" kind="capability" :max="5" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="item.screenIds" kind="screen" :max="5" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="item.journeyIds" kind="journey" :max="5" interactive @select="inspect" />
                  <p v-if="!item.screenIds.length" class="text-sm text-muted italic">
                    No Screens — not a graphical surface, and that is fine.
                  </p>
                </div>
              </div>
            </article>
            <p v-if="!listEntities.length" class="text-sm text-muted italic">No Interfaces to show.</p>
          </div>

          <!-- EXPERIENCES: bounded contexts inside an Interface -->
          <div v-else-if="activeKind === 'experience'" class="grid gap-4 xl:grid-cols-2">
            <article
              v-for="item in listEntities as ExperienceView[]"
              :key="item.id"
              class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
              :class="item.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
              @click="activate(item)"
            >
              <header class="flex items-center gap-2">
                <BlrKind kind="experience" :labelled="false" />
                <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ item.title }}</h3>
                <UBadge :color="ACCESS_TONE[item.accessMode] || 'neutral'" variant="subtle" size="sm">{{ item.accessMode }}</UBadge>
              </header>
              <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ item.lead }}</p>
              <div class="mt-2.5 space-y-1.5" @click.stop>
                <BlrLinks :workspace="workspace" :ids="item.actorIds" kind="actor" label="Who enters" interactive @select="inspect" />
                <BlrLinks :workspace="workspace" :ids="item.interfaceIds" kind="interface" label="Within" interactive @select="inspect" />
                <ul v-if="item.entryPoints.length" class="space-y-1">
                  <li v-for="point in item.entryPoints" :key="point.path" class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-corner-down-right" class="size-3 shrink-0 text-dimmed" />
                    <span class="blr-meta shrink-0">{{ point.interfaceTitle }}</span>
                    <span class="blr-meta truncate">{{ point.path }}</span>
                  </li>
                </ul>
                <div v-if="item.capabilityBoundary" class="space-y-0.5">
                  <p class="blr-field">Capability boundary</p>
                  <p class="text-sm leading-6 text-default">{{ item.capabilityBoundary }}</p>
                </div>
                <div class="space-y-1.5 border-t border-default pt-2">
                  <p class="blr-field">Available here (derived)</p>
                  <BlrLinks :workspace="workspace" :ids="item.capabilityIds" kind="capability" :max="5" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="item.screenIds" kind="screen" :max="5" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="item.journeyIds" kind="journey" :max="5" interactive @select="inspect" />
                </div>
              </div>
            </article>
            <p v-if="!listEntities.length" class="text-sm text-muted italic">
              This model declares no Experiences — every Interface is a single access context.
            </p>
          </div>

          <!-- SCENARIOS: flow lanes, grouped by Journey -->
          <div v-else-if="activeKind === 'scenario'" class="space-y-6">
            <section v-for="group in scenarioGroups" :key="group.journey.id" class="space-y-2.5">
              <header class="flex items-center gap-2">
                <BlrKind kind="journey" :labelled="false" size="xs" />
                <button
                  type="button"
                  class="text-base font-semibold tracking-tight text-highlighted hover:text-primary"
                  @click="inspect(group.journey)"
                >
                  {{ group.journey.title }}
                </button>
                <span class="blr-meta">{{ group.scenarios.length }} scenarios</span>
              </header>
              <article
                v-for="scenario in group.scenarios"
                :key="scenario.id"
                class="rounded-xl border bg-default p-4 transition"
                :class="scenario.id === activeId ? 'border-primary' : 'border-default'"
              >
                <header class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="text-sm font-medium text-highlighted hover:text-primary"
                    @click="activate(scenario)"
                  >
                    {{ scenario.title }}
                  </button>
                  <UBadge color="neutral" variant="subtle" size="sm">{{ scenario.kindName }}</UBadge>
                </header>
                <div class="mt-2.5 flex items-stretch gap-1.5 overflow-x-auto pb-1.5">
                  <div class="blr-lanecard blr-lanecard--trigger">
                    <p class="blr-field">Trigger</p>
                    <p class="mt-0.5">{{ scenario.trigger }}</p>
                  </div>
                  <template v-for="(step, index) in scenario.steps" :key="`step-${index}`">
                    <UIcon name="i-lucide-arrow-right" class="size-3.5 shrink-0 self-center text-dimmed" />
                    <div class="blr-lanecard">
                      <p class="blr-field">Step {{ index + 1 }}</p>
                      <p class="mt-0.5">{{ step }}</p>
                    </div>
                  </template>
                  <template v-for="(point, index) in scenario.decisionPoints" :key="`decision-${index}`">
                    <UIcon name="i-lucide-arrow-right" class="size-3.5 shrink-0 self-center text-dimmed" />
                    <div class="blr-lanecard blr-lanecard--decision">
                      <p class="blr-field flex items-center gap-1">
                        <UIcon name="i-lucide-git-branch" class="size-3 shrink-0" /> {{ point.title }}
                      </p>
                      <p class="mt-0.5 text-muted">{{ point.question }}</p>
                      <p v-for="(branch, branchIndex) in point.branches" :key="branchIndex" class="mt-1 text-xs">
                        <span class="rounded bg-muted px-1 font-mono">{{ branch.condition }}</span>
                        <span class="text-muted"> → {{ branch.outcome }}</span>
                      </p>
                    </div>
                  </template>
                  <UIcon name="i-lucide-arrow-right" class="size-3.5 shrink-0 self-center text-dimmed" />
                  <div class="blr-lanecard blr-lanecard--outcome">
                    <p class="blr-field">Outcome</p>
                    <p class="mt-0.5">{{ scenario.outcome }}</p>
                  </div>
                </div>
                <div class="mt-2 space-y-1.5">
                  <p v-if="scenario.edgeCases.length" class="text-sm text-muted">
                    <span class="blr-field me-1">Edge cases · {{ scenario.edgeCases.length }}</span>
                    {{ scenario.edgeCases.join(' · ') }}
                  </p>
                  <BlrLinks :workspace="workspace" :ids="scenario.screenIds" kind="screen" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="scenario.ruleIds" kind="rule" label="Constrained by" interactive @select="inspect" />
                </div>
              </article>
            </section>
            <section v-if="orphanScenarios.length" class="space-y-1.5">
              <p class="blr-field">Scenarios whose Journey is not in the model</p>
              <p v-for="scenario in orphanScenarios" :key="scenario.id" class="text-sm text-muted">
                {{ scenario.title }} — declares journey “{{ scenario.journeyId }}”.
              </p>
            </section>
            <p v-if="!scenarioGroups.length && !orphanScenarios.length" class="text-sm text-muted italic">
              This model declares no Scenarios.
            </p>
          </div>

          <!-- DOMAINS: capability areas and their derived reach -->
          <div v-else-if="activeKind === 'domain'" class="grid gap-4 xl:grid-cols-2">
            <article
              v-for="domain in listEntities as DomainView[]"
              :key="domain.id"
              class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
              :class="domain.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
              @click="activate(domain)"
            >
              <header class="flex items-center gap-2">
                <BlrKind kind="domain" :labelled="false" />
                <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ domain.title }}</h3>
                <span class="blr-meta ms-auto">{{ domain.capabilityIds.length }} capabilities</span>
              </header>
              <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ domain.lead }}</p>
              <div class="mt-2.5 space-y-1.5" @click.stop>
                <BlrLinks :workspace="workspace" :ids="domain.capabilityIds" kind="capability" interactive @select="inspect" />
                <div class="space-y-1.5 border-t border-default pt-2">
                  <p class="blr-field">Derived reach</p>
                  <BlrLinks :workspace="workspace" :ids="domain.journeyIds" kind="journey" :max="5" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="domain.screenIds" kind="screen" :max="5" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="domain.ruleIds" kind="rule" :max="5" interactive @select="inspect" />
                </div>
              </div>
            </article>
            <p v-if="!listEntities.length" class="text-sm text-muted italic">
              This model declares no Domains; Capabilities are listed ungrouped in the Capabilities view.
            </p>
          </div>
        </div>
      </section>

      <!-- INSPECTOR: the shared slideover every selection re-targets -->
      <BlrInspector
        v-model:tab="inspectorTab"
        :workspace="workspace"
        :entity="inspected"
        @select="inspect($event)"
        @close="inspected = null"
      />
    </div>
  </div>
</template>

<style scoped>
/*
  The categorical slot variables mirror BlrFlowCanvas so the kind colours read
  identically inside and outside the graphs. Hexes appear only here, as the
  definition of the vars the markup consumes.
*/
.blr-tripane {
  --blr-slot-0: #2a78d6;
  --blr-slot-1: #eb6834;
  --blr-slot-2: #1baf7a;
  --blr-slot-3: #eda100;
  --blr-slot-4: #e87ba4;
  --blr-slot-5: #008300;
  --blr-slot-6: #4a3aa7;
  --blr-slot-7: #e34948;
  --blr-slot-8: #746651;
  --blr-slot-9: #2a78d6;
  font-variant-numeric: tabular-nums;
}

:global(.dark) .blr-tripane {
  --blr-slot-0: #3987e5;
  --blr-slot-1: #d95926;
  --blr-slot-2: #199e70;
  --blr-slot-3: #c98500;
  --blr-slot-4: #d55181;
  --blr-slot-5: #008300;
  --blr-slot-6: #9085e9;
  --blr-slot-7: #e66767;
  --blr-slot-8: #ab9d81;
  --blr-slot-9: #3987e5;
}

/* Left rail: kind switcher rows */
.blr-navitem {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
  transition: background 0.12s ease, color 0.12s ease;
}

.blr-navitem:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.blr-navitem[data-current='true'] {
  background: color-mix(in srgb, var(--kind-color) 10%, var(--ui-bg-elevated));
  box-shadow: inset 2px 0 0 var(--kind-color);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

/* Left rail: entity list rows */
.blr-listitem {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  text-align: start;
  transition: background 0.12s ease;
}

.blr-listitem:hover {
  background: var(--ui-bg-elevated);
}

.blr-listitem[data-active='true'] {
  background: color-mix(in srgb, var(--kind-color) 12%, var(--ui-bg-elevated));
}

.blr-listitem__tick {
  width: 3px;
  height: 1rem;
  flex-shrink: 0;
  border-radius: 2px;
  background: color-mix(in srgb, var(--kind-color) 45%, transparent);
}

.blr-listitem[data-active='true'] .blr-listitem__tick {
  background: var(--kind-color);
}

/* Matrices: row heads truncate, column heads run vertical, cells stay square. */
.blr-matrix {
  border-collapse: collapse;
  font-size: var(--text-xs);
}

.blr-matrix__corner {
  position: sticky;
  left: 0;
  z-index: 2;
  padding: 0.4rem 0.6rem;
  background: var(--ui-bg-elevated);
  font-size: var(--text-xs);
  font-weight: 500;
  text-align: start;
  color: var(--ui-text-muted);
}

.blr-matrix__col {
  height: 7.5rem;
  padding: 0.4rem 0.15rem;
  vertical-align: bottom;
  background: color-mix(in srgb, var(--ui-bg-elevated) 55%, transparent);
}

.blr-matrix__col span {
  display: inline-block;
  max-height: 6.8rem;
  overflow: hidden;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--ui-text-toned);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.blr-matrix__row {
  position: sticky;
  left: 0;
  z-index: 1;
  max-width: 14rem;
  padding: 0.25rem 0.6rem;
  background: var(--ui-bg);
  border-top: 1px solid var(--ui-border-muted);
  font-weight: 500;
  text-align: start;
  color: var(--ui-text-toned);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.blr-matrix__cell {
  border-top: 1px solid var(--ui-border-muted);
  border-left: 1px solid var(--ui-border-muted);
  text-align: center;
}

.blr-matrix__dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 2rem;
  height: 1.6rem;
  cursor: pointer;
}

.blr-matrix__dot::after {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--ui-text-dimmed) 18%, transparent);
  transition: transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
}

.blr-matrix__dot[data-on='true']::after {
  background: var(--ui-primary);
}

.blr-matrix__dot:hover::after {
  transform: scale(1.35);
}

.blr-matrix__dot[data-picked='true']::after {
  transform: scale(1.35);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ui-primary) 45%, transparent);
}

/* Scenario flow lane cards */
.blr-lanecard {
  flex-shrink: 0;
  width: 13rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--ui-text);
}

.blr-lanecard--trigger {
  border-inline-start: 2px solid var(--blr-slot-7);
}

.blr-lanecard--decision {
  border-style: dashed;
  width: 15rem;
}

.blr-lanecard--outcome {
  border-inline-start: 2px solid var(--ui-primary);
}
</style>
