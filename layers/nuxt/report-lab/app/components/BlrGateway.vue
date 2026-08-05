<script setup lang="ts">
/**
 * Gateway — the Screen map is the front door.
 *
 * IA: access contexts organise the whole report. HOME ("Surface") is the
 * shared Screen map with an actor band above it; the left rail lists every
 * availability scope from `workspace.pairs` ("Whole product", each Interface
 * directly, each Interface › Experience). Picking a context emphasises its
 * Screens on the map and opens a scope panel of exactly what exists there;
 * Compare mode turns the surface into a factual set-membership delta of two
 * contexts. Tabs complete the report: Promises (journey cards ⇄ table, full
 * scenario reading), Abilities (domain-grouped capabilities + two named
 * matrices), Constraints (rule impact, direct vs derived), About (identity,
 * coverage, references). Any entity opens the shared inspector slideover:
 * full BlrEntityDetail with a "Map" tab to the contextual BlrTopology.
 */
import { h } from 'vue'
import type { TableColumn, TabsItem } from '@nuxt/ui'
import type {
  ActorView,
  AnyEntityView,
  AvailabilityPair,
  CapabilityView,
  DomainView,
  EntryPointView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportWorkspace,
  RuleView
} from '../utils/reportWorkspace'
import { resolveEntities } from '../utils/reportWorkspace'
import { buildScreenMap } from '../utils/flowGraph'
import { firstSentence } from '../utils/reportMarkdown'
import { slotColor } from '../utils/reportPalette'

const UButton = resolveComponent('UButton')

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

type TabId = 'surface' | 'promises' | 'abilities' | 'constraints' | 'about'

const TABS: TabsItem[] = [
  { value: 'surface', label: 'Surface', icon: 'i-lucide-door-open' },
  { value: 'promises', label: 'Promises', icon: 'i-lucide-route' },
  { value: 'abilities', label: 'Abilities', icon: 'i-lucide-zap' },
  { value: 'constraints', label: 'Constraints', icon: 'i-lucide-scale' },
  { value: 'about', label: 'About', icon: 'i-lucide-info' }
]

const ACCESS_TONE: Record<string, 'success' | 'warning' | 'error'> = {
  public: 'success',
  authenticated: 'warning',
  restricted: 'error'
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  complete: 'success',
  partial: 'warning',
  draft: 'neutral'
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

const tab = ref<TabId>('surface')
const contextKey = ref<string | null>(null)
const compareOn = ref(false)
const compareA = ref<string | null>(null)
const compareB = ref<string | null>(null)
const inspectorId = ref<string | null>(null)
const inspectorMode = ref<'detail' | 'map'>('detail')
const journeyView = ref<'cards' | 'table'>('cards')
const openJourneyId = ref<string | null>(null)
const selectedRuleId = ref<string | null>(null)
const matrixExplain = ref<{ matrix: 'reach' | 'depends', rowId: string, colId: string } | null>(null)

/* Matrix cell colour follows the column question's entity kind (see BlrKind). */
const colorMode = useColorMode()
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
const isDark = computed(() => mounted.value && colorMode.value === 'dark')
const reachCellColor = computed(() => slotColor(5, isDark.value))
const dependsCellColor = computed(() => slotColor(6, isDark.value))

/* ------------------------------------------------------------------ */
/* Context helpers                                                     */
/* ------------------------------------------------------------------ */

function inContext(entity: { availability: AvailabilityPair[] }, key: string): boolean {
  return entity.availability.some(pair => pair.key === key)
}

function pairLabel(pair: AvailabilityPair): string {
  return pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : pair.interfaceTitle
}

function keyLabel(key: string | null): string {
  if (!key) return 'Whole product'
  const pair = props.workspace.pairs.find(item => item.key === key)
  return pair ? pairLabel(pair) : 'Whole product'
}

function isActiveContext(key: string): boolean {
  return contextKey.value === key && !compareOn.value
}

interface RailGroup {
  iface: InterfaceView
  direct: AvailabilityPair | null
  experiences: Array<{ pair: AvailabilityPair, experience: ExperienceView | null }>
}

const railGroups = computed<RailGroup[]>(() => props.workspace.interfaces.map((iface) => {
  const pairs = props.workspace.pairs.filter(pair => pair.interfaceId === iface.id)
  return {
    iface,
    direct: pairs.find(pair => !pair.experienceId) ?? null,
    experiences: pairs.filter(pair => pair.experienceId).map((pair) => {
      const entity = props.workspace.byId.get(pair.experienceId)
      return { pair, experience: entity && entity.kind === 'experience' ? entity : null }
    })
  }
}))

/** Derived per-context counts, computed once for the rail. */
const contextCounts = computed(() => {
  const counts = new Map<string, { screens: number, capabilities: number, journeys: number }>()
  for (const pair of props.workspace.pairs) counts.set(pair.key, { screens: 0, capabilities: 0, journeys: 0 })
  for (const screen of props.workspace.screens) {
    for (const pair of screen.availability) {
      const entry = counts.get(pair.key)
      if (entry) entry.screens += 1
    }
  }
  for (const capability of props.workspace.capabilities) {
    for (const pair of capability.availability) {
      const entry = counts.get(pair.key)
      if (entry) entry.capabilities += 1
    }
  }
  for (const journey of props.workspace.journeys) {
    for (const pair of journey.availability) {
      const entry = counts.get(pair.key)
      if (entry) entry.journeys += 1
    }
  }
  return counts
})

function countsFor(key: string): { screens: number, capabilities: number, journeys: number } {
  return contextCounts.value.get(key) ?? { screens: 0, capabilities: 0, journeys: 0 }
}

interface ScopeInfo {
  pair: AvailabilityPair
  hostInterface: InterfaceView | null
  hostExperience: ExperienceView | null
  screenIds: string[]
  capabilityIds: string[]
  journeyIds: string[]
  ruleIds: string[]
  actorIds: string[]
  entryPoints: EntryPointView[]
  boundary: string
}

function buildScope(key: string): ScopeInfo | null {
  const pair = props.workspace.pairs.find(item => item.key === key)
  if (!pair) return null
  const rawInterface = props.workspace.byId.get(pair.interfaceId)
  const rawExperience = pair.experienceId ? props.workspace.byId.get(pair.experienceId) : undefined
  const hostInterface = rawInterface && rawInterface.kind === 'interface' ? rawInterface : null
  const hostExperience = rawExperience && rawExperience.kind === 'experience' ? rawExperience : null
  const host = hostExperience ?? hostInterface
  return {
    pair,
    hostInterface,
    hostExperience,
    screenIds: props.workspace.screens.filter(item => inContext(item, key)).map(item => item.id),
    capabilityIds: props.workspace.capabilities.filter(item => inContext(item, key)).map(item => item.id),
    journeyIds: props.workspace.journeys.filter(item => inContext(item, key)).map(item => item.id),
    ruleIds: props.workspace.rules.filter(item => item.availability.some(entry => entry.key === key)).map(item => item.id),
    actorIds: host?.actorIds ?? [],
    entryPoints: host?.entryPoints ?? [],
    boundary: host?.capabilityBoundary ?? ''
  }
}

const activeScope = computed(() => (contextKey.value ? buildScope(contextKey.value) : null))

const screenMap = computed(() => {
  const scope = activeScope.value
  return buildScreenMap(props.workspace, {
    emphasizeScreenIds: scope ? new Set(scope.screenIds) : null,
    selectedId: scope ? (scope.hostExperience?.id ?? scope.hostInterface?.id ?? null) : null
  })
})

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

function inspect(entityId: string) {
  inspectorId.value = entityId
  inspectorMode.value = 'detail'
}

function inspectEntity(entity: AnyEntityView) {
  inspect(entity.id)
}

function openTopology(entityId: string) {
  inspectorId.value = entityId
  inspectorMode.value = 'map'
}

function closeInspector() {
  inspectorId.value = null
}

const inspectorEntity = computed(() => (inspectorId.value ? props.workspace.byId.get(inspectorId.value) ?? null : null))

function pickContext(key: string) {
  if (compareOn.value) {
    if (compareA.value === key) compareA.value = null
    else if (compareB.value === key) compareB.value = null
    else if (!compareA.value) compareA.value = key
    else compareB.value = key
    return
  }
  contextKey.value = contextKey.value === key ? null : key
}

function pickWholeProduct() {
  compareOn.value = false
  contextKey.value = null
}

function goToContext(key: string) {
  compareOn.value = false
  contextKey.value = key
  tab.value = 'surface'
}

function toggleCompare() {
  compareOn.value = !compareOn.value
  if (compareOn.value) {
    compareA.value = contextKey.value
    compareB.value = null
  }
}

function handleMapSelect(entityId: string) {
  const entity = props.workspace.byId.get(entityId)
  if (!entity) return
  if (entity.kind === 'interface') {
    const pair = props.workspace.pairs.find(item => item.interfaceId === entityId && !item.experienceId)
    if (pair) {
      pickContext(pair.key)
      return
    }
  }
  if (entity.kind === 'experience') {
    const pair = props.workspace.pairs.find(item => item.experienceId === entityId)
    if (pair) {
      pickContext(pair.key)
      return
    }
  }
  inspect(entityId)
}

/* ------------------------------------------------------------------ */
/* Compare mode                                                        */
/* ------------------------------------------------------------------ */

interface CompareBucket {
  kind: 'capability' | 'journey' | 'screen'
  label: string
  both: string[]
  onlyA: string[]
  onlyB: string[]
}

const compareData = computed(() => {
  if (!compareOn.value || !compareA.value || !compareB.value) return null
  const a = compareA.value
  const b = compareB.value
  const pairA = props.workspace.pairs.find(pair => pair.key === a)
  const pairB = props.workspace.pairs.find(pair => pair.key === b)
  if (!pairA || !pairB) return null
  const bucket = (
    kind: CompareBucket['kind'],
    label: string,
    items: Array<{ id: string, availability: AvailabilityPair[] }>
  ): CompareBucket => ({
    kind,
    label,
    both: items.filter(item => inContext(item, a) && inContext(item, b)).map(item => item.id),
    onlyA: items.filter(item => inContext(item, a) && !inContext(item, b)).map(item => item.id),
    onlyB: items.filter(item => !inContext(item, a) && inContext(item, b)).map(item => item.id)
  })
  return {
    pairA,
    pairB,
    buckets: [
      bucket('capability', 'Capabilities', props.workspace.capabilities),
      bucket('journey', 'Journeys', props.workspace.journeys),
      bucket('screen', 'Screens', props.workspace.screens)
    ]
  }
})

const compareColumns = computed(() => {
  const data = compareData.value
  if (!data) return []
  return [
    { id: 'both', title: 'Available in both', field: 'both' as const },
    { id: 'onlyA', title: `Only in ${pairLabel(data.pairA)}`, field: 'onlyA' as const },
    { id: 'onlyB', title: `Only in ${pairLabel(data.pairB)}`, field: 'onlyB' as const }
  ]
})

function compareColumnCount(field: 'both' | 'onlyA' | 'onlyB'): number {
  const data = compareData.value
  if (!data) return 0
  return data.buckets.reduce((total, bucket) => total + bucket[field].length, 0)
}

/* ------------------------------------------------------------------ */
/* Actors band                                                         */
/* ------------------------------------------------------------------ */

function actorEntryLabel(actor: ActorView): string {
  const titles = resolveEntities(props.workspace, [...actor.interfaceIds, ...actor.experienceIds])
    .map(entity => entity.title)
  return titles.length ? titles.join(' · ') : 'no declared entry context'
}

/* ------------------------------------------------------------------ */
/* Promises                                                            */
/* ------------------------------------------------------------------ */

const scopedJourneys = computed(() => {
  const key = contextKey.value
  return key ? props.workspace.journeys.filter(item => inContext(item, key)) : props.workspace.journeys
})

const openJourney = computed<JourneyView | null>(() => {
  const entity = openJourneyId.value ? props.workspace.byId.get(openJourneyId.value) : null
  return entity && entity.kind === 'journey' ? entity : null
})

const openJourneyScenarios = computed(() => {
  const journey = openJourney.value
  return journey ? props.workspace.scenariosByJourney.get(journey.id) ?? [] : []
})

function scenarioNames(journey: JourneyView): string {
  return (props.workspace.scenariosByJourney.get(journey.id) ?? []).map(item => item.title).join(' · ')
}

function titlesOf(ids: string[]): string {
  return resolveEntities(props.workspace, ids).map(entity => entity.title).join(', ')
}

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
    cell: ({ row }) => h('span', { class: 'font-medium text-highlighted' }, row.original.title)
  },
  {
    id: 'actors',
    accessorFn: journey => titlesOf(journey.actorIds),
    header: sortableHeader('Actors'),
    cell: ({ row }) => h('span', { class: 'text-muted' }, titlesOf(row.original.actorIds))
  },
  {
    id: 'contexts',
    accessorFn: journey => journey.availability.length,
    header: sortableHeader('Contexts'),
    cell: ({ row }) => countCell(row.original.availability.length, row.original.availability.map(pairLabel).join(', '))
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
/* Abilities                                                           */
/* ------------------------------------------------------------------ */

const scopedCapabilities = computed(() => {
  const key = contextKey.value
  return key ? props.workspace.capabilities.filter(item => inContext(item, key)) : props.workspace.capabilities
})

interface DomainGroup {
  id: string
  domain: DomainView | null
  capabilities: CapabilityView[]
}

const domainGroups = computed<DomainGroup[]>(() => {
  const scoped = new Set(scopedCapabilities.value.map(item => item.id))
  const groups: DomainGroup[] = props.workspace.domains.map(domain => ({
    id: domain.id,
    domain,
    capabilities: (props.workspace.capabilitiesByDomain.get(domain.id) ?? []).filter(item => scoped.has(item.id))
  }))
  const undomained = (props.workspace.capabilitiesByDomain.get('') ?? []).filter(item => scoped.has(item.id))
  if (undomained.length) groups.push({ id: '', domain: null, capabilities: undomained })
  return groups.filter(group => group.capabilities.length || !contextKey.value)
})

function explainCell(matrix: 'reach' | 'depends', rowId: string, colId: string) {
  const current = matrixExplain.value
  matrixExplain.value = current && current.matrix === matrix && current.rowId === rowId && current.colId === colId
    ? null
    : { matrix, rowId, colId }
}

function cellPicked(matrix: 'reach' | 'depends', rowId: string, colId: string): boolean {
  const current = matrixExplain.value
  return Boolean(current && current.matrix === matrix && current.rowId === rowId && current.colId === colId)
}

interface MatrixDetail {
  matrix: 'reach' | 'depends'
  capability: CapabilityView
  pair: AvailabilityPair | null
  journey: JourneyView | null
  on: boolean
  screenIds: string[]
}

const matrixDetail = computed<MatrixDetail | null>(() => {
  const cell = matrixExplain.value
  if (!cell) return null
  const capability = props.workspace.byId.get(cell.rowId)
  if (!capability || capability.kind !== 'capability') return null
  if (cell.matrix === 'reach') {
    const pair = props.workspace.pairs.find(item => item.key === cell.colId)
    if (!pair) return null
    const on = inContext(capability, pair.key)
    const screenIds = props.workspace.screens
      .filter(item => item.capabilityIds.includes(capability.id) && inContext(item, pair.key))
      .map(item => item.id)
    return { matrix: 'reach', capability, pair, journey: null, on, screenIds }
  }
  const journey = props.workspace.byId.get(cell.colId)
  if (!journey || journey.kind !== 'journey') return null
  const on = journey.capabilityIds.includes(capability.id)
  const screenIds = props.workspace.screens
    .filter(item => item.capabilityIds.includes(capability.id) && journey.screenIds.includes(item.id))
    .map(item => item.id)
  return { matrix: 'depends', capability, pair: null, journey, on, screenIds }
})

/* ------------------------------------------------------------------ */
/* Constraints                                                         */
/* ------------------------------------------------------------------ */

const selectedRule = computed<RuleView | null>(() => {
  const chosen = selectedRuleId.value ? props.workspace.byId.get(selectedRuleId.value) : null
  if (chosen && chosen.kind === 'rule') return chosen
  return props.workspace.rules[0] ?? null
})

interface RuleImpact {
  derivedCapabilityIds: string[]
  derivedDomainIds: string[]
  derivedJourneyIds: string[]
  derivedScreenIds: string[]
  directTotal: number
  derivedTotal: number
}

const ruleImpact = computed<RuleImpact | null>(() => {
  const rule = selectedRule.value
  if (!rule) return null
  const directCapability = new Set(rule.capabilityIds)
  const directDomain = new Set(rule.domainIds)
  const directJourney = new Set(rule.journeyIds)
  const directScenario = new Set(rule.scenarioIds)
  const derivedCapabilityIds = props.workspace.capabilities
    .filter(item => item.domainId && directDomain.has(item.domainId) && !directCapability.has(item.id))
    .map(item => item.id)
  const capabilityReach = new Set([...directCapability, ...derivedCapabilityIds])
  const derivedDomainIds = [...new Set(props.workspace.capabilities
    .filter(item => directCapability.has(item.id) && item.domainId)
    .map(item => item.domainId as string))]
    .filter(id => !directDomain.has(id))
  const derivedJourneyIds = props.workspace.journeys
    .filter(item => !directJourney.has(item.id)
      && (item.capabilityIds.some(id => capabilityReach.has(id))
        || item.scenarioIds.some(id => directScenario.has(id))))
    .map(item => item.id)
  const derivedScreenIds = props.workspace.screens
    .filter(item => item.capabilityIds.some(id => capabilityReach.has(id))
      || item.scenarioIds.some(id => directScenario.has(id)))
    .map(item => item.id)
  return {
    derivedCapabilityIds,
    derivedDomainIds,
    derivedJourneyIds,
    derivedScreenIds,
    directTotal: rule.domainIds.length + rule.capabilityIds.length + rule.journeyIds.length + rule.scenarioIds.length,
    derivedTotal: derivedCapabilityIds.length + derivedDomainIds.length + derivedJourneyIds.length + derivedScreenIds.length
  }
})

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

const countEntries = computed(() => {
  const counts = props.workspace.counts
  return [
    { label: 'Actors', value: counts.actors },
    { label: 'Interfaces', value: counts.interfaces },
    { label: 'Experiences', value: counts.experiences },
    { label: 'Screens', value: counts.screens },
    { label: 'Domains', value: counts.domains },
    { label: 'Capabilities', value: counts.capabilities },
    { label: 'Journeys', value: counts.journeys },
    { label: 'Scenarios', value: counts.scenarios },
    { label: 'Business rules', value: counts.rules },
    { label: 'Availability scopes', value: counts.availabilityPairs },
    { label: 'Entry points', value: counts.entryPoints },
    { label: 'Steps', value: counts.steps },
    { label: 'Decision points', value: counts.decisionPoints },
    { label: 'Branches', value: counts.branches },
    { label: 'Edge cases', value: counts.edgeCases },
    { label: 'Screen states', value: counts.screenStates },
    { label: 'References', value: counts.references }
  ]
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- Identity strip + view nav -->
    <header class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-default px-4 py-2">
      <img v-if="logoSrc" :src="logoSrc" alt="" class="size-6 shrink-0 rounded">
      <UIcon v-else name="i-lucide-door-open" class="size-5 shrink-0 text-primary" />
      <div class="min-w-0">
        <p class="truncate text-sm leading-tight font-semibold tracking-tight text-highlighted">{{ workspace.identity.title }}</p>
        <p class="hidden max-w-xl truncate text-xs text-dimmed sm:block">{{ workspace.identity.summary }}</p>
      </div>
      <UTabs
        v-model="tab"
        :items="TABS"
        :content="false"
        color="neutral"
        size="sm"
        class="ms-auto"
      />
    </header>

    <div class="relative flex min-h-0 flex-1">
      <!-- ============ SURFACE: the front door ============ -->
      <div v-if="tab === 'surface'" class="flex min-h-0 min-w-0 flex-1">
        <!-- Context switcher rail -->
        <nav class="blr-pane w-72 shrink-0 border-e border-default">
          <div class="space-y-1 p-3">
            <div class="flex items-center justify-between gap-2 pb-1">
              <p class="blr-field">Access contexts</p>
              <UButton
                icon="i-lucide-columns-2"
                size="xs"
                color="neutral"
                :variant="compareOn ? 'solid' : 'outline'"
                label="Compare"
                title="Pick two contexts and read their factual delta"
                @click="toggleCompare"
              />
            </div>
            <button
              type="button"
              class="gw-context gw-context--direct"
              :class="{ 'is-active': !contextKey && !compareOn }"
              @click="pickWholeProduct"
            >
              <span class="flex items-center gap-1.5">
                <UIcon name="i-lucide-globe" class="size-3.5 shrink-0 text-dimmed" />
                <span
                  class="truncate text-sm"
                  :class="!contextKey && !compareOn ? 'font-medium text-highlighted' : 'text-default'"
                >Whole product</span>
              </span>
              <span class="blr-meta mt-0.5 block" title="Counts from the model">
                {{ workspace.counts.screens }} screens · {{ workspace.counts.capabilities }} capabilities · {{ workspace.counts.journeys }} journeys
              </span>
            </button>

            <div v-for="group in railGroups" :key="group.iface.id" class="pt-2">
              <button
                v-if="group.direct"
                type="button"
                class="gw-context gw-context--direct"
                :class="{ 'is-active': isActiveContext(group.direct.key) }"
                @click="pickContext(group.direct.key)"
              >
                <span class="flex items-center gap-1.5">
                  <BlrKind kind="interface" :labelled="false" size="xs" />
                  <span
                    class="truncate text-sm"
                    :class="isActiveContext(group.direct.key) ? 'font-medium text-highlighted' : 'text-default'"
                  >{{ group.iface.title }}</span>
                  <span class="blr-meta shrink-0">direct</span>
                  <UBadge v-if="compareOn && compareA === group.direct.key" color="primary" variant="outline" size="sm">A</UBadge>
                  <UBadge v-if="compareOn && compareB === group.direct.key" color="primary" variant="outline" size="sm">B</UBadge>
                </span>
                <span class="blr-meta mt-0.5 block" title="Derived: entities declaring availability here">
                  {{ countsFor(group.direct.key).screens }} screens · {{ countsFor(group.direct.key).capabilities }} capabilities · {{ countsFor(group.direct.key).journeys }} journeys
                </span>
              </button>
              <p v-else class="flex items-center gap-1.5 px-2 py-1">
                <BlrKind kind="interface" :labelled="false" size="xs" />
                <span class="truncate text-sm font-medium text-muted">{{ group.iface.title }}</span>
              </p>

              <button
                v-for="entry in group.experiences"
                :key="entry.pair.key"
                type="button"
                class="gw-context gw-context--nested"
                :class="{ 'is-active': isActiveContext(entry.pair.key) }"
                @click="pickContext(entry.pair.key)"
              >
                <span class="flex items-center gap-1.5">
                  <BlrKind kind="experience" :labelled="false" size="xs" />
                  <span
                    class="truncate text-sm"
                    :class="isActiveContext(entry.pair.key) ? 'font-medium text-highlighted' : 'text-default'"
                  >{{ entry.pair.experienceTitle }}</span>
                  <UBadge
                    v-if="entry.experience"
                    :color="ACCESS_TONE[entry.experience.accessMode] || 'neutral'"
                    variant="subtle"
                    size="sm"
                  >
                    {{ entry.experience.accessMode }}
                  </UBadge>
                  <UBadge v-if="compareOn && compareA === entry.pair.key" color="primary" variant="outline" size="sm">A</UBadge>
                  <UBadge v-if="compareOn && compareB === entry.pair.key" color="primary" variant="outline" size="sm">B</UBadge>
                </span>
                <span class="blr-meta mt-0.5 block" title="Derived: entities declaring availability here">
                  {{ countsFor(entry.pair.key).screens }} screens · {{ countsFor(entry.pair.key).capabilities }} capabilities · {{ countsFor(entry.pair.key).journeys }} journeys
                </span>
              </button>
            </div>
          </div>
        </nav>

        <!-- Actor band + map / compare surface -->
        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
          <div class="shrink-0 overflow-x-auto border-b border-default">
            <div class="flex min-w-max items-stretch gap-2 px-3 py-2">
              <button
                v-for="actor in workspace.actors"
                :key="actor.id"
                type="button"
                class="flex min-w-60 max-w-72 flex-col rounded-xl border border-default bg-default px-3 py-2 text-start transition hover:border-accented"
                @click="inspect(actor.id)"
              >
                <span class="flex items-center gap-1.5">
                  <BlrKind kind="actor" :labelled="false" size="xs" />
                  <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ actor.title }}</span>
                  <UBadge color="neutral" variant="subtle" size="sm">
                    {{ actor.actorKind }} · {{ actor.relationship }}
                  </UBadge>
                </span>
                <span class="mt-1 flex items-baseline gap-1.5">
                  <span class="blr-field shrink-0">Enters</span>
                  <span class="truncate text-sm text-default" :title="actorEntryLabel(actor)">{{ actorEntryLabel(actor) }}</span>
                </span>
              </button>
              <p v-if="!workspace.actors.length" class="self-center text-sm text-muted italic">
                No Actors authored in this model.
              </p>
            </div>
          </div>

          <div class="relative min-h-0 flex-1">
            <!-- Compare delta replaces the map when both contexts are chosen -->
            <div v-if="compareData" class="blr-pane h-full">
              <div class="space-y-4 p-4 sm:p-6">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-base font-semibold tracking-tight text-highlighted">Context comparison</h3>
                  <span class="inline-flex items-center gap-1.5 text-sm font-medium text-highlighted">
                    <UBadge color="primary" variant="outline" size="sm">A</UBadge>
                    {{ pairLabel(compareData.pairA) }}
                  </span>
                  <span class="text-sm text-muted">vs</span>
                  <span class="inline-flex items-center gap-1.5 text-sm font-medium text-highlighted">
                    <UBadge color="primary" variant="outline" size="sm">B</UBadge>
                    {{ pairLabel(compareData.pairB) }}
                  </span>
                  <span class="ms-auto text-sm text-muted">Set membership by declared availability — nothing is ranked.</span>
                  <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" label="Exit compare" @click="toggleCompare" />
                </div>
                <div class="grid gap-3 lg:grid-cols-3">
                  <section
                    v-for="column in compareColumns"
                    :key="column.id"
                    class="space-y-3 rounded-xl border border-default bg-default p-4"
                  >
                    <h4 class="text-base font-semibold tracking-tight text-highlighted">
                      {{ column.title }}
                      <span class="blr-meta ms-1">{{ compareColumnCount(column.field) }}</span>
                    </h4>
                    <template v-for="bucket in compareData.buckets" :key="bucket.kind">
                      <BlrLinks
                        :workspace="workspace"
                        :ids="bucket[column.field]"
                        :kind="bucket.kind"
                        :label="bucket.label"
                        interactive
                        @select="inspectEntity"
                      />
                    </template>
                    <p v-if="!compareColumnCount(column.field)" class="text-sm text-muted italic">
                      None in this set.
                    </p>
                  </section>
                </div>
              </div>
            </div>

            <template v-else>
              <BlrFlowCanvas
                :nodes="screenMap.nodes"
                @select="handleMapSelect"
                @focus="inspect"
                @clear="closeInspector"
              />
              <div
                v-if="compareOn"
                class="absolute top-2 left-1/2 -translate-x-1/2 rounded-full border border-default bg-elevated/90 px-3 py-1 text-sm text-muted shadow-sm"
              >
                Pick two contexts in the rail to compare — {{ compareA || compareB ? '1 of 2' : '0 of 2' }} chosen.
              </div>
            </template>
          </div>
        </div>

        <!-- Scope panel: exactly what exists in the selected context -->
        <aside
          v-if="activeScope && !compareOn"
          class="blr-pane w-80 shrink-0 border-s border-default"
        >
          <div class="space-y-4 p-4">
            <div class="flex items-start gap-2">
              <div class="min-w-0 flex-1">
                <p class="blr-field">Selected context</p>
                <p class="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-semibold tracking-tight text-highlighted">
                  <BlrKind kind="interface" :labelled="false" size="xs" />
                  {{ activeScope.pair.interfaceTitle }}
                  <template v-if="activeScope.pair.experienceTitle">
                    <UIcon name="i-lucide-chevron-right" class="size-3.5 text-dimmed" />
                    <BlrKind kind="experience" :labelled="false" size="xs" />
                    {{ activeScope.pair.experienceTitle }}
                  </template>
                </p>
                <UBadge
                  v-if="activeScope.hostExperience"
                  :color="ACCESS_TONE[activeScope.hostExperience.accessMode] || 'neutral'"
                  variant="subtle"
                  size="sm"
                  class="mt-1"
                >
                  {{ activeScope.hostExperience.accessMode }}
                </UBadge>
              </div>
              <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" title="Back to whole product" @click="contextKey = null" />
            </div>

            <div class="flex flex-wrap gap-1.5">
              <UButton
                v-if="activeScope.hostInterface"
                icon="i-lucide-book-open"
                size="xs"
                color="neutral"
                variant="outline"
                :label="`Open ${activeScope.hostInterface.title}`"
                @click="inspect(activeScope.hostInterface.id)"
              />
              <UButton
                v-if="activeScope.hostExperience"
                icon="i-lucide-book-open"
                size="xs"
                color="neutral"
                variant="outline"
                :label="`Open ${activeScope.hostExperience.title}`"
                @click="inspect(activeScope.hostExperience.id)"
              />
            </div>

            <div v-if="activeScope.boundary" class="space-y-1.5">
              <p class="blr-field">Capability boundary</p>
              <BlrProse :text="activeScope.boundary" />
            </div>

            <BlrAvail :pairs="[]" :entry-points="activeScope.entryPoints" label="Entry points" />

            <div class="space-y-3 border-t border-default pt-3">
              <BlrLinks :workspace="workspace" :ids="activeScope.actorIds" kind="actor" label="Actors who enter" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="activeScope.capabilityIds" kind="capability" label="Capabilities available" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="activeScope.journeyIds" kind="journey" label="Journeys completable" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="activeScope.screenIds" kind="screen" label="Screens here" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="activeScope.ruleIds" kind="rule" label="Rules narrowed here" interactive @select="inspectEntity" />
              <p v-if="!activeScope.ruleIds.length" class="text-sm text-muted italic">
                No Business Rule is narrowed to this context.
              </p>
              <p class="text-sm text-dimmed">
                Lists are derived from declared availability in the model.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <!-- ============ PROMISES: journey browser ============ -->
      <div v-else-if="tab === 'promises'" class="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          v-if="contextKey"
          class="flex shrink-0 flex-wrap items-center gap-2 border-b border-default bg-elevated/40 px-4 py-1.5"
        >
          <UIcon name="i-lucide-funnel" class="size-3.5 text-dimmed" />
          <span class="text-sm text-muted">
            Scoped to <span class="font-medium text-highlighted">{{ keyLabel(contextKey) }}</span>
            — {{ scopedJourneys.length }} of {{ workspace.journeys.length }} Journeys declare availability there.
          </span>
          <UButton size="xs" color="neutral" variant="ghost" label="Whole product" @click="contextKey = null" />
          <UButton size="xs" color="neutral" variant="ghost" label="View on Surface" @click="tab = 'surface'" />
        </div>

        <!-- Journey detail: the complete promise -->
        <div v-if="openJourney" class="blr-pane flex-1">
          <div class="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
            <div class="flex flex-wrap items-center gap-2">
              <UButton icon="i-lucide-arrow-left" size="xs" color="neutral" variant="ghost" label="All Journeys" @click="openJourneyId = null" />
              <span class="ms-auto flex gap-1.5">
                <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="outline" label="Full record" @click="inspect(openJourney.id)" />
                <UButton icon="i-lucide-waypoints" size="xs" color="neutral" variant="outline" label="Topology" @click="openTopology(openJourney.id)" />
              </span>
            </div>

            <header class="space-y-2">
              <BlrKind kind="journey" />
              <h2 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">{{ openJourney.title }}</h2>
              <BlrProse :text="openJourney.lead" size="base" />
            </header>

            <section class="space-y-1.5 rounded-xl border border-default bg-default p-4">
              <p class="blr-field">Available in — click to scope the Surface</p>
              <div class="flex flex-wrap gap-1.5">
                <UButton
                  v-for="pair in openJourney.availability"
                  :key="pair.key"
                  icon="i-lucide-door-open"
                  size="xs"
                  color="neutral"
                  variant="outline"
                  class="rounded-full"
                  :label="pairLabel(pair)"
                  @click="goToContext(pair.key)"
                />
              </div>
              <BlrAvail :pairs="[]" :entry-points="openJourney.entryPoints" label="" />
            </section>

            <section v-if="openJourney.intent" class="space-y-1.5">
              <p class="blr-field">Intent</p>
              <BlrProse :text="openJourney.intent" />
            </section>

            <section class="space-y-2 border-t border-default pt-4">
              <BlrLinks :workspace="workspace" :ids="openJourney.actorIds" kind="actor" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="openJourney.capabilityIds" kind="capability" label="Uses Capabilities" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="openJourney.domainIds" kind="domain" label="Domains (derived)" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="openJourney.screenIds" kind="screen" label="Passes through Screens" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="openJourney.ruleIds" kind="rule" label="Constrained by" interactive @select="inspectEntity" />
            </section>

            <section class="space-y-4">
              <h3 class="border-b border-default pb-2 text-base font-semibold tracking-tight text-highlighted">
                Scenarios <span class="blr-meta ms-1">{{ openJourneyScenarios.length }}</span>
              </h3>
              <p v-if="!openJourneyScenarios.length" class="text-sm text-muted italic">
                No Scenarios authored for this Journey.
              </p>
              <article
                v-for="(scenario, scenarioIndex) in openJourneyScenarios"
                :key="scenario.id"
                class="space-y-4 rounded-xl border border-default bg-default p-4"
              >
                <header class="flex flex-wrap items-center gap-2">
                  <span class="blr-meta">{{ scenarioIndex + 1 }}</span>
                  <BlrKind kind="scenario" :labelled="false" />
                  <span class="text-base font-semibold tracking-tight text-highlighted">{{ scenario.title }}</span>
                  <UBadge color="neutral" variant="subtle" size="sm">{{ scenario.kindName }}</UBadge>
                  <span class="ms-auto flex items-center gap-1.5">
                    <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="ghost" title="Open the full Scenario record" @click="inspect(scenario.id)" />
                  </span>
                </header>

                <div class="flex flex-wrap items-center gap-1.5">
                  <template v-if="scenario.availability.length">
                    <UButton
                      v-for="pair in scenario.availability"
                      :key="pair.key"
                      size="xs"
                      color="neutral"
                      variant="outline"
                      class="rounded-full"
                      :label="pairLabel(pair)"
                      @click="goToContext(pair.key)"
                    />
                  </template>
                  <span v-else class="text-sm text-muted italic">Applies to every context its Journey declares.</span>
                </div>

                <div class="space-y-1.5">
                  <p class="blr-field">Trigger</p>
                  <BlrProse :text="scenario.trigger" />
                </div>

                <div class="space-y-1.5">
                  <p class="blr-field">Steps · {{ scenario.steps.length }}</p>
                  <ol class="space-y-1.5 border-s-2 border-accented ps-4">
                    <li v-for="(step, stepIndex) in scenario.steps" :key="stepIndex" class="flex gap-3 text-sm leading-6">
                      <span class="blr-meta w-5 shrink-0 pt-0.5 text-end">{{ stepIndex + 1 }}</span>
                      <span class="text-default">{{ step }}</span>
                    </li>
                  </ol>
                </div>

                <div v-if="scenario.decisionPoints.length" class="space-y-2">
                  <p class="blr-field">Decision points · {{ scenario.decisionPoints.length }}</p>
                  <div
                    v-for="(point, pointIndex) in scenario.decisionPoints"
                    :key="pointIndex"
                    class="rounded-lg border border-dashed border-default p-3"
                  >
                    <p class="text-sm font-medium text-highlighted">{{ point.title }}</p>
                    <BlrProse :text="point.question" class="mt-1" />
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
                </div>

                <div class="space-y-1.5">
                  <p class="blr-field">Outcome</p>
                  <BlrProse :text="scenario.outcome" />
                </div>

                <div v-if="scenario.edgeCases.length" class="space-y-1.5">
                  <p class="blr-field">Edge cases · {{ scenario.edgeCases.length }}</p>
                  <ul class="list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed">
                    <li v-for="(edge, edgeIndex) in scenario.edgeCases" :key="edgeIndex">{{ edge }}</li>
                  </ul>
                </div>

                <div class="space-y-1.5 border-t border-muted pt-3">
                  <BlrLinks :workspace="workspace" :ids="scenario.screenIds" kind="screen" label="Served by" interactive @select="inspectEntity" />
                  <BlrLinks :workspace="workspace" :ids="scenario.ruleIds" kind="rule" label="Constrained by" interactive @select="inspectEntity" />
                </div>
              </article>
            </section>
          </div>
        </div>

        <!-- Journey browser: cards ⇄ table -->
        <template v-else>
          <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-default px-4 py-2">
            <h3 class="text-base font-semibold tracking-tight text-highlighted">
              Journeys <span class="blr-meta ms-1">{{ scopedJourneys.length }}</span>
            </h3>
            <UTabs
              v-model="journeyView"
              :items="[
                { value: 'cards', label: 'Cards', icon: 'i-lucide-layout-grid' },
                { value: 'table', label: 'Table', icon: 'i-lucide-table' }
              ]"
              :content="false"
              color="neutral"
              size="xs"
              class="ms-auto"
            />
          </div>
          <div class="blr-pane flex-1">
            <p v-if="!scopedJourneys.length" class="p-6 text-sm text-muted italic">
              No Journeys declare availability in this context.
            </p>

            <div v-else-if="journeyView === 'cards'" class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              <button
                v-for="journey in scopedJourneys"
                :key="journey.id"
                type="button"
                class="flex flex-col gap-2.5 rounded-xl border border-default bg-default p-4 text-start transition hover:border-accented"
                @click="openJourneyId = journey.id"
              >
                <span class="flex items-center gap-2">
                  <BlrKind kind="journey" :labelled="false" />
                  <span class="min-w-0 flex-1 truncate text-start text-base font-semibold tracking-tight text-highlighted">{{ journey.title }}</span>
                  <span class="blr-meta shrink-0">{{ journey.stepCount }} steps</span>
                </span>
                <span class="line-clamp-3 text-start text-sm leading-6 text-muted">{{ firstSentence(journey.lead, 220) }}</span>
                <span class="flex flex-wrap gap-1">
                  <UBadge v-for="pair in journey.availability" :key="pair.key" color="neutral" variant="outline" size="sm">{{ pairLabel(pair) }}</UBadge>
                </span>
                <span class="space-y-1 text-start">
                  <BlrLinks :workspace="workspace" :ids="journey.actorIds" kind="actor" />
                  <BlrLinks :workspace="workspace" :ids="journey.capabilityIds" kind="capability" :max="3" />
                  <BlrLinks :workspace="workspace" :ids="journey.screenIds" kind="screen" :max="3" />
                  <BlrLinks :workspace="workspace" :ids="journey.ruleIds" kind="rule" :max="2" />
                </span>
                <span class="mt-auto border-t border-default pt-2 text-start text-sm text-dimmed">
                  <span class="font-medium text-muted">{{ journey.scenarioIds.length }} scenarios</span>
                  <template v-if="journey.scenarioIds.length"> — {{ scenarioNames(journey) }}</template>
                </span>
              </button>
            </div>

            <div v-else class="p-4">
              <UTable
                :data="scopedJourneys"
                :columns="journeyColumns"
                class="rounded-xl border border-default bg-default"
                :ui="{ tr: 'cursor-pointer' }"
                :on-select="(_event: Event, row: any) => { openJourneyId = row.original.id }"
              />
              <p class="pt-2 text-sm text-muted">
                Counts are derived from the model; hover a count for the names behind it. Click a row for the full Journey.
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- ============ ABILITIES: capability map + named matrices ============ -->
      <div v-else-if="tab === 'abilities'" class="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          v-if="contextKey"
          class="flex shrink-0 flex-wrap items-center gap-2 border-b border-default bg-elevated/40 px-4 py-1.5"
        >
          <UIcon name="i-lucide-funnel" class="size-3.5 text-dimmed" />
          <span class="text-sm text-muted">
            Scoped to <span class="font-medium text-highlighted">{{ keyLabel(contextKey) }}</span>
            — {{ scopedCapabilities.length }} of {{ workspace.capabilities.length }} Capabilities. Matrices stay whole-product; the scoped column is tinted.
          </span>
          <UButton size="xs" color="neutral" variant="ghost" label="Whole product" @click="contextKey = null" />
          <UButton size="xs" color="neutral" variant="ghost" label="View on Surface" @click="tab = 'surface'" />
        </div>

        <div class="blr-pane flex-1">
          <div class="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
            <!-- Capability map grouped by Domain -->
            <section class="space-y-5">
              <h3 class="border-b border-default pb-2 text-base font-semibold tracking-tight text-highlighted">Capabilities by Domain</h3>
              <div v-for="group in domainGroups" :key="group.id || 'no-domain'" class="space-y-2">
                <div class="flex flex-wrap items-baseline gap-2">
                  <template v-if="group.domain">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-highlighted hover:text-primary"
                      @click="inspect(group.domain.id)"
                    >
                      <BlrKind kind="domain" :labelled="false" size="xs" />
                      {{ group.domain.title }}
                    </button>
                    <span class="min-w-0 flex-1 truncate text-sm text-muted">{{ firstSentence(group.domain.lead) }}</span>
                  </template>
                  <span v-else class="text-base font-semibold tracking-tight text-highlighted">Without a Domain</span>
                </div>
                <p v-if="!group.capabilities.length" class="text-sm text-muted italic">
                  No Capability of this Domain is available in the selected context.
                </p>
                <div class="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                  <button
                    v-for="capability in group.capabilities"
                    :key="capability.id"
                    type="button"
                    class="flex flex-col gap-2 rounded-xl border border-default bg-default p-4 text-start transition hover:border-accented"
                    @click="inspect(capability.id)"
                  >
                    <span class="flex items-center gap-2">
                      <BlrKind kind="capability" :labelled="false" />
                      <span class="min-w-0 flex-1 truncate text-start text-base font-semibold tracking-tight text-highlighted">{{ capability.title }}</span>
                    </span>
                    <span class="line-clamp-2 text-start text-sm leading-6 text-muted">{{ firstSentence(capability.lead, 180) }}</span>
                    <span class="flex flex-wrap gap-1">
                      <UBadge v-for="pair in capability.availability" :key="pair.key" color="neutral" variant="outline" size="sm">{{ pairLabel(pair) }}</UBadge>
                    </span>
                    <span class="blr-meta" title="Derived: backlinks resolved from the model">
                      {{ capability.journeyIds.length }} journeys · {{ capability.screenIds.length }} screens · {{ capability.ruleIds.length }} rules
                    </span>
                  </button>
                </div>
              </div>
            </section>

            <!-- Named matrix 1: the signature availability matrix -->
            <section class="space-y-2">
              <header>
                <p class="blr-field">Matrix · Capabilities × Access contexts</p>
                <h3 class="mt-0.5 text-lg font-semibold tracking-tight text-highlighted">Where can each Capability be reached?</h3>
              </header>
              <p class="text-sm text-muted">
                A filled cell is a declared availability; click any cell for the facts behind it.
              </p>
              <div class="overflow-x-auto rounded-xl border border-default bg-default p-3.5">
                <table class="gw-matrix">
                  <thead>
                    <tr>
                      <th class="text-start"><span class="blr-field">Capability</span></th>
                      <th v-for="pair in workspace.pairs" :key="pair.key">
                        <button type="button" class="gw-colhead" :title="`Scope the Surface to ${pairLabel(pair)}`" @click="goToContext(pair.key)">
                          {{ pairLabel(pair) }}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="capability in workspace.capabilities" :key="capability.id">
                      <th>
                        <button type="button" :title="capability.title" @click="inspect(capability.id)">{{ capability.title }}</button>
                      </th>
                      <td
                        v-for="pair in workspace.pairs"
                        :key="pair.key"
                        :class="{ 'is-context': pair.key === contextKey }"
                      >
                        <button
                          type="button"
                          class="gw-cell"
                          :class="{ 'is-on': inContext(capability, pair.key), 'is-picked': cellPicked('reach', capability.id, pair.key) }"
                          :style="inContext(capability, pair.key) ? { background: reachCellColor } : undefined"
                          :title="`${capability.title} — ${pairLabel(pair)}${inContext(capability, pair.key) ? ' · available' : ' · not declared'}`"
                          @click="explainCell('reach', capability.id, pair.key)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Named matrix 2 -->
            <section class="space-y-2">
              <header>
                <p class="blr-field">Matrix · Capabilities × Journeys</p>
                <h3 class="mt-0.5 text-lg font-semibold tracking-tight text-highlighted">Which promises depend on each Capability?</h3>
              </header>
              <p class="text-sm text-muted">
                A filled cell means the Journey lists the Capability among what it uses.
              </p>
              <div class="overflow-x-auto rounded-xl border border-default bg-default p-3.5">
                <table class="gw-matrix">
                  <thead>
                    <tr>
                      <th class="text-start"><span class="blr-field">Capability</span></th>
                      <th v-for="journey in workspace.journeys" :key="journey.id">
                        <button type="button" class="gw-colhead" :title="`Open ${journey.title}`" @click="inspect(journey.id)">
                          {{ journey.title }}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="capability in workspace.capabilities" :key="capability.id">
                      <th>
                        <button type="button" :title="capability.title" @click="inspect(capability.id)">{{ capability.title }}</button>
                      </th>
                      <td v-for="journey in workspace.journeys" :key="journey.id">
                        <button
                          type="button"
                          class="gw-cell"
                          :class="{ 'is-on': journey.capabilityIds.includes(capability.id), 'is-picked': cellPicked('depends', capability.id, journey.id) }"
                          :style="journey.capabilityIds.includes(capability.id) ? { background: dependsCellColor } : undefined"
                          :title="`${journey.title} ${journey.capabilityIds.includes(capability.id) ? 'uses' : 'does not use'} ${capability.title}`"
                          @click="explainCell('depends', capability.id, journey.id)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Cell explanation strip -->
            <div v-if="matrixDetail" class="flex items-start gap-3 rounded-xl border border-default bg-default px-4 py-3">
              <UIcon name="i-lucide-corner-down-right" class="mt-1 size-4 shrink-0 text-dimmed" />
              <div class="min-w-0 flex-1 space-y-2">
                <p class="text-sm leading-6 text-default">
                  <button type="button" class="gw-inline" @click="inspect(matrixDetail.capability.id)">{{ matrixDetail.capability.title }}</button>
                  <template v-if="matrixDetail.matrix === 'reach' && matrixDetail.pair">
                    {{ matrixDetail.on ? ' is declared available in ' : ' is not declared available in ' }}
                    <button type="button" class="gw-inline" @click="goToContext(matrixDetail.pair.key)">{{ pairLabel(matrixDetail.pair) }}</button>.
                  </template>
                  <template v-else-if="matrixDetail.journey">
                    {{ matrixDetail.on ? ' is used by ' : ' is not used by ' }}
                    <button type="button" class="gw-inline" @click="inspect(matrixDetail.journey.id)">{{ matrixDetail.journey.title }}</button>.
                  </template>
                </p>
                <BlrLinks
                  v-if="matrixDetail.on && matrixDetail.screenIds.length"
                  :workspace="workspace"
                  :ids="matrixDetail.screenIds"
                  kind="screen"
                  :label="matrixDetail.matrix === 'reach' ? 'Screens exposing it there' : 'Screens they share'"
                  interactive
                  @select="inspectEntity"
                />
                <p v-else-if="matrixDetail.on && matrixDetail.matrix === 'reach'" class="text-sm text-muted">
                  No mapped Screen exposes it in this context.
                </p>
              </div>
              <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" @click="matrixExplain = null" />
            </div>
          </div>
        </div>
      </div>

      <!-- ============ CONSTRAINTS: rule impact ============ -->
      <div v-else-if="tab === 'constraints'" class="flex min-h-0 min-w-0 flex-1">
        <nav class="blr-pane w-72 shrink-0 border-e border-default">
          <div class="space-y-1.5 p-3">
            <p class="blr-field pb-1">Business rules <span class="blr-meta">{{ workspace.rules.length }}</span></p>
            <button
              v-for="rule in workspace.rules"
              :key="rule.id"
              type="button"
              class="w-full rounded-xl border bg-default p-3 text-start transition"
              :class="selectedRule?.id === rule.id ? 'border-primary bg-primary/5' : 'border-default hover:border-accented hover:bg-elevated/40'"
              @click="selectedRuleId = rule.id"
            >
              <span class="flex items-center gap-2">
                <BlrKind kind="rule" :labelled="false" size="xs" />
                <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ rule.title }}</span>
              </span>
              <span class="blr-meta mt-1 block">
                <template v-if="rule.availability.length">narrowed · </template>{{ rule.domainIds.length + rule.capabilityIds.length + rule.journeyIds.length + rule.scenarioIds.length }} direct attachments
              </span>
            </button>
            <p v-if="!workspace.rules.length" class="text-sm text-muted italic">
              No Business Rules authored in this model.
            </p>
          </div>
        </nav>

        <div class="blr-pane min-w-0 flex-1">
          <div v-if="selectedRule && ruleImpact" class="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
            <div class="flex flex-wrap items-center gap-2">
              <BlrKind kind="rule" />
              <span class="ms-auto flex gap-1.5">
                <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="outline" label="Full record" @click="inspect(selectedRule.id)" />
                <UButton icon="i-lucide-waypoints" size="xs" color="neutral" variant="outline" label="Topology" @click="openTopology(selectedRule.id)" />
              </span>
            </div>
            <h2 class="text-xl font-semibold tracking-tight text-highlighted">{{ selectedRule.title }}</h2>

            <section class="rounded-lg border-s-2 border-primary bg-default p-3.5">
              <BlrProse :text="selectedRule.statement" />
            </section>

            <section v-if="selectedRule.rationale" class="space-y-1.5">
              <p class="blr-field">Rationale</p>
              <BlrProse :text="selectedRule.rationale" />
            </section>

            <section class="space-y-1.5">
              <p class="blr-field">Narrowed availability</p>
              <div v-if="selectedRule.availability.length" class="flex flex-wrap gap-1.5">
                <UButton
                  v-for="pair in selectedRule.availability"
                  :key="pair.key"
                  icon="i-lucide-door-open"
                  size="xs"
                  color="neutral"
                  variant="outline"
                  class="rounded-full"
                  :label="pairLabel(pair)"
                  :title="`Scope the Surface to ${pairLabel(pair)}`"
                  @click="goToContext(pair.key)"
                />
              </div>
              <p v-else class="text-sm text-muted italic">
                Not narrowed to specific Interface availability scopes.
              </p>
            </section>

            <section class="space-y-2.5 rounded-xl border border-default bg-default p-4">
              <p class="blr-field">Directly constrains — authored on the Rule</p>
              <BlrLinks :workspace="workspace" :ids="selectedRule.domainIds" kind="domain" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="selectedRule.capabilityIds" kind="capability" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="selectedRule.journeyIds" kind="journey" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="selectedRule.scenarioIds" kind="scenario" interactive @select="inspectEntity" />
              <p v-if="!ruleImpact.directTotal" class="text-sm text-muted italic">
                This Rule names no Domain, Capability, Journey, or Scenario directly.
              </p>
            </section>

            <section class="space-y-2.5 rounded-xl border border-dashed border-accented p-4">
              <p class="blr-field">Derived impact — computed from the model</p>
              <BlrLinks :workspace="workspace" :ids="ruleImpact.derivedDomainIds" kind="domain" label="Domains, via constrained Capabilities" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="ruleImpact.derivedCapabilityIds" kind="capability" label="Capabilities, via constrained Domains" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="ruleImpact.derivedJourneyIds" kind="journey" label="Journeys, via Capabilities and Scenarios" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="ruleImpact.derivedScreenIds" kind="screen" label="Screens, via Capabilities and Scenarios" interactive @select="inspectEntity" />
              <p v-if="!ruleImpact.derivedTotal" class="text-sm text-muted italic">
                No reach beyond the direct attachments.
              </p>
            </section>
          </div>
          <p v-else class="p-6 text-sm text-muted italic">
            No Business Rules authored in this model.
          </p>
        </div>
      </div>

      <!-- ============ ABOUT: identity, coverage, references ============ -->
      <div v-else class="blr-pane min-w-0 flex-1">
        <div class="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
          <header class="space-y-2">
            <img v-if="logoSrc" :src="logoSrc" alt="" class="size-10 rounded">
            <h2 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">{{ workspace.identity.title }}</h2>
            <p class="text-base leading-7 text-default">{{ workspace.identity.summary }}</p>
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge v-if="workspace.identity.categoryLabel" color="primary" variant="subtle" size="sm">{{ workspace.identity.categoryLabel }}</UBadge>
              <UBadge v-for="tag in workspace.identity.tags" :key="tag" color="neutral" variant="subtle" size="sm">{{ tag }}</UBadge>
              <UBadge v-if="workspace.identity.license" color="neutral" variant="outline" size="sm">{{ workspace.identity.license }}</UBadge>
            </div>
          </header>

          <BlrProse :text="workspace.identity.description" />

          <section v-if="workspace.identity.intent" class="space-y-1.5">
            <p class="blr-field">Intent</p>
            <BlrProse :text="workspace.identity.intent" />
          </section>

          <section v-if="workspace.identity.supportingContent" class="space-y-1.5">
            <p class="blr-field">Supporting context</p>
            <BlrProse :text="workspace.identity.supportingContent" />
          </section>

          <section class="space-y-3 rounded-xl border border-default bg-default p-4 sm:p-5">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base font-semibold tracking-tight text-highlighted">Coverage</h3>
              <UBadge :color="STATUS_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">
                {{ workspace.coverage.status }}
              </UBadge>
            </div>
            <BlrProse v-if="workspace.coverage.rationale" :text="workspace.coverage.rationale" />
            <div v-if="workspace.coverage.method.length" class="space-y-1">
              <p class="blr-field">Method</p>
              <ul class="list-disc space-y-0.5 ps-5 text-sm text-muted marker:text-dimmed">
                <li v-for="(item, index) in workspace.coverage.method" :key="index">{{ item }}</li>
              </ul>
            </div>
            <div v-if="workspace.coverage.sourceAreas.length" class="space-y-1.5">
              <p class="blr-field">Source areas</p>
              <div class="flex flex-wrap gap-1.5">
                <UBadge v-for="(item, index) in workspace.coverage.sourceAreas" :key="index" color="neutral" variant="soft" size="sm" class="font-mono">{{ item }}</UBadge>
              </div>
            </div>
            <div v-if="workspace.coverage.unmapped.length" class="space-y-1">
              <p class="blr-field">Unmapped</p>
              <ul class="list-disc space-y-0.5 ps-5 text-sm text-muted marker:text-dimmed">
                <li v-for="(item, index) in workspace.coverage.unmapped" :key="index">{{ item }}</li>
              </ul>
            </div>
            <div v-if="workspace.coverage.limitations.length" class="space-y-1">
              <p class="blr-field">Coverage limitations</p>
              <ul class="list-disc space-y-0.5 ps-5 text-sm text-muted marker:text-dimmed">
                <li v-for="(item, index) in workspace.coverage.limitations" :key="index">{{ item }}</li>
              </ul>
            </div>
            <div v-if="workspace.identity.limitations.length" class="space-y-1">
              <p class="blr-field">Report limitations</p>
              <ul class="list-disc space-y-0.5 ps-5 text-sm text-muted marker:text-dimmed">
                <li v-for="(item, index) in workspace.identity.limitations" :key="index">{{ item }}</li>
              </ul>
            </div>
          </section>

          <section class="space-y-2.5">
            <h3 class="text-base font-semibold tracking-tight text-highlighted">Counted from the model</h3>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <div v-for="entry in countEntries" :key="entry.label" class="rounded-xl border border-default bg-default p-3.5">
                <p class="font-mono text-lg text-highlighted tabular-nums">{{ entry.value }}</p>
                <p class="blr-field">{{ entry.label }}</p>
              </div>
            </div>
          </section>

          <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />

          <section v-if="workspace.references.length" class="space-y-2">
            <h3 class="text-base font-semibold tracking-tight text-highlighted">
              Every reference in the model <span class="blr-meta ms-1">{{ workspace.references.length }}</span>
            </h3>
            <ul class="space-y-1">
              <li
                v-for="(group, index) in workspace.references"
                :key="`${group.ownerId}-${group.reference.target}-${index}`"
                class="flex min-w-0 items-center gap-2 text-sm"
              >
                <BlrKind :kind="group.ownerKind" :labelled="false" size="xs" />
                <button
                  v-if="group.ownerKind !== 'product'"
                  type="button"
                  class="gw-inline shrink-0"
                  @click="inspect(group.ownerId)"
                >
                  {{ group.ownerTitle }}
                </button>
                <span v-else class="shrink-0 font-medium text-default">{{ group.ownerTitle }}</span>
                <span class="blr-meta truncate">{{ group.reference.title || group.reference.target }}</span>
                <UBadge color="neutral" variant="subtle" size="sm" class="ms-auto shrink-0">{{ group.reference.role }}</UBadge>
              </li>
            </ul>
          </section>

          <footer class="blr-meta space-y-1 border-t border-default pt-4 leading-relaxed">
            <p v-for="author in workspace.identity.authors" :key="author.name">
              Author —
              <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">{{ author.name }}</a>
              <template v-else>{{ author.name }}</template>
            </p>
            <p>Generated {{ workspace.identity.generatedAt }} by {{ workspace.identity.generator.name }} v{{ workspace.identity.generator.version }}</p>
            <p>Schema {{ workspace.identity.schemaVersion }} · {{ workspace.identity.referenceProfile }} reference profile</p>
          </footer>
        </div>
      </div>

      <!-- Inspector: the shared slideover every selection lands in -->
      <BlrInspector
        v-model:tab="inspectorMode"
        :workspace="workspace"
        :entity="inspectorEntity"
        @select="inspectEntity"
        @close="closeInspector"
      />
    </div>
  </div>
</template>

<style scoped>
/* Rail entries: solid structure line for Interface-level scopes, dashed for
   Experience floors — echoing the Screen map's containment vocabulary. */
.gw-context {
  display: block;
  width: 100%;
  padding: 0.4rem 0.55rem;
  border: 1px solid transparent;
  border-start-start-radius: 0;
  border-end-start-radius: 0;
  border-start-end-radius: 8px;
  border-end-end-radius: 8px;
  text-align: start;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.gw-context--direct {
  border-inline-start: 3px solid color-mix(in srgb, var(--ui-text-dimmed) 40%, transparent);
}

.gw-context--nested {
  margin-inline-start: 0.85rem;
  border-inline-start: 2px dashed color-mix(in srgb, var(--ui-text-dimmed) 40%, transparent);
}

.gw-context:hover {
  background: var(--ui-bg-elevated);
}

.gw-context.is-active {
  background: color-mix(in srgb, var(--ui-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--ui-primary) 35%, transparent);
  border-inline-start-color: var(--ui-primary);
}

/* Entity names woven into running sentences. */
.gw-inline {
  font-weight: 500;
  color: var(--ui-text-highlighted);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--ui-text-dimmed) 45%, transparent);
  text-underline-offset: 2px;
}

.gw-inline:hover {
  color: var(--ui-primary);
}

/* Matrices: row heads truncate, column heads run vertical, cells stay square. */
.gw-matrix {
  border-collapse: collapse;
}

.gw-matrix thead th {
  padding: 0.3rem 0.25rem 0.5rem;
  border-bottom: 1px solid var(--ui-border);
  vertical-align: bottom;
}

.gw-colhead {
  max-height: 9rem;
  overflow: hidden;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ui-text-toned);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.gw-colhead:hover {
  color: var(--ui-primary);
}

.gw-matrix tbody th {
  max-width: 15rem;
  padding: 0.25rem 0.75rem 0.25rem 0;
  border-bottom: 1px solid var(--ui-border-muted);
  font-size: 0.75rem;
  font-weight: 500;
  text-align: start;
  color: var(--ui-text-toned);
}

.gw-matrix tbody th button {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gw-matrix tbody th button:hover {
  color: var(--ui-primary);
}

.gw-matrix td {
  padding: 0.25rem;
  border-bottom: 1px solid var(--ui-border-muted);
  text-align: center;
}

.gw-matrix td.is-context {
  background: color-mix(in srgb, var(--ui-primary) 7%, transparent);
}

.gw-cell {
  width: 1.35rem;
  height: 1.35rem;
  border: 1px dashed var(--ui-border);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.gw-cell.is-on {
  border-style: solid;
  border-color: transparent;
}

.gw-cell:hover {
  border-color: var(--ui-primary);
}

.gw-cell.is-picked {
  outline: 2px solid var(--ui-primary);
  outline-offset: 1px;
}
</style>
