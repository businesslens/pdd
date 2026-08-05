<script setup lang="ts">
/**
 * Promises — Journeys first; everything else is their context.
 *
 * IA: the home is an identity band over the Journey browser (promise cards ⇄ a
 * factual comparison table). Selecting a Journey fills the surface with its
 * dossier — a scenario storyline, a Journey-scoped Screen map, the
 * Capabilities and Rules it relies on, and a contextual topology tab. A slim
 * top nav keeps the rest of the model reachable without demoting it to
 * decoration: Surface (the full Screen map with a Journey overlay), Abilities
 * (Domain-grouped Capabilities plus two named matrices), Constraints (Rule
 * impact, direct vs derived) and Access (Actor and context cards). Selecting
 * any entity anywhere docks an inspector with the complete entity content and
 * an optional neighbourhood map.
 */
import type {
  AnyEntityView,
  AvailabilityPair,
  CapabilityView,
  JourneyView,
  ReportWorkspace,
  RuleView,
  ScenarioView
} from '../utils/reportWorkspace'
import { resolveEntities } from '../utils/reportWorkspace'
import { buildScreenMap } from '../utils/flowGraph'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

type NavId = 'promises' | 'surface' | 'abilities' | 'constraints' | 'access'

const NAV_ITEMS: Array<{ id: NavId, label: string, icon: string }> = [
  { id: 'promises', label: 'Promises', icon: 'i-lucide-heart-handshake' },
  { id: 'surface', label: 'Surface', icon: 'i-lucide-monitor' },
  { id: 'abilities', label: 'Abilities', icon: 'i-lucide-zap' },
  { id: 'constraints', label: 'Constraints', icon: 'i-lucide-scale' },
  { id: 'access', label: 'Access', icon: 'i-lucide-door-open' }
]

const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  complete: 'success', partial: 'warning', draft: 'neutral'
}
const ACCESS_TONE: Record<string, 'success' | 'warning' | 'error'> = {
  public: 'success', authenticated: 'warning', restricted: 'error'
}

const nav = ref<NavId>('promises')
const journeyId = ref<string | null>(null)
const journeyMode = ref<'cards' | 'table'>('cards')
const dossierTab = ref<'story' | 'map'>('story')
const aboutOpen = ref(false)
const surfaceOverlayId = ref<string | null>(null)
const inspectorId = ref<string | null>(null)
const inspectorMap = ref(false)
const matrixCell = ref<{ matrixId: string, rowId: string, colId: string } | null>(null)

const identity = computed(() => props.workspace.identity)
const coverage = computed(() => props.workspace.coverage)

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function byId(id: string): AnyEntityView | undefined {
  return props.workspace.byId.get(id)
}

function titleOf(id: string): string {
  return byId(id)?.title ?? id
}

function resolve(ids: string[]): AnyEntityView[] {
  return resolveEntities(props.workspace, ids)
}

function pairLabel(pair: AvailabilityPair): string {
  return pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : pair.interfaceTitle
}

function goNav(id: NavId) {
  nav.value = id
  if (id === 'promises') journeyId.value = null
}

function openJourney(id: string) {
  nav.value = 'promises'
  journeyId.value = id
  dossierTab.value = 'story'
}

function inspect(target: AnyEntityView | string | null) {
  const entity = typeof target === 'string' ? byId(target) ?? null : target
  inspectorId.value = entity?.id ?? null
  inspectorMap.value = false
}

function inspectOnMap(target: AnyEntityView | string) {
  inspect(target)
  inspectorMap.value = Boolean(inspectorId.value)
}

const inspectorEntity = computed(() => (inspectorId.value ? byId(inspectorId.value) ?? null : null))

/* ------------------------------------------------------------------ */
/* Home: identity facts                                                */
/* ------------------------------------------------------------------ */

const countFacts = computed(() => {
  const counts = props.workspace.counts
  return [
    { label: 'Journeys', value: counts.journeys },
    { label: 'Scenarios', value: counts.scenarios },
    { label: 'Steps', value: counts.steps },
    { label: 'Decisions', value: counts.decisionPoints },
    { label: 'Capabilities', value: counts.capabilities },
    { label: 'Domains', value: counts.domains },
    { label: 'Screens', value: counts.screens },
    { label: 'Interfaces', value: counts.interfaces },
    { label: 'Experiences', value: counts.experiences },
    { label: 'Rules', value: counts.rules },
    { label: 'Actors', value: counts.actors }
  ].filter(fact => fact.value > 0)
})

const limitations = computed(() =>
  unique([...identity.value.limitations, ...coverage.value.limitations]))

/* ------------------------------------------------------------------ */
/* Journey dossier                                                     */
/* ------------------------------------------------------------------ */

const journey = computed<JourneyView | null>(() => {
  if (!journeyId.value) return null
  const entity = byId(journeyId.value)
  return entity && entity.kind === 'journey' ? entity : null
})

const journeyScenarios = computed<ScenarioView[]>(() =>
  journey.value ? props.workspace.scenariosByJourney.get(journey.value.id) ?? [] : [])

const dossierCapabilities = computed<CapabilityView[]>(() => {
  const current = journey.value
  if (!current) return []
  return resolve(current.capabilityIds).filter((entity): entity is CapabilityView => entity.kind === 'capability')
})

interface RuleReach {
  rule: RuleView
  direct: boolean
  viaScenarios: ScenarioView[]
}

const dossierRules = computed<RuleReach[]>(() => {
  const current = journey.value
  if (!current) return []
  return current.ruleIds.flatMap((id) => {
    const rule = byId(id)
    if (!rule || rule.kind !== 'rule') return []
    const viaScenarios = rule.scenarioIds
      .filter(scenarioId => current.scenarioIds.includes(scenarioId))
      .map(scenarioId => byId(scenarioId))
      .filter((entity): entity is ScenarioView => Boolean(entity && entity.kind === 'scenario'))
    return [{ rule, direct: rule.journeyIds.includes(current.id), viaScenarios }]
  })
})

const dossierMap = computed(() => {
  const current = journey.value
  if (!current) return { nodes: [], edges: [] }
  return buildScreenMap(props.workspace, {
    emphasizeScreenIds: new Set(current.screenIds),
    selectedId: inspectorId.value
  })
})

/* ------------------------------------------------------------------ */
/* Surface: the full Screen map with a Journey overlay                 */
/* ------------------------------------------------------------------ */

const surfaceOverlay = computed<JourneyView | null>(() => {
  if (!surfaceOverlayId.value) return null
  const entity = byId(surfaceOverlayId.value)
  return entity && entity.kind === 'journey' ? entity : null
})

const surfaceMap = computed(() => buildScreenMap(props.workspace, {
  emphasizeScreenIds: surfaceOverlay.value ? new Set(surfaceOverlay.value.screenIds) : null,
  selectedId: inspectorId.value
}))

/* ------------------------------------------------------------------ */
/* Abilities: Domain groups and the two named matrices                 */
/* ------------------------------------------------------------------ */

const abilityGroups = computed(() => {
  const groups: Array<{ id: string, title: string, lead: string, capabilities: CapabilityView[] }> = []
  for (const domain of props.workspace.domains) {
    groups.push({
      id: domain.id,
      title: domain.title,
      lead: domain.lead,
      capabilities: props.workspace.capabilitiesByDomain.get(domain.id) ?? []
    })
  }
  const undomained = props.workspace.capabilitiesByDomain.get('') ?? []
  if (undomained.length) groups.push({ id: '', title: 'Outside any Domain', lead: '', capabilities: undomained })
  return groups
})

type MatrixCellStateKind = 'none' | 'direct' | 'derived'

interface MatrixView {
  id: string
  question: string
  note: string
  accent: string
  cols: Array<{ id: string, title: string }>
  rows: Array<{ rowId: string, title: string, cells: Array<{ colId: string, state: MatrixCellStateKind }> }>
}

const matrices = computed<MatrixView[]>(() => {
  const capabilities = props.workspace.capabilities
  const list: MatrixView[] = []
  if (capabilities.length && props.workspace.journeys.length) {
    list.push({
      id: 'cap-journeys',
      question: 'Which promises depend on each Capability?',
      note: 'A filled cell is an authored “uses” relation from the Journey.',
      accent: 'var(--blr-slot-6)',
      cols: props.workspace.journeys.map(item => ({ id: item.id, title: item.title })),
      rows: capabilities.map(capability => ({
        rowId: capability.id,
        title: capability.title,
        cells: props.workspace.journeys.map(item => ({
          colId: item.id,
          state: item.capabilityIds.includes(capability.id) ? 'direct' as const : 'none' as const
        }))
      }))
    })
  }
  if (capabilities.length && props.workspace.rules.length) {
    list.push({
      id: 'cap-rules',
      question: 'Which Rules constrain each Capability?',
      note: 'Filled = authored on the Rule · outlined = derived through the Capability’s Domain.',
      accent: 'var(--blr-slot-8)',
      cols: props.workspace.rules.map(item => ({ id: item.id, title: item.title })),
      rows: capabilities.map(capability => ({
        rowId: capability.id,
        title: capability.title,
        cells: props.workspace.rules.map((rule) => {
          let state: MatrixCellStateKind = 'none'
          if (rule.capabilityIds.includes(capability.id)) state = 'direct'
          else if (capability.domainId && rule.domainIds.includes(capability.domainId)) state = 'derived'
          return { colId: rule.id, state }
        })
      }))
    })
  }
  return list
})

const matrixExplanation = computed(() => {
  const cell = matrixCell.value
  if (!cell) return null
  const capability = byId(cell.rowId)
  const other = byId(cell.colId)
  if (!capability || capability.kind !== 'capability' || !other) return null
  let text = ''
  if (cell.matrixId === 'cap-journeys' && other.kind === 'journey') {
    text = other.capabilityIds.includes(capability.id)
      ? `“${other.title}” uses “${capability.title}” — the promise depends on this ability. Authored on the Journey.`
      : `“${other.title}” does not use “${capability.title}” — no authored relation.`
  } else if (cell.matrixId === 'cap-rules' && other.kind === 'rule') {
    if (other.capabilityIds.includes(capability.id)) {
      text = `“${other.title}” directly constrains “${capability.title}”. Authored on the Rule.`
    } else if (capability.domainId && other.domainIds.includes(capability.domainId)) {
      text = `“${other.title}” constrains the ${titleOf(capability.domainId)} Domain; “${capability.title}” sits in that Domain, so the constraint reaches it — derived, not authored.`
    } else {
      text = `“${other.title}” does not constrain “${capability.title}” — no authored relation, directly or through its Domain.`
    }
  }
  return text ? { text, capability, other } : null
})

function pickCell(matrixId: string, rowId: string, colId: string) {
  const current = matrixCell.value
  matrixCell.value = current && current.matrixId === matrixId && current.rowId === rowId && current.colId === colId
    ? null
    : { matrixId, rowId, colId }
}

/* ------------------------------------------------------------------ */
/* Constraints: direct vs derived Rule reach                           */
/* ------------------------------------------------------------------ */

interface RuleImpact {
  rule: RuleView
  derivedJourneys: JourneyView[]
  derivedCapabilities: CapabilityView[]
}

const ruleImpacts = computed<RuleImpact[]>(() => props.workspace.rules.map((rule) => {
  const directJourneys = new Set(rule.journeyIds)
  const journeyIdsViaScenarios = unique(rule.scenarioIds
    .map((scenarioId) => {
      const scenario = byId(scenarioId)
      return scenario && scenario.kind === 'scenario' ? scenario.journeyId : ''
    })
    .filter(Boolean))
  const derivedJourneys = journeyIdsViaScenarios
    .filter(id => !directJourneys.has(id))
    .map(id => byId(id))
    .filter((entity): entity is JourneyView => Boolean(entity && entity.kind === 'journey'))
  const directCapabilities = new Set(rule.capabilityIds)
  const derivedCapabilities = props.workspace.capabilities.filter(capability =>
    !directCapabilities.has(capability.id)
    && Boolean(capability.domainId)
    && rule.domainIds.includes(capability.domainId!))
  return { rule, derivedJourneys, derivedCapabilities }
}))
</script>

<template>
  <div class="blr-promises relative flex h-full min-h-0 flex-col overflow-hidden">
    <!-- Persistent slim nav -->
    <nav class="flex shrink-0 flex-wrap items-center gap-x-1 gap-y-1 border-b border-default py-1.5">
      <button type="button" class="me-2 inline-flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-start hover:bg-elevated/60" title="Back to the promises" @click="goNav('promises')">
        <img v-if="logoSrc" :src="logoSrc" alt="" class="size-5 rounded">
        <UIcon v-else name="i-lucide-heart-handshake" class="size-4 text-primary" />
        <span class="truncate text-sm font-semibold tracking-tight text-highlighted">{{ identity.title }}</span>
      </button>
      <button v-for="item in NAV_ITEMS" :key="item.id" type="button" class="blr-nav-btn" :class="nav === item.id && 'blr-nav-btn--active'" @click="goNav(item.id)">
        <UIcon :name="item.icon" class="size-3.5" />
        {{ item.label }}
      </button>
      <UBadge :color="COVERAGE_TONE[coverage.status] || 'neutral'" variant="subtle" size="sm" class="ms-auto capitalize">{{ coverage.status }} coverage</UBadge>
    </nav>

    <!-- ============================== HOME + DOSSIER ============================== -->
    <div v-if="nav === 'promises'" class="min-h-0 flex-1">
      <!-- HOME -->
      <div v-if="!journey" class="blr-pane h-full">
        <header class="border-b border-default py-6">
          <div class="flex flex-wrap items-start gap-4">
            <img v-if="logoSrc" :src="logoSrc" alt="" class="size-12 rounded-lg border border-default">
            <div class="min-w-0 flex-1 space-y-1.5">
              <p class="font-mono text-[10px] tracking-[0.14em] text-dimmed uppercase">Product report · read as promises</p>
              <h1 class="text-2xl font-semibold tracking-tight text-highlighted">{{ identity.title }}</h1>
              <p class="max-w-3xl text-sm leading-relaxed text-toned">{{ identity.summary }}</p>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Made for</span>
            <button v-for="actor in workspace.actors" :key="actor.id" type="button" class="inline-flex items-center gap-1.5 rounded-full border border-default bg-elevated/40 px-2.5 py-1 text-xs text-toned hover:border-accented hover:bg-elevated" @click="inspect(actor)">
              <BlrKind kind="actor" :labelled="false" size="xs" />
              {{ actor.title }}
            </button>
            <span v-if="!workspace.actors.length" class="text-xs text-dimmed italic">No Actors authored.</span>
          </div>
          <div class="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span v-for="fact in countFacts" :key="fact.label" class="text-xs text-dimmed">
              <span class="font-mono font-medium text-toned tabular-nums">{{ fact.value }}</span>
              {{ fact.label }}
            </span>
            <span v-if="coverage.rationale" class="text-xs text-dimmed italic">{{ firstSentence(coverage.rationale) }}</span>
            <UButton color="neutral" variant="ghost" size="xs" :icon="aboutOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" label="About this product & report" class="ms-auto" @click="aboutOpen = !aboutOpen" />
          </div>

          <div v-if="aboutOpen" class="mt-4 space-y-4 rounded-xl border border-default bg-elevated/30 p-4">
            <BlrProse :text="identity.description" />
            <div v-if="identity.intent" class="space-y-1.5">
              <h4 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Intent</h4>
              <BlrProse :text="identity.intent" />
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge v-if="identity.categoryLabel" color="primary" variant="subtle" size="sm">{{ identity.categoryLabel }}</UBadge>
              <UBadge v-for="tag in identity.tags" :key="tag" color="neutral" variant="subtle" size="sm">{{ tag }}</UBadge>
            </div>
            <div v-if="identity.authors.length" class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
              <span class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Authors</span>
              <template v-for="author in identity.authors" :key="author.name">
                <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">{{ author.name }}</a>
                <span v-else class="text-toned">{{ author.name }}</span>
              </template>
              <span v-if="identity.license" class="text-dimmed">· {{ identity.license }}</span>
            </div>
            <div class="space-y-1.5">
              <h4 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Coverage</h4>
              <BlrProse :text="coverage.rationale" />
              <div v-if="coverage.method.length || coverage.sourceAreas.length" class="flex flex-wrap gap-1.5">
                <span v-for="entry in [...coverage.method, ...coverage.sourceAreas]" :key="entry" class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-dimmed">{{ entry }}</span>
              </div>
              <ul v-if="coverage.unmapped.length" class="list-disc space-y-1 ps-5 text-xs text-dimmed marker:text-dimmed">
                <li v-for="entry in coverage.unmapped" :key="entry">Unmapped · {{ entry }}</li>
              </ul>
            </div>
            <div v-if="limitations.length" class="space-y-1.5">
              <h4 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Known limitations</h4>
              <ul class="list-disc space-y-1 ps-5 text-xs text-dimmed marker:text-dimmed">
                <li v-for="entry in limitations" :key="entry">{{ entry }}</li>
              </ul>
            </div>
            <BlrRefs :references="identity.references" variant="list" />
            <p class="font-mono text-[10px] text-dimmed">{{ identity.generator.name }} v{{ identity.generator.version }} · schema {{ identity.schemaVersion }} · {{ identity.generatedAt }}</p>
          </div>
        </header>

        <!-- Journey browser -->
        <section class="py-6">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            <h2 class="text-lg font-semibold tracking-tight text-highlighted">What we promise</h2>
            <p class="text-xs text-dimmed">{{ workspace.journeys.length }} Journeys, each read as a promise the Product keeps.</p>
            <div class="ms-auto inline-flex overflow-hidden rounded-md border border-default">
              <button type="button" class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs" :class="journeyMode === 'cards' ? 'bg-elevated text-highlighted' : 'text-dimmed hover:text-toned'" @click="journeyMode = 'cards'">
                <UIcon name="i-lucide-layout-grid" class="size-3.5" /> Cards
              </button>
              <button type="button" class="inline-flex items-center gap-1.5 border-s border-default px-2.5 py-1 text-xs" :class="journeyMode === 'table' ? 'bg-elevated text-highlighted' : 'text-dimmed hover:text-toned'" @click="journeyMode = 'table'">
                <UIcon name="i-lucide-table" class="size-3.5" /> Compare
              </button>
            </div>
          </div>

          <p v-if="!workspace.journeys.length" class="mt-6 text-sm text-dimmed italic">No Journeys are authored in this model yet — there are no promises to read.</p>

          <!-- Card view -->
          <div v-else-if="journeyMode === 'cards'" class="mt-5 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            <article v-for="(promise, index) in workspace.journeys" :key="promise.id" class="blr-promise-card flex flex-col rounded-xl border border-default bg-default">
              <div class="flex-1 space-y-3 p-5">
                <p class="font-mono text-[10px] tracking-[0.14em] text-dimmed uppercase">Promise {{ index + 1 }}</p>
                <h3 class="text-lg font-semibold leading-snug tracking-tight text-highlighted">
                  <button type="button" class="text-start hover:underline underline-offset-4" @click="openJourney(promise.id)">{{ promise.title }}</button>
                </h3>
                <p class="text-sm leading-relaxed text-toned line-clamp-3">{{ promise.lead }}</p>
                <div class="space-y-1.5">
                  <BlrLinks :workspace="workspace" :ids="promise.actorIds" kind="actor" label="Made for" interactive @select="inspect($event)" />
                  <div v-if="promise.availability.length" class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
                    <span class="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">
                      <UIcon name="i-lucide-door-open" class="size-3" /> Available in
                    </span>
                    <span v-for="pair in promise.availability" :key="pair.key" class="rounded-full border border-default px-2 py-0.5 text-[11px] text-toned">{{ pairLabel(pair) }}</span>
                  </div>
                </div>
                <div class="space-y-1.5 border-t border-muted pt-3">
                  <p class="font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">How it unfolds · {{ promise.scenarioIds.length }} scenarios</p>
                  <ul class="space-y-1">
                    <li v-for="scenario in (workspace.scenariosByJourney.get(promise.id) ?? []).slice(0, 4)" :key="scenario.id">
                      <button type="button" class="inline-flex max-w-full items-center gap-2 text-start text-xs text-toned hover:text-highlighted" :title="scenario.kindName" @click="inspect(scenario)">
                        <span class="size-1.5 shrink-0 rounded-full" :style="{ backgroundColor: `var(--blr-slot-${scenario.kindSlot})` }" />
                        <span class="truncate">{{ scenario.title }}</span>
                      </button>
                    </li>
                    <li v-if="promise.scenarioIds.length > 4" class="text-xs text-dimmed">+{{ promise.scenarioIds.length - 4 }} more</li>
                    <li v-if="!promise.scenarioIds.length" class="text-xs text-dimmed italic">No Scenarios authored yet.</li>
                  </ul>
                </div>
                <div class="space-y-1.5 border-t border-muted pt-3">
                  <BlrLinks :workspace="workspace" :ids="promise.screenIds" kind="screen" label="Where" :max="3" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="promise.capabilityIds" kind="capability" label="Powered by" :max="3" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="promise.ruleIds" kind="rule" label="Held to" :max="3" interactive @select="inspect($event)" />
                </div>
              </div>
              <footer class="border-t border-muted px-5 py-2.5">
                <UButton color="neutral" variant="ghost" size="xs" trailing-icon="i-lucide-arrow-right" label="Read this promise" @click="openJourney(promise.id)" />
              </footer>
            </article>
          </div>

          <!-- Table view -->
          <div v-else class="mt-5 space-y-2">
            <div class="overflow-x-auto rounded-xl border border-default">
              <table class="w-full min-w-[56rem] text-sm">
                <thead>
                  <tr class="border-b border-default bg-elevated/40 text-start">
                    <th class="px-3 py-2 text-start text-xs font-medium text-dimmed">Promise</th>
                    <th class="px-3 py-2 text-start text-xs font-medium text-dimmed">Actors</th>
                    <th class="px-3 py-2 text-start text-xs font-medium text-dimmed">Contexts</th>
                    <th class="px-3 py-2 text-end text-xs font-medium text-dimmed">Scenarios</th>
                    <th class="px-3 py-2 text-end text-xs font-medium text-dimmed">Step depth</th>
                    <th class="px-3 py-2 text-end text-xs font-medium text-dimmed">Capabilities</th>
                    <th class="px-3 py-2 text-end text-xs font-medium text-dimmed">Screens</th>
                    <th class="px-3 py-2 text-end text-xs font-medium text-dimmed">Rules</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="promise in workspace.journeys" :key="promise.id" class="cursor-pointer border-b border-muted last:border-0 hover:bg-elevated/40" @click="openJourney(promise.id)">
                    <th scope="row" class="max-w-72 px-3 py-2.5 text-start align-top">
                      <span class="block text-sm font-medium text-highlighted">{{ promise.title }}</span>
                      <span class="block text-xs text-dimmed line-clamp-1">{{ firstSentence(promise.lead) }}</span>
                    </th>
                    <td class="px-3 py-2.5 align-top text-xs text-toned">{{ resolve(promise.actorIds).map(entity => entity.title).join(', ') || '—' }}</td>
                    <td class="px-3 py-2.5 align-top text-xs text-toned">{{ promise.availability.map(pairLabel).join(', ') || '—' }}</td>
                    <td class="px-3 py-2.5 text-end align-top font-mono text-xs text-toned tabular-nums" :title="resolve(promise.scenarioIds).map(entity => entity.title).join(', ')">{{ promise.scenarioIds.length }}</td>
                    <td class="px-3 py-2.5 text-end align-top font-mono text-xs text-toned tabular-nums">{{ promise.stepCount }}</td>
                    <td class="px-3 py-2.5 text-end align-top font-mono text-xs text-toned tabular-nums" :title="resolve(promise.capabilityIds).map(entity => entity.title).join(', ')">{{ promise.capabilityIds.length }}</td>
                    <td class="px-3 py-2.5 text-end align-top font-mono text-xs text-toned tabular-nums" :title="resolve(promise.screenIds).map(entity => entity.title).join(', ')">{{ promise.screenIds.length }}</td>
                    <td class="px-3 py-2.5 text-end align-top font-mono text-xs text-toned tabular-nums" :title="resolve(promise.ruleIds).map(entity => entity.title).join(', ')">{{ promise.ruleIds.length }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-xs text-dimmed">All figures are derived from authored relations; step depth sums the steps of each promise’s Scenarios. Hover a count for names.</p>
          </div>
        </section>
      </div>

      <!-- DOSSIER -->
      <div v-else class="flex h-full min-h-0 flex-col">
        <div class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-default py-2.5">
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="xs" label="All promises" @click="journeyId = null" />
          <span class="blr-journey-mark inline-flex min-w-0 items-center gap-2">
            <BlrKind kind="journey" :labelled="false" />
            <span class="truncate text-sm font-semibold tracking-tight text-highlighted">{{ journey.title }}</span>
          </span>
          <span class="font-mono text-[10px] text-dimmed tabular-nums">{{ journeyScenarios.length }} scenarios · {{ journey.stepCount }} steps</span>
          <div class="ms-auto inline-flex overflow-hidden rounded-md border border-default">
            <button type="button" class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs" :class="dossierTab === 'story' ? 'bg-elevated text-highlighted' : 'text-dimmed hover:text-toned'" @click="dossierTab = 'story'">
              <UIcon name="i-lucide-scroll-text" class="size-3.5" /> Story
            </button>
            <button type="button" class="inline-flex items-center gap-1.5 border-s border-default px-2.5 py-1 text-xs" :class="dossierTab === 'map' ? 'bg-elevated text-highlighted' : 'text-dimmed hover:text-toned'" @click="dossierTab = 'map'">
              <UIcon name="i-lucide-waypoints" class="size-3.5" /> Map
            </button>
          </div>
        </div>

        <!-- Story tab -->
        <div v-if="dossierTab === 'story'" class="blr-pane min-h-0 flex-1">
          <header class="space-y-3 border-b border-default py-5">
            <p class="font-mono text-[10px] tracking-[0.14em] text-dimmed uppercase">What we promise</p>
            <BlrProse :text="journey.lead" size="base" />
            <div v-if="journey.intent" class="space-y-1.5">
              <h4 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Why it matters</h4>
              <BlrProse :text="journey.intent" />
            </div>
            <div class="flex flex-wrap items-start gap-x-8 gap-y-3">
              <BlrAvail :pairs="journey.availability" :entry-points="journey.entryPoints" />
              <div class="space-y-2">
                <p class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Who it is for</p>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="actor in resolve(journey.actorIds)" :key="actor.id" type="button" class="inline-flex items-center gap-1.5 rounded-full border border-default bg-elevated/40 px-2.5 py-1 text-xs text-toned hover:border-accented hover:bg-elevated" @click="inspect(actor)">
                    <BlrKind kind="actor" :labelled="false" size="xs" />
                    {{ actor.title }}
                  </button>
                </div>
              </div>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-book-open" label="Full journey record" class="ms-auto self-start" @click="inspect(journey)" />
            </div>
          </header>

          <!-- Scenario storyline -->
          <section class="space-y-4 py-6">
            <h3 class="text-base font-semibold tracking-tight text-highlighted">How it plays out</h3>
            <p v-if="!journeyScenarios.length" class="text-sm text-dimmed italic">No Scenarios are authored for this Journey yet — the promise has no acceptance story.</p>
            <article v-for="(scenario, scenarioIndex) in journeyScenarios" :key="scenario.id" class="overflow-hidden rounded-xl border border-default bg-default">
              <header class="flex flex-wrap items-center gap-2 border-b border-muted px-4 py-2.5">
                <span class="font-mono text-[10px] text-dimmed tabular-nums uppercase">Scenario {{ scenarioIndex + 1 }}</span>
                <span class="inline-flex items-center gap-1.5 rounded-full border border-default px-2 py-0.5 text-[11px] text-toned">
                  <span class="size-1.5 rounded-full" :style="{ backgroundColor: `var(--blr-slot-${scenario.kindSlot})` }" />
                  {{ scenario.kindName }}
                </span>
                <h4 class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ scenario.title }}</h4>
                <span v-if="scenario.availability.length" class="hidden gap-1 sm:flex">
                  <span v-for="pair in scenario.availability" :key="pair.key" class="rounded-full border border-default px-2 py-0.5 text-[10px] text-dimmed">{{ pairLabel(pair) }}</span>
                </span>
                <span v-else class="hidden text-[10px] text-dimmed italic sm:inline">wherever the journey is available</span>
                <UButton icon="i-lucide-book-open" color="neutral" variant="ghost" size="xs" title="Open the full scenario" @click="inspect(scenario)" />
              </header>
              <div class="grid lg:grid-cols-[15rem_minmax(0,1fr)_17rem]">
                <div class="space-y-1.5 border-b border-muted bg-elevated/30 p-4 lg:border-b-0 lg:border-e">
                  <p class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">It begins when</p>
                  <BlrProse :text="scenario.trigger" />
                </div>
                <div class="space-y-3 border-b border-muted p-4 lg:border-b-0">
                  <p class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Step by step · {{ scenario.steps.length }}</p>
                  <ol class="space-y-1.5">
                    <li v-for="(step, stepIndex) in scenario.steps" :key="stepIndex" class="flex gap-2.5 text-sm leading-relaxed">
                      <span class="mt-0.5 w-5 shrink-0 text-end font-mono text-[11px] text-dimmed tabular-nums">{{ stepIndex + 1 }}</span>
                      <span class="text-toned">{{ step }}</span>
                    </li>
                  </ol>
                  <div v-if="scenario.decisionPoints.length" class="space-y-2">
                    <p class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Decisions on the way</p>
                    <div v-for="(point, pointIndex) in scenario.decisionPoints" :key="pointIndex" class="rounded-lg border border-dashed border-default p-3">
                      <p class="text-sm font-medium text-highlighted">{{ point.title }}</p>
                      <BlrProse :text="point.question" class="mt-1 text-dimmed" />
                      <ul class="mt-2 space-y-1.5">
                        <li v-for="(branch, branchIndex) in point.branches" :key="branchIndex" class="flex flex-wrap items-baseline gap-1.5 text-xs">
                          <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-toned">{{ branch.condition }}</span>
                          <UIcon name="i-lucide-arrow-right" class="size-3 self-center text-dimmed" />
                          <span class="text-dimmed">{{ branch.outcome }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div class="space-y-3 bg-elevated/30 p-4 lg:border-s lg:border-muted">
                  <div class="space-y-1.5">
                    <p class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">How it ends</p>
                    <BlrProse :text="scenario.outcome" />
                  </div>
                  <div v-if="scenario.edgeCases.length" class="space-y-1.5">
                    <p class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Even when · {{ scenario.edgeCases.length }}</p>
                    <ul class="list-disc space-y-1 ps-4 text-xs text-dimmed marker:text-dimmed">
                      <li v-for="(edge, edgeIndex) in scenario.edgeCases" :key="edgeIndex">{{ edge }}</li>
                    </ul>
                  </div>
                </div>
              </div>
              <footer v-if="scenario.screenIds.length || scenario.ruleIds.length" class="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-muted bg-elevated/20 px-4 py-2.5">
                <BlrLinks :workspace="workspace" :ids="scenario.screenIds" kind="screen" label="On screens" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="scenario.ruleIds" kind="rule" label="Held to" interactive @select="inspect($event)" />
              </footer>
            </article>
          </section>

          <!-- Journey-scoped Screen map -->
          <section class="space-y-3 border-t border-default py-6">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 class="text-base font-semibold tracking-tight text-highlighted">Where it happens</h3>
              <p class="text-xs text-dimmed">The Product surface with this promise’s {{ journey.screenIds.length }} Screens lifted; the rest stays for context.</p>
            </div>
            <div v-if="workspace.screens.length" class="h-80 overflow-hidden rounded-xl border border-default">
              <BlrFlowCanvas :nodes="dossierMap.nodes" :fit-padding="0.1" @select="inspect($event)" @focus="inspect($event)" />
            </div>
            <p v-else class="text-sm text-dimmed italic">No Screens are authored — this Product’s surface is not graphical, so the promise has no Screen map.</p>
          </section>

          <!-- Capabilities and Rules the promise relies on -->
          <section class="grid gap-6 border-t border-default py-6 lg:grid-cols-2">
            <div class="space-y-3">
              <h3 class="text-base font-semibold tracking-tight text-highlighted">What it relies on</h3>
              <p v-if="!dossierCapabilities.length" class="text-sm text-dimmed italic">No Capabilities are authored on this Journey.</p>
              <div v-for="capability in dossierCapabilities" :key="capability.id" class="rounded-lg border border-default p-3">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind kind="capability" :labelled="false" size="xs" />
                  <button type="button" class="text-sm font-medium text-highlighted hover:underline underline-offset-4" @click="inspect(capability)">{{ capability.title }}</button>
                  <button v-if="capability.domainId" type="button" class="ms-auto rounded-full border border-default px-2 py-0.5 text-[10px] text-dimmed hover:bg-elevated" @click="inspect(capability.domainId)">{{ titleOf(capability.domainId) }}</button>
                </div>
                <p class="mt-1.5 text-xs leading-relaxed text-dimmed">{{ firstSentence(capability.lead) }}</p>
              </div>
            </div>
            <div class="space-y-3">
              <h3 class="text-base font-semibold tracking-tight text-highlighted">What holds it to account</h3>
              <p v-if="!dossierRules.length" class="text-sm text-dimmed italic">No Business Rules reach this Journey.</p>
              <div v-for="reach in dossierRules" :key="reach.rule.id" class="rounded-lg border border-default p-3">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind kind="rule" :labelled="false" size="xs" />
                  <button type="button" class="text-sm font-medium text-highlighted hover:underline underline-offset-4" @click="inspect(reach.rule)">{{ reach.rule.title }}</button>
                  <UBadge v-if="reach.direct" color="primary" variant="subtle" size="sm">authored on the journey</UBadge>
                  <UBadge v-else color="neutral" variant="subtle" size="sm">derived via scenario</UBadge>
                </div>
                <p class="mt-1.5 text-xs leading-relaxed text-dimmed">{{ firstSentence(reach.rule.statement) }}</p>
                <p v-if="reach.viaScenarios.length" class="mt-1.5 text-[11px] text-dimmed">
                  Reaches this promise through
                  <template v-for="(scenario, viaIndex) in reach.viaScenarios" :key="scenario.id">
                    <button type="button" class="text-toned underline underline-offset-2 hover:text-highlighted" @click="inspect(scenario)">{{ scenario.title }}</button><span v-if="viaIndex < reach.viaScenarios.length - 1">, </span>
                  </template>
                </p>
              </div>
            </div>
          </section>
        </div>

        <!-- Map tab: the contextual topology, only here -->
        <div v-else class="min-h-0 flex-1">
          <BlrTopology :workspace="workspace" :focus-id="journey.id" @inspect="inspect($event)" />
        </div>
      </div>
    </div>

    <!-- ============================== SURFACE ============================== -->
    <div v-else-if="nav === 'surface'" class="flex min-h-0 flex-1 flex-col">
      <div class="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-default py-2.5">
        <span class="text-sm font-semibold tracking-tight text-highlighted">The visible surface</span>
        <span class="hidden text-xs text-dimmed sm:inline">Interfaces are columns; Experiences nest their Screens.</span>
        <span class="ms-auto font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">Promise overlay</span>
        <button v-for="promise in workspace.journeys" :key="promise.id" type="button" class="blr-overlay-chip" :class="surfaceOverlayId === promise.id && 'blr-overlay-chip--active'" @click="surfaceOverlayId = surfaceOverlayId === promise.id ? null : promise.id">
          {{ promise.title }}
        </button>
        <UButton v-if="surfaceOverlayId" icon="i-lucide-x" color="neutral" variant="ghost" size="xs" title="Clear the overlay" @click="surfaceOverlayId = null" />
      </div>
      <div v-if="workspace.interfaces.length" class="min-h-0 flex-1">
        <BlrFlowCanvas :nodes="surfaceMap.nodes" :fit-padding="0.12" @select="inspect($event)" @focus="inspect($event)" />
      </div>
      <p v-else class="p-6 text-sm text-dimmed italic">No Interfaces are authored, so the Product declares no visible surface to map.</p>
    </div>

    <!-- ============================== ABILITIES ============================== -->
    <div v-else-if="nav === 'abilities'" class="blr-pane min-h-0 flex-1">
      <section class="space-y-5 py-6">
        <div>
          <h2 class="text-lg font-semibold tracking-tight text-highlighted">What the Product can durably do</h2>
          <p class="mt-1 text-xs text-dimmed">Capabilities grouped by Domain; promise and Rule reach are derived from authored relations.</p>
        </div>
        <p v-if="!workspace.capabilities.length" class="text-sm text-dimmed italic">No Capabilities are authored in this model.</p>
        <div v-for="group in abilityGroups" :key="group.id || 'none'" class="space-y-3">
          <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <BlrKind v-if="group.id" kind="domain" :labelled="false" size="xs" />
            <button v-if="group.id" type="button" class="text-sm font-semibold text-highlighted hover:underline underline-offset-4" @click="inspect(group.id)">{{ group.title }}</button>
            <span v-else class="text-sm font-semibold text-highlighted">{{ group.title }}</span>
            <span v-if="group.lead" class="text-xs text-dimmed">{{ firstSentence(group.lead) }}</span>
          </div>
          <p v-if="!group.capabilities.length" class="text-xs text-dimmed italic">No Capabilities in this Domain yet.</p>
          <div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <article v-for="capability in group.capabilities" :key="capability.id" class="rounded-xl border border-default bg-default p-4">
              <div class="flex items-start gap-2">
                <BlrKind kind="capability" :labelled="false" size="xs" class="mt-1" />
                <button type="button" class="text-start text-sm font-semibold text-highlighted hover:underline underline-offset-4" @click="inspect(capability)">{{ capability.title }}</button>
              </div>
              <p class="mt-2 text-xs leading-relaxed text-dimmed line-clamp-3">{{ capability.lead }}</p>
              <div class="mt-3 space-y-1.5 border-t border-muted pt-3">
                <BlrLinks :workspace="workspace" :ids="capability.journeyIds" kind="journey" label="Serves promises" :max="3" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="capability.screenIds" kind="screen" label="Exposed on" :max="3" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="capability.ruleIds" kind="rule" label="Held to" :max="3" interactive @select="inspect($event)" />
                <div v-if="capability.availability.length" class="flex flex-wrap gap-1 pt-0.5">
                  <span v-for="pair in capability.availability" :key="pair.key" class="rounded-full border border-default px-2 py-0.5 text-[10px] text-dimmed">{{ pairLabel(pair) }}</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section v-for="matrix in matrices" :key="matrix.id" class="space-y-3 border-t border-default py-6">
        <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ matrix.question }}</h3>
        <p class="text-xs text-dimmed">{{ matrix.note }} Click a cell for the explanation.</p>
        <div class="overflow-x-auto rounded-xl border border-default">
          <table class="blr-matrix" :style="{ '--blr-matrix-accent': matrix.accent }">
            <thead>
              <tr>
                <th class="blr-matrix-corner">Capability</th>
                <th v-for="col in matrix.cols" :key="col.id" class="blr-matrix-col">
                  <button type="button" class="blr-col-label" :title="col.title" @click="inspect(col.id)">{{ col.title }}</button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in matrix.rows" :key="row.rowId">
                <th scope="row" class="blr-matrix-row">
                  <button type="button" class="hover:underline underline-offset-2" @click="inspect(row.rowId)">{{ row.title }}</button>
                </th>
                <td v-for="cell in row.cells" :key="cell.colId" class="p-0.5">
                  <button
                    type="button"
                    class="blr-cell"
                    :class="matrixCell && matrixCell.matrixId === matrix.id && matrixCell.rowId === row.rowId && matrixCell.colId === cell.colId && 'blr-cell--selected'"
                    :title="`${row.title} × ${titleOf(cell.colId)}`"
                    @click="pickCell(matrix.id, row.rowId, cell.colId)"
                  >
                    <span class="blr-dot" :class="`blr-dot--${cell.state}`" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="matrixExplanation && matrixCell?.matrixId === matrix.id" class="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-default bg-elevated/40 px-3 py-2">
          <p class="min-w-0 flex-1 text-xs leading-relaxed text-toned">{{ matrixExplanation.text }}</p>
          <UButton color="neutral" variant="outline" size="xs" :label="matrixExplanation.capability.title" @click="inspect(matrixExplanation.capability)" />
          <UButton color="neutral" variant="outline" size="xs" :label="matrixExplanation.other.title" @click="inspect(matrixExplanation.other)" />
        </div>
      </section>
      <p v-if="!matrices.length" class="border-t border-default py-6 text-sm text-dimmed italic">Matrices need both Capabilities and something to compare them against; this model does not have enough of either yet.</p>
    </div>

    <!-- ============================== CONSTRAINTS ============================== -->
    <div v-else-if="nav === 'constraints'" class="blr-pane min-h-0 flex-1">
      <section class="space-y-5 py-6">
        <div>
          <h2 class="text-lg font-semibold tracking-tight text-highlighted">What the Product holds itself to</h2>
          <p class="mt-1 text-xs text-dimmed">Each Rule with where it is authored and how far it reaches. Derived reach is labelled — it is inferred, never authored.</p>
        </div>
        <p v-if="!ruleImpacts.length" class="text-sm text-dimmed italic">No Business Rules are authored in this model.</p>
        <article v-for="impact in ruleImpacts" :key="impact.rule.id" class="rounded-xl border border-default bg-default p-5">
          <div class="flex flex-wrap items-center gap-2">
            <BlrKind kind="rule" :labelled="false" />
            <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ impact.rule.title }}</h3>
            <span class="ms-auto flex gap-1.5">
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-waypoints" label="Impact map" @click="inspectOnMap(impact.rule)" />
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-book-open" label="Open" @click="inspect(impact.rule)" />
            </span>
          </div>
          <div class="blr-rule-statement mt-3 rounded-lg bg-elevated/40 p-3">
            <BlrProse :text="impact.rule.statement" />
          </div>
          <div v-if="impact.rule.rationale" class="mt-3 space-y-1.5">
            <h4 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Why</h4>
            <BlrProse :text="impact.rule.rationale" class="text-dimmed" />
          </div>
          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <div class="space-y-1.5 rounded-lg border border-default p-3">
              <p class="font-mono text-[10px] tracking-[0.12em] text-toned uppercase">Directly constrains — authored</p>
              <BlrLinks :workspace="workspace" :ids="impact.rule.domainIds" kind="domain" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="impact.rule.capabilityIds" kind="capability" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="impact.rule.journeyIds" kind="journey" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="impact.rule.scenarioIds" kind="scenario" interactive @select="inspect($event)" />
              <p v-if="!impact.rule.domainIds.length && !impact.rule.capabilityIds.length && !impact.rule.journeyIds.length && !impact.rule.scenarioIds.length" class="text-xs text-dimmed italic">Attached to nothing directly.</p>
            </div>
            <div class="space-y-1.5 rounded-lg border border-dashed border-default p-3">
              <p class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Reach — derived</p>
              <BlrLinks :workspace="workspace" :ids="impact.derivedJourneys.map(item => item.id)" kind="journey" label="Promises via scenarios" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="impact.derivedCapabilities.map(item => item.id)" kind="capability" label="Capabilities via domain" interactive @select="inspect($event)" />
              <p v-if="!impact.derivedJourneys.length && !impact.derivedCapabilities.length" class="text-xs text-dimmed italic">No further reach beyond its direct attachments.</p>
            </div>
          </div>
          <div class="mt-4">
            <BlrAvail :pairs="impact.rule.availability" label="Scoped to" inherited-note="Not narrowed — applies wherever its subjects are available." />
          </div>
        </article>
      </section>
    </div>

    <!-- ============================== ACCESS ============================== -->
    <div v-else class="blr-pane min-h-0 flex-1">
      <section class="space-y-4 py-6">
        <div>
          <h2 class="text-lg font-semibold tracking-tight text-highlighted">Who the Product is for</h2>
          <p class="mt-1 text-xs text-dimmed">Actors, where they enter, and the promises they perform.</p>
        </div>
        <p v-if="!workspace.actors.length" class="text-sm text-dimmed italic">No Actors are authored in this model.</p>
        <div class="grid gap-4 md:grid-cols-2">
          <article v-for="actor in workspace.actors" :key="actor.id" class="rounded-xl border border-default bg-default p-4">
            <div class="flex flex-wrap items-center gap-2">
              <BlrKind kind="actor" :labelled="false" />
              <button type="button" class="text-sm font-semibold text-highlighted hover:underline underline-offset-4" @click="inspect(actor)">{{ actor.title }}</button>
              <UBadge color="neutral" variant="subtle" size="sm">{{ actor.actorKind }} · {{ actor.relationship }}</UBadge>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-dimmed">{{ firstSentence(actor.lead) }}</p>
            <div class="mt-3 space-y-1.5 border-t border-muted pt-3">
              <BlrLinks :workspace="workspace" :ids="actor.interfaceIds" kind="interface" label="Enters" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="actor.experienceIds" kind="experience" label="Within" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="actor.journeyIds" kind="journey" label="Performs" interactive @select="inspect($event)" />
            </div>
          </article>
        </div>
      </section>

      <section class="space-y-4 border-t border-default py-6">
        <div>
          <h2 class="text-lg font-semibold tracking-tight text-highlighted">Where they enter</h2>
          <p class="mt-1 text-xs text-dimmed">Each access context with the boundary it establishes and what is reachable inside it.</p>
        </div>
        <p v-if="!workspace.interfaces.length" class="text-sm text-dimmed italic">No Interfaces are authored in this model.</p>
        <article v-for="context in workspace.interfaces" :key="context.id" class="rounded-xl border border-default bg-default p-5">
          <div class="flex flex-wrap items-center gap-2">
            <BlrKind kind="interface" :labelled="false" />
            <button type="button" class="text-base font-semibold tracking-tight text-highlighted hover:underline underline-offset-4" @click="inspect(context)">{{ context.title }}</button>
            <span v-for="point in context.entryPoints" :key="`${point.interfaceId}-${point.path}`" class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-dimmed">{{ point.path }}</span>
          </div>
          <p class="mt-2 text-sm leading-relaxed text-toned">{{ firstSentence(context.lead) }}</p>
          <p class="mt-1.5 text-xs text-dimmed">
            <span class="font-mono text-[10px] tracking-[0.1em] uppercase">Boundary</span>
            {{ firstSentence(context.capabilityBoundary) }}
          </p>
          <div class="mt-3 space-y-1.5 border-t border-muted pt-3">
            <BlrLinks :workspace="workspace" :ids="context.actorIds" kind="actor" label="Who enters" interactive @select="inspect($event)" />
            <BlrLinks :workspace="workspace" :ids="context.screenIds" kind="screen" label="Screens here" interactive @select="inspect($event)" />
            <BlrLinks :workspace="workspace" :ids="context.capabilityIds" kind="capability" label="Abilities here" interactive @select="inspect($event)" />
            <BlrLinks :workspace="workspace" :ids="context.journeyIds" kind="journey" label="Promises kept here" interactive @select="inspect($event)" />
            <p v-if="!context.screenIds.length" class="text-xs text-dimmed italic">No Screens — this Interface is not a graphical surface, and that is a fact, not a gap.</p>
          </div>
          <div v-if="context.experienceIds.length" class="mt-4 space-y-3">
            <p class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Experiences inside</p>
            <div v-for="experience in resolve(context.experienceIds)" :key="experience.id" class="rounded-lg border border-default bg-elevated/30 p-4">
              <div class="flex flex-wrap items-center gap-2">
                <BlrKind kind="experience" :labelled="false" size="xs" />
                <button type="button" class="text-sm font-medium text-highlighted hover:underline underline-offset-4" @click="inspect(experience)">{{ experience.title }}</button>
                <UBadge v-if="experience.kind === 'experience'" :color="ACCESS_TONE[experience.accessMode] || 'neutral'" variant="subtle" size="sm">{{ experience.accessMode }}</UBadge>
              </div>
              <template v-if="experience.kind === 'experience'">
                <p class="mt-1.5 text-xs text-dimmed">{{ firstSentence(experience.capabilityBoundary) }}</p>
                <div class="mt-2.5 space-y-1.5">
                  <BlrLinks :workspace="workspace" :ids="experience.actorIds" kind="actor" label="Who enters" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="experience.screenIds" kind="screen" label="Screens here" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="experience.capabilityIds" kind="capability" label="Abilities here" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="experience.journeyIds" kind="journey" label="Promises kept here" interactive @select="inspect($event)" />
                </div>
              </template>
            </div>
          </div>
          <p v-else class="mt-3 text-xs text-dimmed italic">No Experiences — everything here is directly available through the Interface.</p>
        </article>
      </section>
    </div>

    <!-- ============================== INSPECTOR ============================== -->
    <Transition name="blr-slide">
      <aside v-if="inspectorEntity" class="absolute inset-y-0 end-0 z-30 flex w-[26rem] max-w-[94%] flex-col border-s border-default bg-default shadow-2xl">
        <header class="flex shrink-0 items-center gap-2 border-b border-default px-4 py-2.5">
          <BlrKind :kind="inspectorEntity.kind" />
          <span class="ms-auto flex items-center gap-1">
            <UButton icon="i-lucide-waypoints" color="neutral" :variant="inspectorMap ? 'solid' : 'outline'" size="xs" label="Map" title="Toggle this entity's neighbourhood map" @click="inspectorMap = !inspectorMap" />
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" title="Close" @click="inspect(null)" />
          </span>
        </header>
        <div v-if="!inspectorMap" class="blr-pane flex-1 p-4">
          <BlrEntityDetail :workspace="workspace" :entity="inspectorEntity" @select="inspect($event)" />
        </div>
        <div v-else class="min-h-0 flex-1">
          <BlrTopology :workspace="workspace" :focus-id="inspectorEntity.id" @inspect="inspect($event)" />
        </div>
      </aside>
    </Transition>
  </div>
</template>

<style scoped>
/*
  Categorical slots mirrored from reportPalette.ts so accents resolve outside
  the flow canvas too (BlrFlowCanvas only defines them under .blr-flow).
*/
.blr-promises {
  --blr-slot-0: #2a78d6; --blr-slot-1: #eb6834; --blr-slot-2: #1baf7a;
  --blr-slot-3: #eda100; --blr-slot-4: #e87ba4; --blr-slot-5: #008300;
  --blr-slot-6: #4a3aa7; --blr-slot-7: #e34948; --blr-slot-8: #746651;
}

.dark .blr-promises {
  --blr-slot-0: #3987e5; --blr-slot-1: #d95926; --blr-slot-2: #199e70;
  --blr-slot-3: #c98500; --blr-slot-4: #d55181; --blr-slot-5: #008300;
  --blr-slot-6: #9085e9; --blr-slot-7: #e66767; --blr-slot-8: #ab9d81;
}

.blr-nav-btn {
  display: inline-flex; align-items: center; gap: 0.375rem;
  border-bottom: 2px solid transparent; padding: 0.375rem 0.625rem;
  font-size: 0.75rem; color: var(--ui-text-dimmed);
  transition: color 0.15s ease, border-color 0.15s ease;
}

.blr-nav-btn:hover { color: var(--ui-text-toned); }
.blr-nav-btn--active { border-bottom-color: var(--blr-slot-6); color: var(--ui-text-highlighted); }

/* Promise cards carry the journey accent as a warm top seam. */
.blr-promise-card { border-top: 3px solid var(--blr-slot-6); transition: box-shadow 0.15s ease; }
.blr-promise-card:hover { box-shadow: 0 8px 24px color-mix(in srgb, var(--ui-text) 8%, transparent); }
.blr-journey-mark { border-bottom: 2px solid var(--blr-slot-6); padding-bottom: 0.125rem; }
.blr-rule-statement { border-inline-start: 2px solid var(--blr-slot-8); }

.blr-overlay-chip {
  border: 1px solid var(--ui-border); border-radius: 9999px; padding: 0.2rem 0.625rem;
  font-size: 0.6875rem; color: var(--ui-text-toned);
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.blr-overlay-chip:hover { background: var(--ui-bg-elevated); }

.blr-overlay-chip--active {
  border-color: var(--blr-slot-6);
  background: color-mix(in srgb, var(--blr-slot-6) 14%, transparent);
  color: var(--ui-text-highlighted);
}

/* Matrices: sticky row heads, rotated column heads, explainable cells. */
.blr-matrix { min-width: max-content; border-collapse: collapse; font-size: 0.75rem; }

.blr-matrix-corner {
  position: sticky; inset-inline-start: 0; z-index: 2; background: var(--ui-bg);
  padding: 0.375rem 0.75rem; text-align: start; vertical-align: bottom;
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--ui-text-dimmed);
}

.blr-matrix-col { padding: 0.375rem 0.125rem; vertical-align: bottom; }

.blr-col-label {
  display: inline-block; max-height: 9rem; overflow: hidden;
  writing-mode: vertical-rl; transform: rotate(180deg);
  white-space: nowrap; text-overflow: ellipsis;
  font-size: 11px; color: var(--ui-text-toned);
}

.blr-col-label:hover { color: var(--ui-text-highlighted); }

.blr-matrix-row {
  position: sticky; inset-inline-start: 0; z-index: 1; max-width: 16rem;
  background: var(--ui-bg); border-top: 1px solid var(--ui-border-muted);
  padding: 0.375rem 0.75rem; text-align: start; font-weight: 500;
  color: var(--ui-text-toned); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.blr-matrix tbody td { border-top: 1px solid var(--ui-border-muted); }

.blr-cell {
  display: flex; align-items: center; justify-content: center;
  width: 100%; min-width: 2rem; height: 2rem; border-radius: 4px;
}

.blr-cell:hover { background: var(--ui-bg-elevated); }
.blr-cell--selected { outline: 2px solid var(--ui-primary); outline-offset: -2px; }

.blr-dot { border-radius: 9999px; }
.blr-dot--direct { width: 0.65rem; height: 0.65rem; background: var(--blr-matrix-accent); }
.blr-dot--derived { width: 0.65rem; height: 0.65rem; border: 2px solid var(--blr-matrix-accent); background: transparent; }
.blr-dot--none { width: 0.375rem; height: 2px; border-radius: 1px; background: color-mix(in srgb, var(--ui-text-dimmed) 30%, transparent); }

/* Inspector slide-in. */
.blr-slide-enter-active,
.blr-slide-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }

.blr-slide-enter-from,
.blr-slide-leave-to { transform: translateX(100%); opacity: 0.5; }
</style>
