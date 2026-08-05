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
 * coverage, references). Any entity opens the docked inspector: full
 * BlrEntityDetail with a "Map" toggle to the contextual BlrTopology.
 */
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

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

type TabId = 'surface' | 'promises' | 'abilities' | 'constraints' | 'about'

const TABS: Array<{ id: TabId, label: string, icon: string }> = [
  { id: 'surface', label: 'Surface', icon: 'i-lucide-door-open' },
  { id: 'promises', label: 'Promises', icon: 'i-lucide-route' },
  { id: 'abilities', label: 'Abilities', icon: 'i-lucide-zap' },
  { id: 'constraints', label: 'Constraints', icon: 'i-lucide-scale' },
  { id: 'about', label: 'About', icon: 'i-lucide-info' }
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
  <div class="gw-root flex h-full min-h-0 flex-col">
    <!-- Identity strip + tab bar -->
    <header class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-default px-4 py-2">
      <img v-if="logoSrc" :src="logoSrc" alt="" class="size-6 shrink-0 rounded">
      <UIcon v-else name="i-lucide-door-open" class="size-5 shrink-0 text-primary" />
      <div class="min-w-0">
        <p class="truncate text-sm leading-tight font-semibold text-highlighted">{{ workspace.identity.title }}</p>
        <p class="hidden max-w-xl truncate text-[11px] leading-tight text-dimmed sm:block">{{ workspace.identity.summary }}</p>
      </div>
      <nav class="ms-auto flex flex-wrap items-center gap-1">
        <button
          v-for="item in TABS"
          :key="item.id"
          type="button"
          class="gw-tab"
          :class="{ 'is-active': tab === item.id }"
          @click="tab = item.id"
        >
          <UIcon :name="item.icon" class="size-3.5" />
          {{ item.label }}
        </button>
      </nav>
    </header>

    <div class="relative flex min-h-0 flex-1">
      <!-- ============ SURFACE: the front door ============ -->
      <div v-if="tab === 'surface'" class="flex min-h-0 min-w-0 flex-1">
        <!-- Context switcher rail -->
        <nav class="blr-pane w-64 shrink-0 border-e border-default">
          <div class="space-y-1 p-3">
            <div class="flex items-center justify-between gap-2">
              <p class="gw-label">Access contexts</p>
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
                <span class="truncate text-xs font-medium text-highlighted">Whole product</span>
              </span>
              <span class="gw-counts" title="Counts from the model">
                {{ workspace.counts.screens }} scr · {{ workspace.counts.capabilities }} cap · {{ workspace.counts.journeys }} jny
              </span>
            </button>

            <div v-for="group in railGroups" :key="group.iface.id" class="pt-2">
              <button
                v-if="group.direct"
                type="button"
                class="gw-context gw-context--direct"
                :class="{ 'is-active': contextKey === group.direct.key && !compareOn }"
                @click="pickContext(group.direct.key)"
              >
                <span class="flex items-center gap-1.5">
                  <BlrKind kind="interface" :labelled="false" size="xs" />
                  <span class="truncate text-xs font-medium text-highlighted">{{ group.iface.title }}</span>
                  <span class="text-[10px] text-dimmed">direct</span>
                  <span v-if="compareOn && compareA === group.direct.key" class="gw-slot">A</span>
                  <span v-if="compareOn && compareB === group.direct.key" class="gw-slot">B</span>
                </span>
                <span class="gw-counts" title="Derived: entities declaring availability here">
                  {{ countsFor(group.direct.key).screens }} scr · {{ countsFor(group.direct.key).capabilities }} cap · {{ countsFor(group.direct.key).journeys }} jny
                </span>
              </button>
              <p v-else class="flex items-center gap-1.5 px-2 py-1">
                <BlrKind kind="interface" :labelled="false" size="xs" />
                <span class="truncate text-xs font-medium text-toned">{{ group.iface.title }}</span>
              </p>

              <button
                v-for="entry in group.experiences"
                :key="entry.pair.key"
                type="button"
                class="gw-context gw-context--nested"
                :class="{ 'is-active': contextKey === entry.pair.key && !compareOn }"
                @click="pickContext(entry.pair.key)"
              >
                <span class="flex items-center gap-1.5">
                  <BlrKind kind="experience" :labelled="false" size="xs" />
                  <span class="truncate text-xs font-medium text-highlighted">{{ entry.pair.experienceTitle }}</span>
                  <UBadge
                    v-if="entry.experience"
                    :color="ACCESS_TONE[entry.experience.accessMode] || 'neutral'"
                    variant="subtle"
                    size="sm"
                    class="text-[9px]"
                  >
                    {{ entry.experience.accessMode }}
                  </UBadge>
                  <span v-if="compareOn && compareA === entry.pair.key" class="gw-slot">A</span>
                  <span v-if="compareOn && compareB === entry.pair.key" class="gw-slot">B</span>
                </span>
                <span class="gw-counts" title="Derived: entities declaring availability here">
                  {{ countsFor(entry.pair.key).screens }} scr · {{ countsFor(entry.pair.key).capabilities }} cap · {{ countsFor(entry.pair.key).journeys }} jny
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
                class="gw-actor"
                @click="inspect(actor.id)"
              >
                <span class="flex items-center gap-1.5">
                  <BlrKind kind="actor" :labelled="false" size="xs" />
                  <span class="truncate text-xs font-medium text-highlighted">{{ actor.title }}</span>
                  <UBadge color="neutral" variant="subtle" size="sm" class="text-[9px]">
                    {{ actor.actorKind }} · {{ actor.relationship }}
                  </UBadge>
                </span>
                <span class="mt-0.5 flex items-baseline gap-1 text-[11px] text-dimmed">
                  <UIcon name="i-lucide-arrow-right" class="size-3 shrink-0 self-center" />
                  <span class="truncate">enters {{ actorEntryLabel(actor) }}</span>
                </span>
              </button>
              <p v-if="!workspace.actors.length" class="self-center text-xs text-dimmed italic">
                No Actors authored in this model.
              </p>
            </div>
          </div>

          <div class="relative min-h-0 flex-1">
            <!-- Compare delta replaces the map when both contexts are chosen -->
            <div v-if="compareData" class="blr-pane h-full">
              <div class="space-y-4 p-4">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="gw-label">Context comparison</p>
                  <span class="gw-chip"><span class="gw-slot">A</span>{{ pairLabel(compareData.pairA) }}</span>
                  <span class="text-xs text-dimmed">vs</span>
                  <span class="gw-chip"><span class="gw-slot">B</span>{{ pairLabel(compareData.pairB) }}</span>
                  <span class="ms-auto text-[11px] text-dimmed">Set membership by declared availability — nothing is ranked.</span>
                  <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" label="Exit compare" @click="toggleCompare" />
                </div>
                <div class="grid gap-3 lg:grid-cols-3">
                  <section
                    v-for="column in compareColumns"
                    :key="column.id"
                    class="space-y-3 rounded-xl border border-default p-3"
                  >
                    <h4 class="flex items-baseline gap-2 text-xs font-medium text-highlighted">
                      {{ column.title }}
                      <span class="font-mono text-[10px] text-dimmed">{{ compareColumnCount(column.field) }}</span>
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
                    <p v-if="!compareColumnCount(column.field)" class="text-xs text-dimmed italic">
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
                class="absolute top-2 left-1/2 -translate-x-1/2 rounded-full border border-default bg-elevated/90 px-3 py-1 text-xs text-toned shadow-sm"
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
                <p class="gw-label">Selected context</p>
                <p class="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-medium text-highlighted">
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
              <p class="gw-label">Capability boundary</p>
              <BlrProse :text="activeScope.boundary" />
            </div>

            <BlrAvail :pairs="[]" :entry-points="activeScope.entryPoints" label="Entry points" />

            <div class="space-y-3 border-t border-default pt-3">
              <BlrLinks :workspace="workspace" :ids="activeScope.actorIds" kind="actor" label="Actors who enter" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="activeScope.capabilityIds" kind="capability" label="Capabilities available" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="activeScope.journeyIds" kind="journey" label="Journeys completable" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="activeScope.screenIds" kind="screen" label="Screens here" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="activeScope.ruleIds" kind="rule" label="Rules narrowed here" interactive @select="inspectEntity" />
              <p v-if="!activeScope.ruleIds.length" class="text-xs text-dimmed italic">
                No Business Rule is narrowed to this context.
              </p>
              <p class="text-[10px] text-dimmed">
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
          class="flex shrink-0 flex-wrap items-center gap-2 border-b border-default bg-elevated/40 px-4 py-1.5 text-xs"
        >
          <UIcon name="i-lucide-funnel" class="size-3.5 text-dimmed" />
          <span class="text-toned">
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
              <h2 class="text-2xl tracking-tight text-highlighted">{{ openJourney.title }}</h2>
              <BlrProse :text="openJourney.lead" />
            </header>

            <section class="space-y-1.5 rounded-xl border border-default bg-elevated/30 p-3">
              <p class="gw-label">Available in — click to scope the Surface</p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="pair in openJourney.availability"
                  :key="pair.key"
                  type="button"
                  class="gw-chip"
                  @click="goToContext(pair.key)"
                >
                  <UIcon name="i-lucide-door-open" class="size-3 text-dimmed" />
                  {{ pairLabel(pair) }}
                </button>
              </div>
              <BlrAvail :pairs="[]" :entry-points="openJourney.entryPoints" label="" />
            </section>

            <section v-if="openJourney.intent" class="space-y-1.5">
              <p class="gw-label">Intent</p>
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
              <h3 class="flex items-baseline gap-2 border-b border-default pb-2 text-sm font-medium text-highlighted">
                Scenarios
                <span class="font-mono text-[11px] text-dimmed">{{ openJourneyScenarios.length }}</span>
              </h3>
              <p v-if="!openJourneyScenarios.length" class="text-sm text-dimmed italic">
                No Scenarios authored for this Journey.
              </p>
              <article
                v-for="(scenario, scenarioIndex) in openJourneyScenarios"
                :key="scenario.id"
                class="gw-scenario space-y-4"
              >
                <header class="flex flex-wrap items-center gap-2">
                  <span class="font-mono text-[11px] text-dimmed tabular-nums">{{ scenarioIndex + 1 }}</span>
                  <BlrKind kind="scenario" :labelled="false" />
                  <span class="text-sm font-medium text-highlighted">{{ scenario.title }}</span>
                  <UBadge color="neutral" variant="subtle" size="sm">{{ scenario.kindName }}</UBadge>
                  <span class="ms-auto flex items-center gap-1.5">
                    <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="ghost" title="Open the full Scenario record" @click="inspect(scenario.id)" />
                  </span>
                </header>

                <div class="flex flex-wrap items-center gap-1.5">
                  <template v-if="scenario.availability.length">
                    <button
                      v-for="pair in scenario.availability"
                      :key="pair.key"
                      type="button"
                      class="gw-chip"
                      @click="goToContext(pair.key)"
                    >
                      {{ pairLabel(pair) }}
                    </button>
                  </template>
                  <span v-else class="text-[11px] text-dimmed italic">Applies to every context its Journey declares.</span>
                </div>

                <div class="space-y-1.5">
                  <p class="gw-label">Trigger</p>
                  <BlrProse :text="scenario.trigger" />
                </div>

                <div class="space-y-1.5">
                  <p class="gw-label">Steps · {{ scenario.steps.length }}</p>
                  <ol class="space-y-1.5 border-s-2 border-accented ps-4">
                    <li v-for="(step, stepIndex) in scenario.steps" :key="stepIndex" class="flex gap-3 text-sm leading-relaxed">
                      <span class="mt-0.5 w-5 shrink-0 text-end font-mono text-[11px] text-dimmed tabular-nums">{{ stepIndex + 1 }}</span>
                      <span class="text-toned">{{ step }}</span>
                    </li>
                  </ol>
                </div>

                <div v-if="scenario.decisionPoints.length" class="space-y-2">
                  <p class="gw-label">Decision points · {{ scenario.decisionPoints.length }}</p>
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
                        <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-toned">{{ branch.condition }}</span>
                        <UIcon name="i-lucide-arrow-right" class="size-3 self-center text-dimmed" />
                        <span class="text-dimmed">{{ branch.outcome }}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div class="space-y-1.5">
                  <p class="gw-label">Outcome</p>
                  <BlrProse :text="scenario.outcome" />
                </div>

                <div v-if="scenario.edgeCases.length" class="space-y-1.5">
                  <p class="gw-label">Edge cases · {{ scenario.edgeCases.length }}</p>
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
          <div class="flex shrink-0 items-center gap-2 border-b border-default px-4 py-2">
            <p class="gw-label">Journeys · {{ scopedJourneys.length }}</p>
            <span class="ms-auto flex gap-1">
              <UButton icon="i-lucide-layout-grid" size="xs" color="neutral" :variant="journeyView === 'cards' ? 'solid' : 'outline'" label="Cards" @click="journeyView = 'cards'" />
              <UButton icon="i-lucide-table" size="xs" color="neutral" :variant="journeyView === 'table' ? 'solid' : 'outline'" label="Table" @click="journeyView = 'table'" />
            </span>
          </div>
          <div class="blr-pane flex-1">
            <p v-if="!scopedJourneys.length" class="p-6 text-sm text-dimmed italic">
              No Journeys declare availability in this context.
            </p>

            <div v-else-if="journeyView === 'cards'" class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              <button
                v-for="journey in scopedJourneys"
                :key="journey.id"
                type="button"
                class="gw-card"
                @click="openJourneyId = journey.id"
              >
                <span class="flex items-center gap-2">
                  <BlrKind kind="journey" :labelled="false" />
                  <span class="min-w-0 flex-1 truncate text-start text-sm font-medium text-highlighted">{{ journey.title }}</span>
                  <span class="gw-counts">{{ journey.stepCount }} steps</span>
                </span>
                <span class="line-clamp-3 text-start text-xs leading-relaxed text-toned">{{ firstSentence(journey.lead, 220) }}</span>
                <span class="flex flex-wrap gap-1">
                  <span v-for="pair in journey.availability" :key="pair.key" class="gw-chip">{{ pairLabel(pair) }}</span>
                </span>
                <span class="space-y-1 text-start">
                  <BlrLinks :workspace="workspace" :ids="journey.actorIds" kind="actor" />
                  <BlrLinks :workspace="workspace" :ids="journey.capabilityIds" kind="capability" :max="3" />
                  <BlrLinks :workspace="workspace" :ids="journey.screenIds" kind="screen" :max="3" />
                  <BlrLinks :workspace="workspace" :ids="journey.ruleIds" kind="rule" :max="2" />
                </span>
                <span class="mt-auto border-t border-muted pt-2 text-start text-[11px] text-dimmed">
                  <span class="font-medium text-toned">{{ journey.scenarioIds.length }} Scenarios</span>
                  <template v-if="journey.scenarioIds.length"> — {{ scenarioNames(journey) }}</template>
                </span>
              </button>
            </div>

            <div v-else class="overflow-x-auto p-4">
              <table class="gw-table">
                <thead>
                  <tr>
                    <th>Journey</th>
                    <th>Actors</th>
                    <th>Contexts</th>
                    <th>Capabilities</th>
                    <th>Screens</th>
                    <th>Scenarios</th>
                    <th>Rules</th>
                    <th>Authored steps</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="journey in scopedJourneys"
                    :key="journey.id"
                    class="cursor-pointer"
                    @click="openJourneyId = journey.id"
                  >
                    <td class="font-medium text-highlighted">{{ journey.title }}</td>
                    <td>{{ titlesOf(journey.actorIds) }}</td>
                    <td>{{ journey.availability.map(pairLabel).join('; ') }}</td>
                    <td class="tabular-nums" :title="titlesOf(journey.capabilityIds)">{{ journey.capabilityIds.length }}</td>
                    <td class="tabular-nums" :title="titlesOf(journey.screenIds)">{{ journey.screenIds.length }}</td>
                    <td class="tabular-nums" :title="titlesOf(journey.scenarioIds)">{{ journey.scenarioIds.length }}</td>
                    <td class="tabular-nums" :title="titlesOf(journey.ruleIds)">{{ journey.ruleIds.length }}</td>
                    <td class="tabular-nums">{{ journey.stepCount }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="mt-2 text-[11px] text-dimmed">
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
          class="flex shrink-0 flex-wrap items-center gap-2 border-b border-default bg-elevated/40 px-4 py-1.5 text-xs"
        >
          <UIcon name="i-lucide-funnel" class="size-3.5 text-dimmed" />
          <span class="text-toned">
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
              <h3 class="gw-label border-b border-default pb-2">Capabilities by Domain</h3>
              <div v-for="group in domainGroups" :key="group.id || 'no-domain'" class="space-y-2">
                <div class="flex flex-wrap items-baseline gap-2">
                  <template v-if="group.domain">
                    <BlrKind kind="domain" :labelled="false" size="xs" />
                    <button type="button" class="gw-inline text-sm" @click="inspect(group.domain.id)">{{ group.domain.title }}</button>
                    <span class="min-w-0 flex-1 truncate text-xs text-dimmed">{{ firstSentence(group.domain.lead) }}</span>
                  </template>
                  <span v-else class="text-sm font-medium text-toned">Without a Domain</span>
                </div>
                <p v-if="!group.capabilities.length" class="text-xs text-dimmed italic">
                  No Capability of this Domain is available in the selected context.
                </p>
                <div class="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                  <button
                    v-for="capability in group.capabilities"
                    :key="capability.id"
                    type="button"
                    class="gw-card"
                    @click="inspect(capability.id)"
                  >
                    <span class="flex items-center gap-2">
                      <BlrKind kind="capability" :labelled="false" />
                      <span class="min-w-0 flex-1 truncate text-start text-sm font-medium text-highlighted">{{ capability.title }}</span>
                    </span>
                    <span class="line-clamp-2 text-start text-xs leading-relaxed text-toned">{{ firstSentence(capability.lead, 180) }}</span>
                    <span class="flex flex-wrap gap-1">
                      <span v-for="pair in capability.availability" :key="pair.key" class="gw-chip">{{ pairLabel(pair) }}</span>
                    </span>
                    <span class="gw-counts" title="Derived: backlinks resolved from the model">
                      {{ capability.journeyIds.length }} journeys · {{ capability.screenIds.length }} screens · {{ capability.ruleIds.length }} rules
                    </span>
                  </button>
                </div>
              </div>
            </section>

            <!-- Named matrix 1: the signature availability matrix -->
            <section class="space-y-2">
              <h3 class="text-sm font-medium text-highlighted">Where can each Capability be reached?</h3>
              <p class="text-xs text-dimmed">
                Capabilities × access contexts. A filled cell is a declared availability; click any cell for the facts behind it.
              </p>
              <div class="overflow-x-auto rounded-xl border border-default p-3">
                <table class="gw-matrix">
                  <thead>
                    <tr>
                      <th class="text-start"><span class="gw-label">Capability</span></th>
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
                        <button type="button" class="gw-inline" @click="inspect(capability.id)">{{ capability.title }}</button>
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
              <h3 class="text-sm font-medium text-highlighted">Which promises depend on each Capability?</h3>
              <p class="text-xs text-dimmed">
                Capabilities × Journeys. A filled cell means the Journey lists the Capability among what it uses.
              </p>
              <div class="overflow-x-auto rounded-xl border border-default p-3">
                <table class="gw-matrix">
                  <thead>
                    <tr>
                      <th class="text-start"><span class="gw-label">Capability</span></th>
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
                        <button type="button" class="gw-inline" @click="inspect(capability.id)">{{ capability.title }}</button>
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
            <div v-if="matrixDetail" class="flex items-start gap-3 rounded-xl border border-accented bg-elevated/40 p-3">
              <UIcon name="i-lucide-corner-down-right" class="mt-1 size-4 shrink-0 text-dimmed" />
              <div class="min-w-0 flex-1 space-y-2">
                <p class="text-sm text-toned">
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
                <p v-else-if="matrixDetail.on && matrixDetail.matrix === 'reach'" class="text-xs text-dimmed">
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
          <div class="space-y-1 p-3">
            <p class="gw-label">Business rules · {{ workspace.rules.length }}</p>
            <button
              v-for="rule in workspace.rules"
              :key="rule.id"
              type="button"
              class="gw-context gw-context--direct"
              :class="{ 'is-active': selectedRule?.id === rule.id }"
              @click="selectedRuleId = rule.id"
            >
              <span class="flex items-center gap-1.5">
                <BlrKind kind="rule" :labelled="false" size="xs" />
                <span class="truncate text-xs font-medium text-highlighted">{{ rule.title }}</span>
              </span>
              <span class="gw-counts">
                <template v-if="rule.availability.length">narrowed · </template>{{ rule.domainIds.length + rule.capabilityIds.length + rule.journeyIds.length + rule.scenarioIds.length }} direct attachments
              </span>
            </button>
            <p v-if="!workspace.rules.length" class="text-xs text-dimmed italic">
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
            <h2 class="text-xl tracking-tight text-highlighted">{{ selectedRule.title }}</h2>

            <section class="rounded-lg border-s-2 border-primary bg-elevated/40 p-3">
              <BlrProse :text="selectedRule.statement" />
            </section>

            <section v-if="selectedRule.rationale" class="space-y-1.5">
              <p class="gw-label">Rationale</p>
              <BlrProse :text="selectedRule.rationale" />
            </section>

            <section class="space-y-1.5">
              <p class="gw-label">Narrowed availability</p>
              <div v-if="selectedRule.availability.length" class="flex flex-wrap gap-1.5">
                <button
                  v-for="pair in selectedRule.availability"
                  :key="pair.key"
                  type="button"
                  class="gw-chip"
                  :title="`Scope the Surface to ${pairLabel(pair)}`"
                  @click="goToContext(pair.key)"
                >
                  <UIcon name="i-lucide-door-open" class="size-3 text-dimmed" />
                  {{ pairLabel(pair) }}
                </button>
              </div>
              <p v-else class="text-xs text-dimmed italic">
                Not narrowed to specific Interface availability scopes.
              </p>
            </section>

            <section class="gw-impact--direct space-y-2">
              <p class="gw-label">Directly constrains — authored on the Rule</p>
              <BlrLinks :workspace="workspace" :ids="selectedRule.domainIds" kind="domain" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="selectedRule.capabilityIds" kind="capability" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="selectedRule.journeyIds" kind="journey" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="selectedRule.scenarioIds" kind="scenario" interactive @select="inspectEntity" />
              <p v-if="!ruleImpact.directTotal" class="text-xs text-dimmed italic">
                This Rule names no Domain, Capability, Journey, or Scenario directly.
              </p>
            </section>

            <section class="gw-impact--derived space-y-2">
              <p class="gw-label">Derived impact — computed from the model</p>
              <BlrLinks :workspace="workspace" :ids="ruleImpact.derivedDomainIds" kind="domain" label="Domains, via constrained Capabilities" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="ruleImpact.derivedCapabilityIds" kind="capability" label="Capabilities, via constrained Domains" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="ruleImpact.derivedJourneyIds" kind="journey" label="Journeys, via Capabilities and Scenarios" interactive @select="inspectEntity" />
              <BlrLinks :workspace="workspace" :ids="ruleImpact.derivedScreenIds" kind="screen" label="Screens, via Capabilities and Scenarios" interactive @select="inspectEntity" />
              <p v-if="!ruleImpact.derivedTotal" class="text-xs text-dimmed italic">
                No reach beyond the direct attachments.
              </p>
            </section>
          </div>
          <p v-else class="p-6 text-sm text-dimmed italic">
            No Business Rules authored in this model.
          </p>
        </div>
      </div>

      <!-- ============ ABOUT: identity, coverage, references ============ -->
      <div v-else class="blr-pane min-w-0 flex-1">
        <div class="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
          <header class="space-y-2">
            <img v-if="logoSrc" :src="logoSrc" alt="" class="size-10 rounded">
            <h2 class="text-2xl tracking-tight text-highlighted">{{ workspace.identity.title }}</h2>
            <p class="text-sm text-toned">{{ workspace.identity.summary }}</p>
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge v-if="workspace.identity.categoryLabel" color="primary" variant="subtle" size="sm">{{ workspace.identity.categoryLabel }}</UBadge>
              <UBadge v-for="tag in workspace.identity.tags" :key="tag" color="neutral" variant="subtle" size="sm">{{ tag }}</UBadge>
              <UBadge v-if="workspace.identity.license" color="neutral" variant="outline" size="sm">{{ workspace.identity.license }}</UBadge>
            </div>
          </header>

          <BlrProse :text="workspace.identity.description" />

          <section v-if="workspace.identity.intent" class="space-y-1.5">
            <p class="gw-label">Intent</p>
            <BlrProse :text="workspace.identity.intent" />
          </section>

          <section v-if="workspace.identity.supportingContent" class="space-y-1.5">
            <p class="gw-label">Supporting context</p>
            <BlrProse :text="workspace.identity.supportingContent" />
          </section>

          <section class="space-y-3 rounded-xl border border-default p-4">
            <div class="flex flex-wrap items-center gap-2">
              <p class="gw-label">Coverage</p>
              <UBadge :color="STATUS_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">
                {{ workspace.coverage.status }}
              </UBadge>
            </div>
            <BlrProse v-if="workspace.coverage.rationale" :text="workspace.coverage.rationale" />
            <div v-if="workspace.coverage.method.length" class="space-y-1">
              <p class="gw-label">Method</p>
              <ul class="list-disc space-y-0.5 ps-5 text-sm text-toned marker:text-dimmed">
                <li v-for="(item, index) in workspace.coverage.method" :key="index">{{ item }}</li>
              </ul>
            </div>
            <div v-if="workspace.coverage.sourceAreas.length" class="space-y-1">
              <p class="gw-label">Source areas</p>
              <div class="flex flex-wrap gap-1.5">
                <code v-for="(item, index) in workspace.coverage.sourceAreas" :key="index" class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-toned">{{ item }}</code>
              </div>
            </div>
            <div v-if="workspace.coverage.unmapped.length" class="space-y-1">
              <p class="gw-label">Unmapped</p>
              <ul class="list-disc space-y-0.5 ps-5 text-sm text-dimmed marker:text-dimmed">
                <li v-for="(item, index) in workspace.coverage.unmapped" :key="index">{{ item }}</li>
              </ul>
            </div>
            <div v-if="workspace.coverage.limitations.length" class="space-y-1">
              <p class="gw-label">Coverage limitations</p>
              <ul class="list-disc space-y-0.5 ps-5 text-sm text-dimmed marker:text-dimmed">
                <li v-for="(item, index) in workspace.coverage.limitations" :key="index">{{ item }}</li>
              </ul>
            </div>
            <div v-if="workspace.identity.limitations.length" class="space-y-1">
              <p class="gw-label">Report limitations</p>
              <ul class="list-disc space-y-0.5 ps-5 text-sm text-dimmed marker:text-dimmed">
                <li v-for="(item, index) in workspace.identity.limitations" :key="index">{{ item }}</li>
              </ul>
            </div>
          </section>

          <section class="space-y-2">
            <p class="gw-label">Counted from the model</p>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <div v-for="entry in countEntries" :key="entry.label" class="gw-stat">
                <p class="font-mono text-lg text-highlighted tabular-nums">{{ entry.value }}</p>
                <p class="text-[11px] text-dimmed">{{ entry.label }}</p>
              </div>
            </div>
          </section>

          <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />

          <section v-if="workspace.references.length" class="space-y-2">
            <p class="gw-label">Every reference in the model · {{ workspace.references.length }}</p>
            <ul class="space-y-1">
              <li
                v-for="(group, index) in workspace.references"
                :key="`${group.ownerId}-${group.reference.target}-${index}`"
                class="flex min-w-0 items-center gap-2 text-xs"
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
                <span v-else class="shrink-0 font-medium text-toned">{{ group.ownerTitle }}</span>
                <span class="truncate font-mono text-[11px] text-dimmed">{{ group.reference.title || group.reference.target }}</span>
                <UBadge color="neutral" variant="subtle" size="sm" class="ms-auto shrink-0 text-[9px] uppercase">{{ group.reference.role }}</UBadge>
              </li>
            </ul>
          </section>

          <footer class="space-y-1 border-t border-default pt-4 font-mono text-[11px] text-dimmed">
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

      <!-- ============ INSPECTOR: full entity content + contextual topology ============ -->
      <aside
        v-if="inspectorEntity"
        class="absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-s border-default bg-default shadow-xl"
      >
        <div class="flex shrink-0 items-center gap-2 border-b border-default px-3 py-2">
          <BlrKind :kind="inspectorEntity.kind" :labelled="false" />
          <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ inspectorEntity.title }}</span>
          <UButton
            :icon="inspectorMode === 'detail' ? 'i-lucide-waypoints' : 'i-lucide-file-text'"
            size="xs"
            color="neutral"
            variant="outline"
            :label="inspectorMode === 'detail' ? 'Map' : 'Detail'"
            :title="inspectorMode === 'detail' ? 'Show this entity\'s neighbourhood' : 'Back to the full record'"
            @click="inspectorMode = inspectorMode === 'detail' ? 'map' : 'detail'"
          />
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" title="Close" @click="closeInspector" />
        </div>
        <div v-if="inspectorMode === 'detail'" class="blr-pane flex-1 p-4">
          <BlrEntityDetail :workspace="workspace" :entity="inspectorEntity" @select="inspectEntity" />
        </div>
        <div v-else class="min-h-0 flex-1">
          <BlrTopology :workspace="workspace" :focus-id="inspectorEntity.id" @inspect="inspectEntity" />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.gw-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.gw-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid transparent;
  border-radius: 7px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-muted);
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.gw-tab:hover {
  color: var(--ui-text-highlighted);
  background: var(--ui-bg-elevated);
}

.gw-tab.is-active {
  color: var(--ui-primary);
  border-color: color-mix(in srgb, var(--ui-primary) 45%, transparent);
  background: color-mix(in srgb, var(--ui-primary) 8%, transparent);
}

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

.gw-counts {
  display: block;
  margin-top: 0.15rem;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ui-text-dimmed);
}

.gw-slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1rem;
  border: 1px solid var(--ui-primary);
  border-radius: 4px;
  padding: 0 0.2rem;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  color: var(--ui-primary);
}

.gw-actor {
  min-width: 15rem;
  max-width: 19rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: var(--ui-bg);
  text-align: start;
  transition: border-color 0.15s ease;
}

.gw-actor:hover {
  border-color: var(--ui-border-accented);
}

.gw-card {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.9rem;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  background: var(--ui-bg);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.gw-card:hover {
  border-color: var(--ui-border-accented);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--ui-text) 8%, transparent);
}

.gw-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.1rem 0.55rem;
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  font-size: 11px;
  color: var(--ui-text-toned);
  transition: border-color 0.15s ease, color 0.15s ease;
}

button.gw-chip:hover {
  border-color: var(--ui-primary);
  color: var(--ui-primary);
}

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

.gw-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.gw-table th {
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid var(--ui-border);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-align: start;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
  white-space: nowrap;
}

.gw-table td {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid var(--ui-border-muted);
  vertical-align: top;
  color: var(--ui-text-toned);
}

.gw-table tbody tr:hover {
  background: var(--ui-bg-elevated);
}

.gw-matrix {
  border-collapse: collapse;
  font-size: 0.78rem;
}

.gw-matrix thead th {
  padding: 0.3rem 0.25rem;
  border-bottom: 1px solid var(--ui-border);
  vertical-align: bottom;
}

.gw-colhead {
  max-height: 9rem;
  overflow: hidden;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--ui-text-muted);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.gw-colhead:hover {
  color: var(--ui-primary);
}

.gw-matrix tbody th {
  padding: 0.25rem 0.75rem 0.25rem 0;
  border-bottom: 1px solid var(--ui-border-muted);
  font-weight: 500;
  text-align: start;
  color: var(--ui-text-toned);
  white-space: nowrap;
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

.gw-scenario {
  padding: 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
}

.gw-impact--direct {
  padding: 0.9rem;
  border: 1.5px solid var(--ui-border-accented);
  border-radius: 12px;
}

.gw-impact--derived {
  padding: 0.9rem;
  border: 1.5px dashed var(--ui-border);
  border-radius: 12px;
}

.gw-stat {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
}
</style>
