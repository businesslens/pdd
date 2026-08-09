<script setup lang="ts">
/**
 * Panorama — a wall of live view tiles, each expandable to the whole surface.
 *
 * IA: the home is a gallery wall. Every purpose-built view is a tile showing
 * its real shape with real data at reduced density; one click makes that view
 * the entire surface under a "Panorama / <view>" breadcrumb. Views: identity,
 * access contexts, the Screen map (journey overlay), the Journey browser
 * (cards ⇄ table ⇄ full detail with complete Scenarios), Capabilities by
 * Domain plus three named matrices, Business-rule impact (direct vs derived),
 * Scenario flow reading, and contextual topology behind an entity picker.
 * Selecting an entity anywhere opens the shared BlrInspector slideover with
 * its Detail and Map tabs. Tile state survives collapse.
 */
import type {
  ActorView,
  AnyEntityView,
  CapabilityView,
  DomainView,
  JourneyView,
  ReportEntityKind,
  ReportWorkspace,
  RuleView,
  ScenarioView
} from '../utils/reportWorkspace'
import { REPORT_ENTITY_KINDS, resolveEntities } from '../utils/reportWorkspace'
import { buildScreenMap } from '../utils/flowGraph'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

type TileId = 'product' | 'access' | 'surface' | 'promises' | 'capabilities' | 'rules' | 'flow' | 'topology'

const TILES: Record<TileId, { name: string, question: string, icon: string }> = {
  product: { name: 'The Product', question: 'What is this Product?', icon: 'i-lucide-package' },
  access: { name: 'Who gets in', question: 'How can an Actor access it?', icon: 'i-lucide-door-open' },
  surface: { name: 'The surface', question: 'What Screens exist in each Interface and Experience?', icon: 'i-lucide-monitor' },
  promises: { name: 'The promises', question: 'What Journeys does the Product support?', icon: 'i-lucide-heart-handshake' },
  capabilities: { name: 'What it can do', question: 'Which Capabilities support which promises, and where?', icon: 'i-lucide-zap' },
  rules: { name: 'What must hold', question: 'Which constraints govern the Product, and how far do they reach?', icon: 'i-lucide-scale' },
  flow: { name: 'One case at a time', question: 'How does one Scenario actually run?', icon: 'i-lucide-list-checks' },
  topology: { name: 'What connects here', question: 'What directly supports a chosen entity?', icon: 'i-lucide-waypoints' }
}

/** Wall order; spans live in the scoped grid CSS, keyed by tile id. */
const WALL: TileId[] = ['product', 'access', 'surface', 'promises', 'capabilities', 'rules', 'flow', 'topology']

const expanded = ref<TileId | null>(null)
const expandedMeta = computed(() => (expanded.value ? TILES[expanded.value] : null))

function expandTile(id: TileId) {
  expanded.value = id
}
/** Tile-body click: the topology tile keeps its picker interactive instead. */
function wallOpen(id: TileId) {
  if (id !== 'topology') expandTile(id)
}
function collapse() {
  expanded.value = null
}

/* Docked inspector — full entity content plus a local map. */
const inspectorEntity = ref<AnyEntityView | null>(null)
const inspectorTab = ref<'detail' | 'map'>('detail')

function openInspector(entity: AnyEntityView) {
  inspectorEntity.value = entity
}
function inspectId(entityId: string) {
  const entity = props.workspace.byId.get(entityId)
  if (entity) openInspector(entity)
}
function inspectFromWall(entity: AnyEntityView) {
  expanded.value = 'topology'
  openInspector(entity)
}

/* Identity. */
const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'info'> = {
  complete: 'success',
  partial: 'warning',
  draft: 'info'
}
const ACCESS_TONE: Record<string, 'success' | 'warning' | 'error'> = {
  public: 'success',
  authenticated: 'warning',
  restricted: 'error'
}

const kindFacts = computed(() => {
  const counts = props.workspace.counts
  const byKind: Partial<Record<ReportEntityKind, number>> = {
    actor: counts.actors,
    interface: counts.interfaces,
    experience: counts.experiences,
    screen: counts.screens,
    domain: counts.domains,
    capability: counts.capabilities,
    journey: counts.journeys,
    scenario: counts.scenarios,
    rule: counts.rules
  }
  return REPORT_ENTITY_KINDS.map(meta => ({ meta, count: byKind[meta.kind] ?? 0 }))
})

const depthFacts = computed(() => {
  const counts = props.workspace.counts
  return [
    { label: 'Authored steps', value: counts.steps },
    { label: 'Decision points', value: counts.decisionPoints },
    { label: 'Branches', value: counts.branches },
    { label: 'Edge cases', value: counts.edgeCases },
    { label: 'Screen states', value: counts.screenStates },
    { label: 'Entry points', value: counts.entryPoints },
    { label: 'References', value: counts.references },
    { label: 'Availability scopes', value: counts.availabilityPairs }
  ]
})

/* Access contexts. */
function actorContexts(actor: ActorView): AnyEntityView[] {
  return resolveEntities(props.workspace, [...actor.interfaceIds, ...actor.experienceIds])
}

/* Screen map. */
const overlayJourneyId = ref<string | null>(null)
const overlayJourney = computed<JourneyView | null>(() => {
  const entity = overlayJourneyId.value ? props.workspace.byId.get(overlayJourneyId.value) : null
  return entity?.kind === 'journey' ? entity : null
})
const overlayScreenIds = computed<ReadonlySet<string> | null>(() =>
  overlayJourney.value ? new Set(overlayJourney.value.screenIds) : null)
const homeSurface = computed(() => buildScreenMap(props.workspace))
const surfaceMap = computed(() => buildScreenMap(props.workspace, {
  emphasizeScreenIds: overlayScreenIds.value,
  selectedId: inspectorEntity.value?.id ?? null
}))

/* Journey browser. */
const journeyMode = ref<'cards' | 'table'>('cards')
const selectedJourneyId = ref<string | null>(null)
const journeyTab = ref<'scenarios' | 'map'>('scenarios')
const selectedJourney = computed<JourneyView | null>(() => {
  const entity = selectedJourneyId.value ? props.workspace.byId.get(selectedJourneyId.value) : null
  return entity?.kind === 'journey' ? entity : null
})
const journeyScenarios = computed<ScenarioView[]>(() =>
  selectedJourney.value ? props.workspace.scenariosByJourney.get(selectedJourney.value.id) ?? [] : [])

function openJourney(id: string) {
  selectedJourneyId.value = id
  journeyTab.value = 'scenarios'
}
function scenarioNames(journey: JourneyView): string {
  return (props.workspace.scenariosByJourney.get(journey.id) ?? []).map(item => item.title).join(' · ')
}
function titlesOf(ids: string[]): string {
  return resolveEntities(props.workspace, ids).map(entity => entity.title).join(', ')
}

/* Capability map and matrices. */
const domainGroups = computed(() => {
  const groups: Array<{ domain: DomainView | null, capabilities: CapabilityView[] }> = []
  for (const domain of props.workspace.domains) {
    groups.push({ domain, capabilities: props.workspace.capabilitiesByDomain.get(domain.id) ?? [] })
  }
  const loose = props.workspace.capabilitiesByDomain.get('') ?? []
  if (loose.length) groups.push({ domain: null, capabilities: loose })
  return groups
})
const matrixCapabilities = computed(() => domainGroups.value.flatMap(group => group.capabilities))

interface MatrixDef {
  id: string
  title: string
  question: string
  columns: AnyEntityView[]
  emptyNote: string
  related: (capability: CapabilityView, columnId: string) => boolean
  explain: (capability: CapabilityView, column: AnyEntityView, related: boolean) => string
}

const matrices = computed<MatrixDef[]>(() => [
  {
    id: 'journeys',
    title: 'Capabilities × Journeys',
    question: 'Which promises depend on each Capability?',
    columns: props.workspace.journeys,
    emptyNote: 'No Journeys authored — nothing depends on the Capabilities yet.',
    related: (capability, columnId) => capability.journeyIds.includes(columnId),
    explain: (capability, column, related) => related
      ? `“${column.title}” uses “${capability.title}” — the dependency is authored on the Journey’s Capability list.`
      : `“${column.title}” does not list “${capability.title}” among its Capabilities.`
  },
  {
    id: 'screens',
    title: 'Capabilities × Screens',
    question: 'Where is each Capability exposed?',
    columns: props.workspace.screens,
    emptyNote: 'This Product authors no Screens, so exposure has no surface to point at.',
    related: (capability, columnId) => capability.screenIds.includes(columnId),
    explain: (capability, column, related) => related
      ? `“${column.title}” exposes “${capability.title}” — the exposure is authored on the Screen.`
      : `“${column.title}” does not expose “${capability.title}”.`
  },
  {
    id: 'rules',
    title: 'Capabilities × Business rules',
    question: 'Which Rules constrain each Capability?',
    columns: props.workspace.rules,
    emptyNote: 'No Business rules authored — nothing constrains the Capabilities.',
    related: (capability, columnId) => capability.ruleIds.includes(columnId),
    explain: (capability, column, related) => related
      ? `“${column.title}” constrains “${capability.title}” — the constraint is authored on the Business rule.`
      : `“${column.title}” does not constrain “${capability.title}”.`
  }
])

const matrixCell = ref<{ matrixId: string, capabilityId: string, columnId: string } | null>(null)

function pickCell(matrixId: string, capabilityId: string, columnId: string) {
  const current = matrixCell.value
  matrixCell.value = current && current.matrixId === matrixId && current.capabilityId === capabilityId && current.columnId === columnId
    ? null
    : { matrixId, capabilityId, columnId }
}

const matrixExplanation = computed(() => {
  const cell = matrixCell.value
  if (!cell) return null
  const matrix = matrices.value.find(item => item.id === cell.matrixId)
  const capability = props.workspace.byId.get(cell.capabilityId)
  const column = props.workspace.byId.get(cell.columnId)
  if (!matrix || capability?.kind !== 'capability' || !column) return null
  const related = matrix.related(capability, column.id)
  return { matrixId: matrix.id, capability, column, related, text: matrix.explain(capability, column, related) }
})

/* Business-rule impact. */
const selectedRuleId = ref<string | null>(null)
const ruleTab = ref<'impact' | 'map'>('impact')
const activeRule = computed<RuleView | null>(() => {
  const picked = selectedRuleId.value ? props.workspace.byId.get(selectedRuleId.value) : null
  if (picked?.kind === 'rule') return picked
  return props.workspace.rules[0] ?? null
})
const ruleHasDirect = computed(() => {
  const rule = activeRule.value
  return Boolean(rule && (rule.domainIds.length || rule.capabilityIds.length || rule.journeyIds.length || rule.scenarioIds.length))
})
const ruleImpact = computed(() => {
  const rule = activeRule.value
  if (!rule) return null
  const directJourneys = new Set(rule.journeyIds)
  const journeys = new Set<string>()
  const screens = new Set<string>()
  const domains = new Set<string>()
  for (const capabilityId of rule.capabilityIds) {
    const capability = props.workspace.byId.get(capabilityId)
    if (capability?.kind !== 'capability') continue
    for (const id of capability.journeyIds) if (!directJourneys.has(id)) journeys.add(id)
    for (const id of capability.screenIds) screens.add(id)
    if (capability.domainId && !rule.domainIds.includes(capability.domainId)) domains.add(capability.domainId)
  }
  for (const scenarioId of rule.scenarioIds) {
    const scenario = props.workspace.byId.get(scenarioId)
    if (scenario?.kind !== 'scenario') continue
    if (scenario.scenarioType !== 'journey') {
      for (const id of scenario.screenIds) screens.add(id)
      continue
    }
    if (!directJourneys.has(scenario.journeyId)) journeys.add(scenario.journeyId)
    for (const id of scenario.screenIds) screens.add(id)
  }
  return { journeys: [...journeys], screens: [...screens], domains: [...domains] }
})

function selectRule(id: string) {
  selectedRuleId.value = id
  ruleTab.value = 'impact'
}

/* Scenario flow. */
const flowScenarioId = ref<string | null>(null)
const firstScenario = computed(() => props.workspace.scenarios[0] ?? null)
const activeScenario = computed<ScenarioView | null>(() => {
  const picked = flowScenarioId.value ? props.workspace.byId.get(flowScenarioId.value) : null
  if (picked?.kind === 'scenario') return picked
  return firstScenario.value
})
const flowGroups = computed(() => props.workspace.journeys
  .map(journey => ({ journey, scenarios: props.workspace.scenariosByJourney.get(journey.id) ?? [] }))
  .filter(group => group.scenarios.length))

/* Contextual topology behind an entity picker. */
function entitiesOfKind(kind: ReportEntityKind): AnyEntityView[] {
  const w = props.workspace
  switch (kind) {
    case 'actor': return w.actors
    case 'interface': return w.interfaces
    case 'experience': return w.experiences
    case 'screen': return w.screens
    case 'domain': return w.domains
    case 'capability': return w.capabilities
    case 'journey': return w.journeys
    case 'scenario': return w.scenarios
    case 'rule': return w.rules
    default: return []
  }
}
const topoKinds = computed(() => REPORT_ENTITY_KINDS.filter(meta => entitiesOfKind(meta.kind).length > 0))
const topoKind = ref<ReportEntityKind>(
  props.workspace.journeys.length
    ? 'journey'
    : REPORT_ENTITY_KINDS.find(meta => entitiesOfKind(meta.kind).length > 0)?.kind ?? 'journey'
)
const topoEntityId = ref<string | undefined>(undefined)
const topoOptions = computed(() => entitiesOfKind(topoKind.value))
const topoKindItems = computed(() => topoKinds.value.map(meta => ({ label: meta.plural, value: meta.kind })))
const topoEntityItems = computed(() => topoOptions.value.map(entity => ({ label: entity.title, value: entity.id })))
const topoEntity = computed<AnyEntityView | null>(() =>
  (topoEntityId.value ? props.workspace.byId.get(topoEntityId.value) : null) ?? null)

watch(topoKind, () => {
  topoEntityId.value = undefined
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- ============================== THE WALL ============================== -->
    <div v-if="!expanded" class="blr-pane flex-1 p-4 sm:p-6">
      <div class="pano-wall mx-auto max-w-[110rem]">
        <article
          v-for="tile in WALL"
          :key="tile"
          class="pano-tile rounded-xl border border-default bg-default transition hover:border-accented"
          :class="[`pano-tile--${tile}`, { 'cursor-pointer': tile !== 'topology' }]"
          :role="tile !== 'topology' ? 'button' : undefined"
          :tabindex="tile !== 'topology' ? 0 : undefined"
          @click="wallOpen(tile)"
          @keydown.enter="wallOpen(tile)"
        >
          <header class="flex items-center gap-2.5 border-b border-default px-4 py-3">
            <UIcon :name="TILES[tile].icon" class="size-4 shrink-0 text-dimmed" />
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-base font-semibold tracking-tight text-highlighted">{{ TILES[tile].name }}</h2>
              <p class="truncate text-sm text-muted">{{ TILES[tile].question }}</p>
            </div>
            <UButton icon="i-lucide-maximize-2" color="neutral" variant="ghost" size="xs" :aria-label="`Expand ${TILES[tile].name}`" @click.stop="expandTile(tile)" />
          </header>

          <!-- The Product -->
          <div v-if="tile === 'product'" class="flex-1 space-y-3 p-4">
            <div class="flex items-center gap-3">
              <img v-if="logoSrc" :src="logoSrc" alt="" class="size-9 shrink-0 rounded-md">
              <div class="min-w-0">
                <p class="truncate text-lg font-semibold tracking-tight text-highlighted">{{ workspace.identity.title }}</p>
                <p v-if="workspace.identity.categoryLabel" class="text-sm text-dimmed">{{ workspace.identity.categoryLabel }}</p>
              </div>
              <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm" class="ms-auto shrink-0">
                {{ workspace.coverage.status }}
              </UBadge>
            </div>
            <p class="text-sm leading-6 text-default">{{ firstSentence(workspace.identity.summary, 220) }}</p>
            <div class="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-muted pt-3">
              <BlrKind v-for="fact in kindFacts" :key="fact.meta.kind" :kind="fact.meta.kind" :count="fact.count" />
            </div>
          </div>

          <!-- Who gets in -->
          <div v-else-if="tile === 'access'" class="blr-pane flex-1 p-4">
            <ul v-if="workspace.actors.length" class="space-y-2.5">
              <li v-for="actor in workspace.actors" :key="actor.id">
                <div class="flex items-center gap-1.5">
                  <UIcon :name="actor.actorKind === 'system' ? 'i-lucide-cpu' : 'i-lucide-user-round'" class="size-3.5 shrink-0 text-dimmed" />
                  <span class="truncate text-sm font-medium text-highlighted">{{ actor.title }}</span>
                  <span class="shrink-0 text-xs text-dimmed">{{ actor.actorKind }} · {{ actor.relationship }}</span>
                </div>
                <div class="mt-1 flex flex-wrap gap-1 ps-5">
                  <UBadge v-for="context in actorContexts(actor)" :key="context.id" color="neutral" variant="outline" size="sm">{{ context.title }}</UBadge>
                  <span v-if="!actorContexts(actor).length" class="text-sm text-muted italic">No declared entry context</span>
                </div>
              </li>
            </ul>
            <p v-else class="text-sm text-muted italic">No Actors authored.</p>
          </div>

          <!-- The surface -->
          <div v-else-if="tile === 'surface'" class="relative min-h-[16rem] flex-1">
            <template v-if="workspace.interfaces.length">
              <BlrFlowCanvas :nodes="homeSurface.nodes" :show-controls="false" :fit-padding="0.06" :max-zoom="1" />
              <button type="button" class="absolute inset-0 z-10 cursor-pointer" aria-label="Expand the Screen map" @click="expandTile('surface')" />
            </template>
            <p v-else class="p-4 text-sm text-muted italic">No Interfaces authored — the Product declares no delivery surface.</p>
          </div>

          <!-- The promises -->
          <div v-else-if="tile === 'promises'" class="flex-1 space-y-2.5 overflow-hidden p-4">
            <div v-for="journey in workspace.journeys.slice(0, 3)" :key="journey.id" class="rounded-lg border border-default p-2.5">
              <div class="flex items-center gap-1.5">
                <BlrKind kind="journey" :labelled="false" />
                <span class="min-w-0 truncate text-sm font-medium text-highlighted">{{ journey.title }}</span>
                <span class="blr-meta ms-auto shrink-0">{{ journey.scenarioIds.length }} scenarios</span>
              </div>
              <p class="mt-1 text-sm leading-6 text-muted">{{ firstSentence(journey.lead, 110) }}</p>
            </div>
            <p v-if="workspace.journeys.length > 3" class="text-sm text-dimmed">+ {{ workspace.journeys.length - 3 }} more promises</p>
            <p v-else-if="!workspace.journeys.length" class="text-sm text-muted italic">No Journeys authored.</p>
          </div>

          <!-- What it can do -->
          <div v-else-if="tile === 'capabilities'" class="blr-pane flex-1 space-y-3 p-4">
            <div v-for="group in domainGroups" :key="group.domain?.id ?? 'none'">
              <p class="blr-field">{{ group.domain?.title ?? 'No Domain' }}</p>
              <div class="mt-1.5 flex flex-wrap gap-1">
                <UBadge v-for="capability in group.capabilities" :key="capability.id" color="neutral" variant="outline" size="sm">{{ capability.title }}</UBadge>
              </div>
            </div>
            <p v-if="!workspace.capabilities.length" class="text-sm text-muted italic">No Capabilities authored.</p>
          </div>

          <!-- What must hold -->
          <div v-else-if="tile === 'rules'" class="blr-pane flex-1 p-4">
            <ul v-if="workspace.rules.length" class="space-y-2">
              <li v-for="rule in workspace.rules" :key="rule.id" class="flex gap-2 text-sm leading-6 text-muted">
                <UIcon name="i-lucide-scale" class="mt-1 size-3.5 shrink-0 text-dimmed" />
                <span>{{ firstSentence(rule.statement, 120) }}</span>
              </li>
            </ul>
            <p v-else class="text-sm text-muted italic">No Business rules authored.</p>
          </div>

          <!-- One case at a time -->
          <div v-else-if="tile === 'flow' && firstScenario" class="flex-1 space-y-2 p-4">
            <div class="flex items-center gap-1.5">
              <BlrKind kind="scenario" :labelled="false" />
              <span class="min-w-0 truncate text-sm font-medium text-highlighted">{{ firstScenario.title }}</span>
              <UBadge color="neutral" variant="subtle" size="sm" class="ms-auto shrink-0">{{ firstScenario.kindName }}</UBadge>
            </div>
            <div class="space-y-1 text-sm leading-6 text-default">
              <div class="pano-lane-seg"><span class="blr-field mb-0.5 block">Trigger</span>{{ firstSentence(firstScenario.trigger, 90) }}</div>
              <div class="flex justify-center"><UIcon name="i-lucide-arrow-down" class="size-3 text-dimmed" /></div>
              <div class="pano-lane-seg"><span class="blr-field mb-0.5 block">Steps</span>{{ firstScenario.steps.length }} steps · {{ firstScenario.decisionPoints.length }} decisions</div>
              <div class="flex justify-center"><UIcon name="i-lucide-arrow-down" class="size-3 text-dimmed" /></div>
              <div class="pano-lane-seg"><span class="blr-field mb-0.5 block">Outcome</span>{{ firstSentence(firstScenario.outcome, 90) }}</div>
            </div>
          </div>
          <p v-else-if="tile === 'flow'" class="flex-1 p-4 text-sm text-muted italic">No Scenarios authored.</p>

          <!-- What connects here -->
          <div v-else-if="tile === 'topology'" class="flex min-h-0 flex-1 flex-col gap-2 p-3">
            <div class="flex gap-2">
              <USelect v-model="topoKind" :items="topoKindItems" size="sm" aria-label="Entity kind" class="shrink-0" />
              <USelect v-model="topoEntityId" :items="topoEntityItems" placeholder="Choose…" size="sm" aria-label="Entity" class="min-w-0 flex-1" />
            </div>
            <div v-if="topoEntity" class="min-h-[11rem] flex-1 overflow-hidden rounded-lg border border-muted">
              <BlrTopology :workspace="workspace" :focus-id="topoEntity.id" :explain="false" @inspect="inspectFromWall" />
            </div>
            <p v-else class="flex flex-1 items-center justify-center text-center text-sm text-muted italic">
              Topology is contextual — pick an entity to draw its neighbourhood.
            </p>
          </div>
        </article>
      </div>
    </div>

    <!-- ============================ EXPANDED TILE =========================== -->
    <template v-else>
      <div class="flex items-center gap-2 border-b border-default px-4 py-2.5">
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="xs" aria-label="Back to the wall" @click="collapse" />
        <button type="button" class="shrink-0 text-sm text-muted transition hover:text-default" @click="collapse">Panorama</button>
        <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0 text-dimmed" />
        <h2 class="shrink-0 text-xl font-semibold tracking-tight text-highlighted">{{ expandedMeta?.name }}</h2>
        <span class="hidden min-w-0 truncate text-sm text-muted lg:inline">{{ expandedMeta?.question }}</span>
        <UButton class="ms-auto" icon="i-lucide-minimize-2" color="neutral" variant="ghost" size="xs" aria-label="Collapse this view" @click="collapse" />
      </div>

      <div class="min-h-0 flex-1">
        <!-- The Product -->
        <div v-if="expanded === 'product'" class="blr-pane h-full">
          <div class="mx-auto max-w-4xl space-y-8 p-6">
            <header class="flex items-start gap-4">
              <img v-if="logoSrc" :src="logoSrc" alt="" class="size-12 shrink-0 rounded-lg">
              <div class="min-w-0 flex-1 space-y-1.5">
                <h1 class="text-2xl font-semibold tracking-tight text-highlighted">{{ workspace.identity.title }}</h1>
                <div class="flex flex-wrap items-center gap-2 text-sm text-dimmed">
                  <span v-if="workspace.identity.categoryLabel">{{ workspace.identity.categoryLabel }}</span>
                  <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">
                    coverage {{ workspace.coverage.status }}
                  </UBadge>
                  <UBadge v-for="tag in workspace.identity.tags" :key="tag" color="neutral" variant="outline" size="sm">{{ tag }}</UBadge>
                </div>
              </div>
            </header>
            <BlrProse :text="workspace.identity.summary" size="base" />
            <BlrProse :text="workspace.identity.description" />
            <section v-if="workspace.identity.intent" class="space-y-1.5">
              <h4 class="blr-field">Intent</h4>
              <BlrProse :text="workspace.identity.intent" />
            </section>

            <section class="space-y-3">
              <h4 class="text-base font-semibold tracking-tight text-highlighted">What the model contains</h4>
              <div class="flex flex-wrap gap-x-4 gap-y-2">
                <BlrKind v-for="fact in kindFacts" :key="fact.meta.kind" :kind="fact.meta.kind" :count="fact.count" />
              </div>
              <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div v-for="fact in depthFacts" :key="fact.label" class="rounded-xl border border-default bg-default p-3.5">
                  <p class="font-mono text-lg text-highlighted tabular-nums">{{ fact.value }}</p>
                  <p class="blr-field">{{ fact.label }}</p>
                </div>
              </div>
              <p class="text-sm text-dimmed">Depth figures are derived by counting the model, never authored.</p>
            </section>

            <section class="space-y-2">
              <h4 class="text-base font-semibold tracking-tight text-highlighted">Coverage</h4>
              <div class="space-y-3 rounded-xl border border-default bg-default p-4">
                <BlrProse v-if="workspace.coverage.rationale" :text="workspace.coverage.rationale" />
                <div v-if="workspace.coverage.method.length" class="space-y-1.5">
                  <h5 class="blr-field">Method</h5>
                  <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                    <li v-for="(item, index) in workspace.coverage.method" :key="index">{{ item }}</li>
                  </ul>
                </div>
                <div v-if="workspace.coverage.sourceAreas.length" class="space-y-1.5">
                  <h5 class="blr-field">Source areas</h5>
                  <div class="flex flex-wrap gap-1.5">
                    <UBadge v-for="area in workspace.coverage.sourceAreas" :key="area" color="neutral" variant="soft" size="sm" class="font-mono">{{ area }}</UBadge>
                  </div>
                </div>
                <div v-if="workspace.coverage.unmapped.length" class="space-y-1.5">
                  <h5 class="blr-field">Not yet mapped</h5>
                  <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                    <li v-for="(item, index) in workspace.coverage.unmapped" :key="index">{{ item }}</li>
                  </ul>
                </div>
                <div v-if="workspace.identity.limitations.length" class="space-y-1.5">
                  <h5 class="blr-field">Limitations</h5>
                  <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                    <li v-for="(item, index) in workspace.identity.limitations" :key="index">{{ item }}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section v-if="workspace.identity.supportingContent" class="space-y-1.5">
              <h4 class="blr-field">Supporting context</h4>
              <BlrProse :text="workspace.identity.supportingContent" />
            </section>

            <section v-if="workspace.identity.authors.length || workspace.identity.license" class="space-y-2">
              <h4 class="blr-field">Authors & license</h4>
              <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
                <template v-for="author in workspace.identity.authors" :key="author.name">
                  <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">{{ author.name }}</a>
                  <span v-else>{{ author.name }}</span>
                </template>
                <UBadge v-if="workspace.identity.license" color="neutral" variant="outline" size="sm">{{ workspace.identity.license }}</UBadge>
              </div>
            </section>

            <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />

            <footer class="blr-meta border-t border-muted pt-4 leading-relaxed">
              Generated by {{ workspace.identity.generator.name }} {{ workspace.identity.generator.version }}
              · schema {{ workspace.identity.schemaVersion }} · {{ workspace.identity.generatedAt }}
              · {{ workspace.identity.referenceProfile }} reference profile
              · {{ workspace.counts.references }} references across the model
            </footer>
          </div>
        </div>

        <!-- Who gets in -->
        <div v-else-if="expanded === 'access'" class="blr-pane h-full">
          <div class="mx-auto max-w-6xl space-y-8 p-6">
            <section class="space-y-3">
              <h3 class="text-base font-semibold tracking-tight text-highlighted">Interfaces — the delivery surfaces</h3>
              <p v-if="!workspace.interfaces.length" class="text-sm text-muted italic">No Interfaces authored.</p>
              <div v-else class="grid gap-4 lg:grid-cols-2">
                <article v-for="item in workspace.interfaces" :key="item.id" class="space-y-3 rounded-xl border border-default bg-default p-4">
                  <header class="flex items-center gap-2">
                    <BlrKind kind="interface" :labelled="false" />
                    <button type="button" class="min-w-0 truncate text-base font-semibold tracking-tight text-highlighted hover:text-primary" @click="openInspector(item)">
                      {{ item.title }}
                    </button>
                  </header>
                  <p class="text-sm leading-6 text-muted">{{ firstSentence(item.lead, 200) }}</p>
                  <div class="space-y-1">
                    <BlrLinks :workspace="workspace" :ids="item.actorIds" kind="actor" label="Who enters" interactive @select="openInspector" />
                    <p v-if="!item.actorIds.length" class="text-sm text-muted italic">No Actors declared.</p>
                  </div>
                  <BlrAvail :pairs="[]" :entry-points="item.entryPoints" label="Entry points" />
                  <div class="space-y-1">
                    <p class="blr-field">Capability boundary</p>
                    <BlrProse :text="item.capabilityBoundary" />
                  </div>
                  <div class="space-y-1.5 border-t border-muted pt-2.5">
                    <p class="blr-field">In scope here (derived)</p>
                    <BlrLinks :workspace="workspace" :ids="item.experienceIds" kind="experience" label="Experiences within" interactive @select="openInspector" />
                    <BlrLinks :workspace="workspace" :ids="item.screenIds" kind="screen" interactive @select="openInspector" />
                    <BlrLinks :workspace="workspace" :ids="item.capabilityIds" kind="capability" interactive @select="openInspector" />
                    <BlrLinks :workspace="workspace" :ids="item.journeyIds" kind="journey" interactive @select="openInspector" />
                  </div>
                </article>
              </div>
            </section>
            <section class="space-y-3">
              <h3 class="text-base font-semibold tracking-tight text-highlighted">Experiences — access contexts within an Interface</h3>
              <p v-if="!workspace.experiences.length" class="text-sm text-muted italic">
                This Product declares no Experiences — every availability scope is direct Interface availability.
              </p>
              <div v-else class="grid gap-4 lg:grid-cols-2">
                <article v-for="item in workspace.experiences" :key="item.id" class="space-y-3 rounded-xl border border-default bg-default p-4">
                  <header class="flex items-center gap-2">
                    <BlrKind kind="experience" :labelled="false" />
                    <button type="button" class="min-w-0 truncate text-base font-semibold tracking-tight text-highlighted hover:text-primary" @click="openInspector(item)">
                      {{ item.title }}
                    </button>
                    <UBadge :color="ACCESS_TONE[item.accessMode] || 'neutral'" variant="subtle" size="sm" class="ms-auto shrink-0">{{ item.accessMode }}</UBadge>
                  </header>
                  <p class="text-sm leading-6 text-muted">{{ firstSentence(item.lead, 200) }}</p>
                  <BlrLinks :workspace="workspace" :ids="item.interfaceIds" kind="interface" label="Within" interactive @select="openInspector" />
                  <div class="space-y-1">
                    <BlrLinks :workspace="workspace" :ids="item.actorIds" kind="actor" label="Who enters" interactive @select="openInspector" />
                    <p v-if="!item.actorIds.length" class="text-sm text-muted italic">No Actors declared.</p>
                  </div>
                  <BlrAvail :pairs="[]" :entry-points="item.entryPoints" label="Entry points" />
                  <div class="space-y-1">
                    <p class="blr-field">Capability boundary</p>
                    <BlrProse :text="item.capabilityBoundary" />
                  </div>
                  <div class="space-y-1.5 border-t border-muted pt-2.5">
                    <p class="blr-field">In scope here (derived)</p>
                    <BlrLinks :workspace="workspace" :ids="item.screenIds" kind="screen" interactive @select="openInspector" />
                    <BlrLinks :workspace="workspace" :ids="item.capabilityIds" kind="capability" interactive @select="openInspector" />
                    <BlrLinks :workspace="workspace" :ids="item.journeyIds" kind="journey" interactive @select="openInspector" />
                  </div>
                </article>
              </div>
            </section>
          </div>
        </div>

        <!-- The surface -->
        <div v-else-if="expanded === 'surface'" class="flex h-full min-h-0 flex-col">
          <div class="flex flex-wrap items-center gap-1.5 border-b border-default px-4 py-2">
            <span class="blr-field me-1">Journey overlay</span>
            <UButton
              label="Every Screen"
              :color="overlayJourneyId === null ? 'primary' : 'neutral'"
              :variant="overlayJourneyId === null ? 'soft' : 'outline'"
              size="xs"
              class="rounded-full"
              @click="overlayJourneyId = null"
            />
            <UButton
              v-for="journey in workspace.journeys"
              :key="journey.id"
              :label="journey.title"
              :color="overlayJourneyId === journey.id ? 'primary' : 'neutral'"
              :variant="overlayJourneyId === journey.id ? 'soft' : 'outline'"
              size="xs"
              class="rounded-full"
              @click="overlayJourneyId = overlayJourneyId === journey.id ? null : journey.id"
            />
            <span v-if="overlayJourney" class="ms-auto text-sm text-muted">
              {{ overlayScreenIds?.size ?? 0 }} of {{ workspace.screens.length }} Screens participate — participation, not navigation order.
            </span>
          </div>
          <div v-if="workspace.interfaces.length" class="min-h-0 flex-1">
            <BlrFlowCanvas :nodes="surfaceMap.nodes" @select="inspectId" @focus="inspectId" />
          </div>
          <div v-else class="flex flex-1 items-center justify-center p-6">
            <p class="text-sm text-muted italic">No Interfaces authored — the Product declares no delivery surface.</p>
          </div>
        </div>

        <!-- The promises -->
        <div v-else-if="expanded === 'promises'" class="blr-pane h-full">
          <div class="mx-auto max-w-6xl space-y-5 p-6">
            <!-- Journey detail -->
            <template v-if="selectedJourney">
              <div class="flex items-center gap-2">
                <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="xs" label="All promises" @click="selectedJourneyId = null" />
                <UButton class="ms-auto" icon="i-lucide-book-open" color="neutral" variant="outline" size="xs" label="Open full entity" @click="openInspector(selectedJourney)" />
              </div>
              <header class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind kind="journey" />
                  <code class="blr-meta rounded bg-muted px-1.5 py-0.5">{{ selectedJourney.id }}</code>
                </div>
                <h2 class="text-xl font-semibold tracking-tight text-highlighted">{{ selectedJourney.title }}</h2>
              </header>
              <BlrProse :text="selectedJourney.lead" />
              <section v-if="selectedJourney.intent" class="space-y-1.5">
                <h4 class="blr-field">Intent</h4>
                <BlrProse :text="selectedJourney.intent" />
              </section>
              <BlrAvail :pairs="selectedJourney.availability" :entry-points="selectedJourney.entryPoints" />
              <div class="space-y-1.5 rounded-xl border border-default bg-default p-4">
                <BlrLinks :workspace="workspace" :ids="selectedJourney.actorIds" kind="actor" interactive @select="openInspector" />
                <BlrLinks :workspace="workspace" :ids="selectedJourney.capabilityIds" kind="capability" interactive @select="openInspector" />
                <BlrLinks :workspace="workspace" :ids="selectedJourney.domainIds" kind="domain" label="Domains (derived)" interactive @select="openInspector" />
                <BlrLinks :workspace="workspace" :ids="selectedJourney.screenIds" kind="screen" interactive @select="openInspector" />
                <BlrLinks :workspace="workspace" :ids="selectedJourney.ruleIds" kind="rule" label="Constrained by" interactive @select="openInspector" />
              </div>
              <div class="border-b border-default pb-2">
                <UTabs
                  v-model="journeyTab"
                  :items="[
                    { value: 'scenarios', label: `Scenarios · ${journeyScenarios.length}`, icon: 'i-lucide-list-checks' },
                    { value: 'map', label: 'Map', icon: 'i-lucide-waypoints' }
                  ]"
                  :content="false"
                  color="neutral"
                  size="xs"
                />
              </div>
              <template v-if="journeyTab === 'scenarios'">
                <p v-if="!journeyScenarios.length" class="text-sm text-muted italic">No Scenarios authored for this Journey.</p>
                <!-- Complete acceptance contract per Scenario — BlrEntityDetail is the completeness guarantee. -->
                <article v-for="scenario in journeyScenarios" :key="scenario.id" class="rounded-xl border border-default bg-default p-4">
                  <BlrEntityDetail :workspace="workspace" :entity="scenario" @select="openInspector" />
                </article>
              </template>
              <div v-else class="h-[30rem] overflow-hidden rounded-lg border border-default">
                <BlrTopology :workspace="workspace" :focus-id="selectedJourney.id" @inspect="openInspector" />
              </div>
            </template>

            <!-- Journey browser: cards ⇄ table -->
            <template v-else>
              <div class="flex items-center gap-2">
                <UTabs
                  v-model="journeyMode"
                  :items="[
                    { value: 'cards', label: 'Cards', icon: 'i-lucide-layout-grid' },
                    { value: 'table', label: 'Table', icon: 'i-lucide-table-2' }
                  ]"
                  :content="false"
                  color="neutral"
                  size="xs"
                />
                <span class="blr-meta ms-auto">{{ workspace.journeys.length }} promises · {{ workspace.counts.scenarios }} Scenarios</span>
              </div>
              <p v-if="!workspace.journeys.length" class="text-sm text-muted italic">No Journeys authored.</p>

              <div v-else-if="journeyMode === 'cards'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <article
                  v-for="journey in workspace.journeys"
                  :key="journey.id"
                  class="cursor-pointer space-y-2.5 rounded-xl border border-default bg-default p-4 transition hover:border-accented"
                  role="button"
                  tabindex="0"
                  @click="openJourney(journey.id)"
                  @keydown.enter="openJourney(journey.id)"
                >
                  <header class="flex items-center gap-1.5">
                    <BlrKind kind="journey" :labelled="false" />
                    <span class="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-highlighted">{{ journey.title }}</span>
                    <UBadge color="neutral" variant="subtle" size="sm" class="shrink-0">{{ journey.scenarioIds.length }} scenarios</UBadge>
                  </header>
                  <p class="text-sm leading-6 text-muted">{{ firstSentence(journey.lead, 200) }}</p>
                  <BlrAvail :pairs="journey.availability" label="" />
                  <div class="space-y-1 border-t border-muted pt-2">
                    <BlrLinks :workspace="workspace" :ids="journey.actorIds" kind="actor" :max="3" />
                    <BlrLinks :workspace="workspace" :ids="journey.capabilityIds" kind="capability" :max="3" />
                    <BlrLinks :workspace="workspace" :ids="journey.screenIds" kind="screen" :max="3" />
                    <BlrLinks :workspace="workspace" :ids="journey.ruleIds" kind="rule" :max="2" />
                  </div>
                  <p v-if="scenarioNames(journey)" class="text-sm leading-6 text-dimmed">{{ scenarioNames(journey) }}</p>
                </article>
              </div>

              <template v-else>
                <div class="overflow-x-auto rounded-xl border border-default bg-default">
                  <table class="pano-table">
                    <thead>
                      <tr>
                        <th>Promise</th>
                        <th>Actors</th>
                        <th>Availability</th>
                        <th>Capabilities</th>
                        <th class="num">Screens</th>
                        <th class="num">Scenarios</th>
                        <th class="num">Rules</th>
                        <th class="num">Steps</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="journey in workspace.journeys" :key="journey.id" class="cursor-pointer transition hover:bg-elevated/50" @click="openJourney(journey.id)">
                        <th scope="row"><span class="text-highlighted">{{ journey.title }}</span></th>
                        <td>{{ titlesOf(journey.actorIds) }}</td>
                        <td>
                          <span v-for="pair in journey.availability" :key="pair.key" class="block whitespace-nowrap">
                            {{ pair.interfaceTitle }}{{ pair.experienceTitle ? ` ▸ ${pair.experienceTitle}` : '' }}
                          </span>
                        </td>
                        <td>{{ titlesOf(journey.capabilityIds) }}</td>
                        <td class="num">{{ journey.screenIds.length }}</td>
                        <td class="num">{{ journey.scenarioIds.length }}</td>
                        <td class="num">{{ journey.ruleIds.length }}</td>
                        <td class="num">{{ journey.stepCount }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p class="text-sm text-dimmed">Screen, Scenario and Rule figures are derived counts; step depth sums the authored steps of each Journey’s Scenarios.</p>
              </template>
            </template>
          </div>
        </div>

        <!-- What it can do -->
        <div v-else-if="expanded === 'capabilities'" class="blr-pane h-full">
          <div class="mx-auto max-w-6xl space-y-8 p-6">
            <section class="space-y-4">
              <h3 class="text-base font-semibold tracking-tight text-highlighted">Capabilities by Domain</h3>
              <p v-if="!workspace.capabilities.length" class="text-sm text-muted italic">No Capabilities authored.</p>
              <div v-for="group in domainGroups" :key="group.domain?.id ?? 'none'" class="space-y-2">
                <header class="flex flex-wrap items-baseline gap-2">
                  <BlrKind kind="domain" :labelled="false" />
                  <button v-if="group.domain" type="button" class="text-base font-semibold tracking-tight text-highlighted hover:text-primary" @click="openInspector(group.domain)">
                    {{ group.domain.title }}
                  </button>
                  <span v-else class="text-base font-semibold tracking-tight text-highlighted">No Domain</span>
                  <span v-if="group.domain" class="min-w-0 truncate text-sm text-muted">{{ firstSentence(group.domain.lead, 140) }}</span>
                </header>
                <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <article v-for="capability in group.capabilities" :key="capability.id" class="space-y-2 rounded-xl border border-default bg-default p-4">
                    <header class="flex items-center gap-1.5">
                      <BlrKind kind="capability" :labelled="false" />
                      <button type="button" class="min-w-0 flex-1 truncate text-start text-base font-semibold tracking-tight text-highlighted hover:text-primary" @click="openInspector(capability)">
                        {{ capability.title }}
                      </button>
                    </header>
                    <p class="text-sm leading-6 text-muted">{{ firstSentence(capability.lead, 170) }}</p>
                    <BlrAvail :pairs="capability.availability" label="" />
                    <div class="space-y-1 border-t border-muted pt-2">
                      <BlrLinks :workspace="workspace" :ids="capability.journeyIds" kind="journey" label="Used by (derived)" interactive @select="openInspector" />
                      <BlrLinks :workspace="workspace" :ids="capability.screenIds" kind="screen" label="Exposed on (derived)" interactive @select="openInspector" />
                      <BlrLinks :workspace="workspace" :ids="capability.ruleIds" kind="rule" label="Constrained by" interactive @select="openInspector" />
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <section v-for="matrix in matrices" :key="matrix.id" class="space-y-2">
              <header>
                <p class="blr-field">{{ matrix.title }}</p>
                <h3 class="mt-0.5 text-lg font-semibold tracking-tight text-highlighted">{{ matrix.question }}</h3>
              </header>
              <p v-if="!workspace.capabilities.length || !matrix.columns.length" class="text-sm text-muted italic">{{ matrix.emptyNote }}</p>
              <template v-else>
                <div class="overflow-x-auto rounded-xl border border-default bg-default">
                  <table class="pano-matrix">
                    <thead>
                      <tr>
                        <th class="pano-matrix-corner">Capability</th>
                        <th v-for="column in matrix.columns" :key="column.id" class="pano-matrix-col"><span>{{ column.title }}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="capability in matrixCapabilities" :key="capability.id">
                        <th scope="row" class="pano-matrix-row">{{ capability.title }}</th>
                        <td v-for="column in matrix.columns" :key="column.id" class="pano-matrix-cell">
                          <button
                            type="button"
                            class="pano-cell"
                            :class="{ 'pano-cell--picked': matrixCell && matrixCell.matrixId === matrix.id && matrixCell.capabilityId === capability.id && matrixCell.columnId === column.id }"
                            :aria-label="`${capability.title} × ${column.title}`"
                            @click="pickCell(matrix.id, capability.id, column.id)"
                          >
                            <span v-if="matrix.related(capability, column.id)" class="pano-dot" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="matrixExplanation && matrixExplanation.matrixId === matrix.id" class="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-default px-4 py-3">
                  <UIcon :name="matrixExplanation.related ? 'i-lucide-circle-check' : 'i-lucide-circle-slash'" class="size-4 shrink-0" :class="matrixExplanation.related ? 'text-primary' : 'text-dimmed'" />
                  <span class="min-w-0 flex-1 text-sm text-default">{{ matrixExplanation.text }}</span>
                  <UButton size="xs" color="neutral" variant="outline" :label="matrixExplanation.capability.title" @click="openInspector(matrixExplanation.capability)" />
                  <UButton size="xs" color="neutral" variant="outline" :label="matrixExplanation.column.title" @click="openInspector(matrixExplanation.column)" />
                </div>
              </template>
            </section>
          </div>
        </div>

        <!-- What must hold -->
        <div v-else-if="expanded === 'rules'" class="flex h-full min-h-0">
          <aside class="blr-pane w-72 shrink-0 space-y-1 border-e border-default p-2">
            <p v-if="!workspace.rules.length" class="p-2 text-sm text-muted italic">No Business rules authored.</p>
            <button
              v-for="rule in workspace.rules"
              :key="rule.id"
              type="button"
              class="w-full rounded-lg p-2.5 text-start transition hover:bg-elevated/60"
              :class="{ 'bg-elevated': activeRule?.id === rule.id }"
              @click="selectRule(rule.id)"
            >
              <span class="block text-sm font-medium text-highlighted">{{ rule.title }}</span>
              <span class="mt-0.5 block text-sm leading-6 text-muted">{{ firstSentence(rule.statement, 90) }}</span>
            </button>
          </aside>
          <div v-if="activeRule" class="blr-pane min-w-0 flex-1">
            <div class="mx-auto max-w-3xl space-y-5 p-6">
              <header class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind kind="rule" />
                  <code class="blr-meta rounded bg-muted px-1.5 py-0.5">{{ activeRule.id }}</code>
                  <UButton class="ms-auto" icon="i-lucide-book-open" color="neutral" variant="outline" size="xs" label="Open full entity" @click="openInspector(activeRule)" />
                </div>
                <h2 class="text-xl font-semibold tracking-tight text-highlighted">{{ activeRule.title }}</h2>
              </header>
              <div class="rounded-lg border-s-2 border-primary bg-default p-3.5">
                <BlrProse :text="activeRule.statement" />
              </div>
              <section v-if="activeRule.rationale" class="space-y-1.5">
                <h4 class="blr-field">Rationale</h4>
                <BlrProse :text="activeRule.rationale" />
              </section>
              <div class="border-b border-default pb-2">
                <UTabs
                  v-model="ruleTab"
                  :items="[
                    { value: 'impact', label: 'Impact', icon: 'i-lucide-radar' },
                    { value: 'map', label: 'Map', icon: 'i-lucide-waypoints' }
                  ]"
                  :content="false"
                  color="neutral"
                  size="xs"
                />
              </div>
              <template v-if="ruleTab === 'impact'">
                <section class="space-y-2 rounded-xl border border-default bg-default p-4">
                  <p class="blr-field flex items-center gap-1.5"><UIcon name="i-lucide-anchor" class="size-3" /> Directly attached — authored on the Rule</p>
                  <p v-if="!ruleHasDirect" class="text-sm text-muted italic">This Rule names no Domains, Capabilities, Journeys or Scenarios directly.</p>
                  <BlrLinks :workspace="workspace" :ids="activeRule.domainIds" kind="domain" interactive @select="openInspector" />
                  <BlrLinks :workspace="workspace" :ids="activeRule.capabilityIds" kind="capability" interactive @select="openInspector" />
                  <BlrLinks :workspace="workspace" :ids="activeRule.journeyIds" kind="journey" interactive @select="openInspector" />
                  <BlrLinks :workspace="workspace" :ids="activeRule.scenarioIds" kind="scenario" interactive @select="openInspector" />
                </section>
                <section v-if="ruleImpact" class="space-y-2 rounded-xl border border-dashed border-accented p-4">
                  <p class="blr-field flex items-center gap-1.5"><UIcon name="i-lucide-git-branch" class="size-3" /> Derived reach — through the constrained Capabilities and Scenarios</p>
                  <p v-if="!ruleImpact.journeys.length && !ruleImpact.screens.length && !ruleImpact.domains.length" class="text-sm text-muted italic">Nothing further is reached indirectly.</p>
                  <BlrLinks :workspace="workspace" :ids="ruleImpact.domains" kind="domain" label="Domains (derived)" interactive @select="openInspector" />
                  <BlrLinks :workspace="workspace" :ids="ruleImpact.journeys" kind="journey" label="Journeys (derived)" interactive @select="openInspector" />
                  <BlrLinks :workspace="workspace" :ids="ruleImpact.screens" kind="screen" label="Screens (derived)" interactive @select="openInspector" />
                </section>
                <BlrAvail :pairs="activeRule.availability" label="Scoped to" inherited-note="Not narrowed — the Rule holds in every availability scope." />
              </template>
              <div v-else class="h-[28rem] overflow-hidden rounded-lg border border-default">
                <BlrTopology :workspace="workspace" :focus-id="activeRule.id" @inspect="openInspector" />
              </div>
            </div>
          </div>
          <p v-else class="flex flex-1 items-center justify-center p-6 text-sm text-muted italic">No Business rules authored.</p>
        </div>

        <!-- One case at a time -->
        <div v-else-if="expanded === 'flow'" class="flex h-full min-h-0">
          <aside class="blr-pane w-72 shrink-0 border-e border-default p-2">
            <p v-if="!workspace.scenarios.length" class="p-2 text-sm text-muted italic">No Scenarios authored.</p>
            <div v-for="group in flowGroups" :key="group.journey.id" class="mb-2">
              <p class="blr-field px-2.5 pt-2 pb-1">{{ group.journey.title }}</p>
              <button
                v-for="scenario in group.scenarios"
                :key="scenario.id"
                type="button"
                class="w-full rounded-lg px-2.5 py-2 text-start transition hover:bg-elevated/60"
                :class="{ 'bg-elevated': activeScenario?.id === scenario.id }"
                @click="flowScenarioId = scenario.id"
              >
                <span class="block text-sm font-medium text-highlighted">{{ scenario.title }}</span>
                <span class="mt-0.5 block text-xs text-dimmed">{{ scenario.kindName }} · {{ scenario.steps.length }} steps</span>
              </button>
            </div>
          </aside>
          <div v-if="activeScenario" class="blr-pane min-w-0 flex-1">
            <div class="mx-auto max-w-6xl space-y-5 p-6">
              <header class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind kind="scenario" />
                  <UBadge color="neutral" variant="subtle" size="sm">{{ activeScenario.kindName }}</UBadge>
                  <code class="blr-meta rounded bg-muted px-1.5 py-0.5">{{ activeScenario.id }}</code>
                  <UButton class="ms-auto" icon="i-lucide-book-open" color="neutral" variant="outline" size="xs" label="Open full entity" @click="openInspector(activeScenario)" />
                </div>
                <h2 class="text-xl font-semibold tracking-tight text-highlighted">{{ activeScenario.title }}</h2>
                <p class="text-sm text-muted">
                  In journey
                  <button type="button" class="text-primary underline underline-offset-2" @click="inspectId(activeScenario.journeyId)">{{ activeScenario.journeyTitle }}</button>
                </p>
              </header>
              <div class="grid gap-4 lg:grid-cols-[1fr_1.6fr_1fr]">
                <section class="space-y-1.5 rounded-xl border border-default bg-default p-4">
                  <p class="blr-field flex items-center gap-1.5"><UIcon name="i-lucide-play" class="size-3" /> Trigger</p>
                  <BlrProse :text="activeScenario.trigger" />
                </section>
                <section class="space-y-3 rounded-xl border border-default bg-default p-4">
                  <p class="blr-field flex items-center gap-1.5"><UIcon name="i-lucide-list-ordered" class="size-3" /> Steps and decisions</p>
                  <ol class="space-y-1.5">
                    <li v-for="(step, index) in activeScenario.steps" :key="index" class="flex gap-3 text-sm leading-6">
                      <span class="blr-meta w-5 shrink-0 pt-0.5 text-end">{{ index + 1 }}</span>
                      <span class="text-default">{{ step }}</span>
                    </li>
                  </ol>
                  <div v-for="(point, pointIndex) in activeScenario.decisionPoints" :key="pointIndex" class="rounded-lg border border-dashed border-default p-3">
                    <p class="text-sm font-medium text-highlighted">{{ point.title }}</p>
                    <BlrProse :text="point.question" class="mt-1" />
                    <ul class="mt-2 space-y-1.5">
                      <li v-for="(branch, branchIndex) in point.branches" :key="branchIndex" class="flex flex-wrap items-baseline gap-1.5 text-xs">
                        <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-default">{{ branch.condition }}</span>
                        <UIcon name="i-lucide-arrow-right" class="size-3 self-center text-dimmed" />
                        <span class="text-dimmed">{{ branch.outcome }}</span>
                      </li>
                    </ul>
                  </div>
                </section>
                <section class="space-y-4">
                  <div class="space-y-1.5 rounded-xl border border-default bg-default p-4">
                    <p class="blr-field flex items-center gap-1.5"><UIcon name="i-lucide-flag" class="size-3" /> Outcome</p>
                    <BlrProse :text="activeScenario.outcome" />
                  </div>
                  <div v-if="activeScenario.edgeCases.length" class="space-y-1.5 rounded-xl border border-default bg-default p-4">
                    <p class="blr-field">Edge cases · {{ activeScenario.edgeCases.length }}</p>
                    <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                      <li v-for="(edge, edgeIndex) in activeScenario.edgeCases" :key="edgeIndex">{{ edge }}</li>
                    </ul>
                  </div>
                </section>
              </div>
              <div class="space-y-1.5 rounded-xl border border-default bg-default p-4">
                <BlrLinks :workspace="workspace" :ids="activeScenario.screenIds" kind="screen" label="On Screens" interactive @select="openInspector" />
                <BlrLinks :workspace="workspace" :ids="activeScenario.ruleIds" kind="rule" label="Constrained by" interactive @select="openInspector" />
                <BlrAvail :pairs="activeScenario.availability" />
              </div>
            </div>
          </div>
          <p v-else class="flex flex-1 items-center justify-center p-6 text-sm text-muted italic">No Scenarios authored.</p>
        </div>

        <!-- What connects here -->
        <div v-else-if="expanded === 'topology'" class="flex h-full min-h-0 flex-col">
          <div class="flex flex-wrap items-center gap-2 border-b border-default px-4 py-2">
            <span class="blr-field">Focus</span>
            <USelect v-model="topoKind" :items="topoKindItems" size="sm" aria-label="Entity kind" />
            <USelect v-model="topoEntityId" :items="topoEntityItems" placeholder="Choose…" size="sm" aria-label="Entity" class="max-w-72" />
            <span class="hidden text-sm text-dimmed sm:inline">Double-click a box to re-root; Expand widens the neighbourhood deliberately.</span>
          </div>
          <div v-if="topoEntity" class="min-h-0 flex-1">
            <BlrTopology :workspace="workspace" :focus-id="topoEntity.id" @inspect="openInspector" />
          </div>
          <div v-else class="flex flex-1 items-center justify-center p-6">
            <p class="text-sm text-muted italic">Topology is contextual — pick an entity above and the map shows what directly supports it.</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Inspector: the shared slideover every selection lands in -->
    <BlrInspector
      v-model:tab="inspectorTab"
      :workspace="workspace"
      :entity="inspectorEntity"
      @select="openInspector"
      @close="inspectorEntity = null"
    />
  </div>
</template>

<style scoped>
/* The wall: a composed grid — aligned gutters, deliberate spans per tile. */
.pano-wall {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-auto-flow: dense;
  gap: 1rem;
}

@media (min-width: 768px) {
  .pano-wall { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pano-tile--product, .pano-tile--surface { grid-column: span 2; }
}

@media (min-width: 1280px) {
  .pano-wall { grid-template-columns: repeat(6, minmax(0, 1fr)); grid-auto-rows: minmax(12rem, auto); }
  .pano-tile--product { grid-column: span 4; }
  .pano-tile--surface { grid-column: span 3; grid-row: span 2; }
  .pano-tile--promises, .pano-tile--capabilities { grid-column: span 3; }
  .pano-tile--access, .pano-tile--rules, .pano-tile--flow, .pano-tile--topology { grid-column: span 2; }
}

.pano-tile {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}

/* One quiet segment per beat of the miniature Scenario lane. */
.pano-lane-seg {
  border: 1px solid var(--ui-border-muted);
  border-radius: 0.5rem;
  padding: 0.4rem 0.6rem;
}

/* The matrices: row heads stay put while columns scroll. */
.pano-matrix { border-collapse: collapse; font-size: var(--text-xs); }

.pano-matrix-corner,
.pano-matrix-row {
  position: sticky;
  left: 0;
  z-index: 1;
  border-bottom: 1px solid var(--ui-border-muted);
  border-inline-end: 1px solid var(--ui-border);
  background: var(--ui-bg);
  padding: 0.45rem 0.75rem;
  text-align: start;
  font-weight: 500;
  color: var(--ui-text-toned);
  white-space: nowrap;
}

.pano-matrix-corner {
  vertical-align: bottom;
  color: var(--ui-text-muted);
}

.pano-matrix-col { border-bottom: 1px solid var(--ui-border); padding: 0.5rem 0.25rem; vertical-align: bottom; }

.pano-matrix-col span {
  display: inline-block;
  max-height: 8.5rem;
  overflow: hidden;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--ui-text-toned);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pano-matrix-cell { border-bottom: 1px solid var(--ui-border-muted); padding: 2px; text-align: center; }

.pano-cell {
  display: flex;
  width: 100%;
  min-width: 2rem;
  height: 1.9rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
}

.pano-cell:hover { background: var(--ui-bg-elevated); }
.pano-cell--picked { box-shadow: inset 0 0 0 1.5px var(--ui-primary); }
.pano-dot { width: 0.5rem; height: 0.5rem; border-radius: 9999px; background: var(--ui-primary); }

/* The comparison table. */
.pano-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }

.pano-table thead th {
  border-bottom: 1px solid var(--ui-border);
  background: color-mix(in srgb, var(--ui-bg-elevated) 50%, transparent);
  padding: 0.5rem 0.75rem;
  text-align: start;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--ui-text-muted);
  white-space: nowrap;
}

.pano-table tbody th,
.pano-table tbody td {
  border-bottom: 1px solid var(--ui-border-muted);
  padding: 0.55rem 0.75rem;
  text-align: start;
  vertical-align: top;
  color: var(--ui-text-muted);
}

.pano-table tbody tr:last-child th,
.pano-table tbody tr:last-child td { border-bottom: 0; }

.pano-table .num { text-align: end; }

/* Derived counts read as meta: mono, 12px floor, tabular. */
.pano-table tbody .num {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--ui-text-dimmed);
  font-variant-numeric: tabular-nums;
}
</style>
