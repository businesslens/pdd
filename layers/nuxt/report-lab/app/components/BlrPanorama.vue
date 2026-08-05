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
 * Selecting an entity in any expanded view docks a full BlrEntityDetail
 * inspector with a topology toggle. Tile state survives collapse.
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
const topoEntityId = ref<string | null>(null)
const topoOptions = computed(() => entitiesOfKind(topoKind.value))
const topoEntity = computed<AnyEntityView | null>(() =>
  (topoEntityId.value ? props.workspace.byId.get(topoEntityId.value) : null) ?? null)

watch(topoKind, () => {
  topoEntityId.value = null
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
          class="pano-tile"
          :class="[`pano-tile--${tile}`, { 'cursor-pointer': tile !== 'topology' }]"
          :role="tile !== 'topology' ? 'button' : undefined"
          :tabindex="tile !== 'topology' ? 0 : undefined"
          @click="wallOpen(tile)"
          @keydown.enter="wallOpen(tile)"
        >
          <header class="pano-head">
            <UIcon :name="TILES[tile].icon" class="pano-head-icon" />
            <div class="min-w-0 flex-1">
              <h2 class="pano-title">{{ TILES[tile].name }}</h2>
              <p class="pano-question">{{ TILES[tile].question }}</p>
            </div>
            <UButton icon="i-lucide-maximize-2" color="neutral" variant="ghost" size="xs" :aria-label="`Expand ${TILES[tile].name}`" @click.stop="expandTile(tile)" />
          </header>

          <!-- The Product -->
          <div v-if="tile === 'product'" class="flex-1 space-y-3 p-4">
            <div class="flex items-center gap-3">
              <img v-if="logoSrc" :src="logoSrc" alt="" class="size-9 shrink-0 rounded-md">
              <div class="min-w-0">
                <p class="truncate text-lg font-medium tracking-tight text-highlighted">{{ workspace.identity.title }}</p>
                <p v-if="workspace.identity.categoryLabel" class="text-[11px] text-dimmed">{{ workspace.identity.categoryLabel }}</p>
              </div>
              <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm" class="ms-auto shrink-0 uppercase">
                {{ workspace.coverage.status }}
              </UBadge>
            </div>
            <p class="text-sm leading-relaxed text-toned">{{ firstSentence(workspace.identity.summary, 220) }}</p>
            <div class="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-muted pt-3">
              <BlrKind v-for="fact in kindFacts" :key="fact.meta.kind" :kind="fact.meta.kind" :count="fact.count" size="xs" />
            </div>
          </div>

          <!-- Who gets in -->
          <div v-else-if="tile === 'access'" class="blr-pane flex-1 p-4">
            <ul v-if="workspace.actors.length" class="space-y-2.5">
              <li v-for="actor in workspace.actors" :key="actor.id">
                <div class="flex items-center gap-1.5">
                  <UIcon :name="actor.actorKind === 'system' ? 'i-lucide-cpu' : 'i-lucide-user-round'" class="size-3.5 shrink-0 text-dimmed" />
                  <span class="truncate text-xs font-medium text-highlighted">{{ actor.title }}</span>
                  <span class="shrink-0 text-[10px] text-dimmed">{{ actor.actorKind }} · {{ actor.relationship }}</span>
                </div>
                <div class="mt-1 flex flex-wrap gap-1 ps-5">
                  <span v-for="context in actorContexts(actor)" :key="context.id" class="pano-chip">{{ context.title }}</span>
                  <span v-if="!actorContexts(actor).length" class="pano-empty">No declared entry context</span>
                </div>
              </li>
            </ul>
            <p v-else class="pano-empty">No Actors authored.</p>
          </div>

          <!-- The surface -->
          <div v-else-if="tile === 'surface'" class="relative min-h-[16rem] flex-1">
            <template v-if="workspace.interfaces.length">
              <BlrFlowCanvas :nodes="homeSurface.nodes" :show-controls="false" :fit-padding="0.06" :max-zoom="1" />
              <button type="button" class="absolute inset-0 z-10 cursor-pointer" aria-label="Expand the Screen map" @click="expandTile('surface')" />
            </template>
            <p v-else class="pano-empty p-4">No Interfaces authored — the Product declares no delivery surface.</p>
          </div>

          <!-- The promises -->
          <div v-else-if="tile === 'promises'" class="flex-1 space-y-2.5 overflow-hidden p-4">
            <div v-for="journey in workspace.journeys.slice(0, 3)" :key="journey.id" class="rounded-lg border border-muted bg-elevated/40 p-2.5">
              <div class="flex items-center gap-1.5">
                <BlrKind kind="journey" :labelled="false" size="xs" />
                <span class="min-w-0 truncate text-xs font-medium text-highlighted">{{ journey.title }}</span>
                <span class="ms-auto shrink-0 font-mono text-[10px] text-dimmed tabular-nums">{{ journey.scenarioIds.length }} scenarios</span>
              </div>
              <p class="mt-1 text-[11px] leading-relaxed text-dimmed">{{ firstSentence(journey.lead, 110) }}</p>
            </div>
            <p v-if="workspace.journeys.length > 3" class="text-[11px] text-dimmed">+ {{ workspace.journeys.length - 3 }} more promises</p>
            <p v-else-if="!workspace.journeys.length" class="pano-empty">No Journeys authored.</p>
          </div>

          <!-- What it can do -->
          <div v-else-if="tile === 'capabilities'" class="blr-pane flex-1 space-y-3 p-4">
            <div v-for="group in domainGroups" :key="group.domain?.id ?? 'none'">
              <p class="pano-label">{{ group.domain?.title ?? 'No Domain' }}</p>
              <div class="mt-1.5 flex flex-wrap gap-1">
                <span v-for="capability in group.capabilities" :key="capability.id" class="pano-chip">{{ capability.title }}</span>
              </div>
            </div>
            <p v-if="!workspace.capabilities.length" class="pano-empty">No Capabilities authored.</p>
          </div>

          <!-- What must hold -->
          <div v-else-if="tile === 'rules'" class="blr-pane flex-1 p-4">
            <ul v-if="workspace.rules.length" class="space-y-2">
              <li v-for="rule in workspace.rules" :key="rule.id" class="flex gap-2 text-[11px] leading-relaxed text-dimmed">
                <UIcon name="i-lucide-scale" class="mt-0.5 size-3 shrink-0" />
                <span>{{ firstSentence(rule.statement, 120) }}</span>
              </li>
            </ul>
            <p v-else class="pano-empty">No Business rules authored.</p>
          </div>

          <!-- One case at a time -->
          <div v-else-if="tile === 'flow' && firstScenario" class="flex-1 space-y-2 p-4">
            <div class="flex items-center gap-1.5">
              <BlrKind kind="scenario" :labelled="false" size="xs" />
              <span class="min-w-0 truncate text-xs font-medium text-highlighted">{{ firstScenario.title }}</span>
              <UBadge color="neutral" variant="subtle" size="sm" class="ms-auto shrink-0">{{ firstScenario.kindName }}</UBadge>
            </div>
            <div class="space-y-1 text-[11px] leading-relaxed text-toned">
              <div class="pano-lane-seg"><span class="pano-label">Trigger</span>{{ firstSentence(firstScenario.trigger, 90) }}</div>
              <div class="flex justify-center"><UIcon name="i-lucide-arrow-down" class="size-3 text-dimmed" /></div>
              <div class="pano-lane-seg"><span class="pano-label">Steps</span>{{ firstScenario.steps.length }} steps · {{ firstScenario.decisionPoints.length }} decisions</div>
              <div class="flex justify-center"><UIcon name="i-lucide-arrow-down" class="size-3 text-dimmed" /></div>
              <div class="pano-lane-seg"><span class="pano-label">Outcome</span>{{ firstSentence(firstScenario.outcome, 90) }}</div>
            </div>
          </div>
          <p v-else-if="tile === 'flow'" class="pano-empty flex-1 p-4">No Scenarios authored.</p>

          <!-- What connects here -->
          <div v-else-if="tile === 'topology'" class="flex min-h-0 flex-1 flex-col gap-2 p-3">
            <div class="flex gap-2">
              <select v-model="topoKind" class="pano-select" aria-label="Entity kind">
                <option v-for="meta in topoKinds" :key="meta.kind" :value="meta.kind">{{ meta.plural }}</option>
              </select>
              <select v-model="topoEntityId" class="pano-select min-w-0 flex-1" aria-label="Entity">
                <option :value="null">Choose…</option>
                <option v-for="entity in topoOptions" :key="entity.id" :value="entity.id">{{ entity.title }}</option>
              </select>
            </div>
            <div v-if="topoEntity" class="min-h-[11rem] flex-1 overflow-hidden rounded-lg border border-muted">
              <BlrTopology :workspace="workspace" :focus-id="topoEntity.id" :explain="false" @inspect="inspectFromWall" />
            </div>
            <p v-else class="pano-empty flex flex-1 items-center justify-center text-center">
              Topology is contextual — pick an entity to draw its neighbourhood.
            </p>
          </div>
        </article>
      </div>
    </div>

    <!-- ============================ EXPANDED TILE =========================== -->
    <template v-else>
      <div class="flex items-center gap-2 border-b border-default px-4 py-2">
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="xs" aria-label="Back to the wall" @click="collapse" />
        <button type="button" class="shrink-0 text-xs text-dimmed transition hover:text-toned" @click="collapse">Panorama</button>
        <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0 text-dimmed" />
        <span class="shrink-0 text-xs font-medium text-highlighted">{{ expandedMeta?.name }}</span>
        <span class="hidden min-w-0 truncate text-[11px] text-dimmed lg:inline">— {{ expandedMeta?.question }}</span>
        <UButton class="ms-auto" icon="i-lucide-x" color="neutral" variant="ghost" size="xs" aria-label="Close this view" @click="collapse" />
      </div>

      <div class="relative min-h-0 flex-1">
        <!-- The Product -->
        <div v-if="expanded === 'product'" class="blr-pane h-full">
          <div class="mx-auto max-w-4xl space-y-8 p-6">
            <header class="flex items-start gap-4">
              <img v-if="logoSrc" :src="logoSrc" alt="" class="size-12 shrink-0 rounded-lg">
              <div class="min-w-0 flex-1 space-y-1.5">
                <h1 class="text-2xl tracking-tight text-highlighted">{{ workspace.identity.title }}</h1>
                <div class="flex flex-wrap items-center gap-2 text-xs text-dimmed">
                  <span v-if="workspace.identity.categoryLabel">{{ workspace.identity.categoryLabel }}</span>
                  <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm" class="uppercase">
                    coverage {{ workspace.coverage.status }}
                  </UBadge>
                  <span v-for="tag in workspace.identity.tags" :key="tag" class="pano-chip">#{{ tag }}</span>
                </div>
              </div>
            </header>
            <BlrProse :text="workspace.identity.summary" size="base" />
            <BlrProse :text="workspace.identity.description" />
            <section v-if="workspace.identity.intent" class="space-y-1.5">
              <h4 class="pano-label">Intent</h4>
              <BlrProse :text="workspace.identity.intent" />
            </section>

            <section class="space-y-3">
              <h4 class="pano-label">What the model contains</h4>
              <div class="flex flex-wrap gap-x-4 gap-y-2">
                <BlrKind v-for="fact in kindFacts" :key="fact.meta.kind" :kind="fact.meta.kind" :count="fact.count" />
              </div>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div v-for="fact in depthFacts" :key="fact.label" class="rounded-lg border border-muted bg-elevated/40 p-2.5">
                  <p class="font-mono text-lg text-highlighted tabular-nums">{{ fact.value }}</p>
                  <p class="text-[10px] tracking-[0.1em] text-dimmed uppercase">{{ fact.label }}</p>
                </div>
              </div>
              <p class="pano-empty">Depth figures are derived by counting the model, never authored.</p>
            </section>

            <section class="space-y-2">
              <h4 class="pano-label">Coverage</h4>
              <div class="space-y-3 rounded-lg border border-default p-4">
                <BlrProse v-if="workspace.coverage.rationale" :text="workspace.coverage.rationale" />
                <div v-if="workspace.coverage.method.length" class="space-y-1">
                  <h5 class="pano-label">Method</h5>
                  <ul class="list-disc space-y-1 ps-5 text-sm text-toned marker:text-dimmed">
                    <li v-for="(item, index) in workspace.coverage.method" :key="index">{{ item }}</li>
                  </ul>
                </div>
                <div v-if="workspace.coverage.sourceAreas.length" class="space-y-1">
                  <h5 class="pano-label">Source areas</h5>
                  <div class="flex flex-wrap gap-1.5">
                    <span v-for="area in workspace.coverage.sourceAreas" :key="area" class="pano-chip font-mono">{{ area }}</span>
                  </div>
                </div>
                <div v-if="workspace.coverage.unmapped.length" class="space-y-1">
                  <h5 class="pano-label">Not yet mapped</h5>
                  <ul class="list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed">
                    <li v-for="(item, index) in workspace.coverage.unmapped" :key="index">{{ item }}</li>
                  </ul>
                </div>
                <div v-if="workspace.identity.limitations.length" class="space-y-1">
                  <h5 class="pano-label">Limitations</h5>
                  <ul class="list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed">
                    <li v-for="(item, index) in workspace.identity.limitations" :key="index">{{ item }}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section v-if="workspace.identity.supportingContent" class="space-y-1.5">
              <h4 class="pano-label">Supporting context</h4>
              <BlrProse :text="workspace.identity.supportingContent" />
            </section>

            <section v-if="workspace.identity.authors.length || workspace.identity.license" class="space-y-2">
              <h4 class="pano-label">Authors & license</h4>
              <div class="flex flex-wrap items-center gap-2 text-xs text-toned">
                <template v-for="author in workspace.identity.authors" :key="author.name">
                  <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">{{ author.name }}</a>
                  <span v-else>{{ author.name }}</span>
                </template>
                <span v-if="workspace.identity.license" class="pano-chip">{{ workspace.identity.license }}</span>
              </div>
            </section>

            <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />

            <footer class="border-t border-muted pt-4 font-mono text-[11px] leading-relaxed text-dimmed">
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
              <h3 class="text-sm font-medium text-highlighted">Interfaces — the delivery surfaces</h3>
              <p v-if="!workspace.interfaces.length" class="pano-empty">No Interfaces authored.</p>
              <div v-else class="grid gap-4 lg:grid-cols-2">
                <article v-for="item in workspace.interfaces" :key="item.id" class="pano-card space-y-3">
                  <header class="flex items-center gap-2">
                    <BlrKind kind="interface" :labelled="false" />
                    <button type="button" class="min-w-0 truncate text-sm font-medium text-highlighted hover:text-primary" @click="openInspector(item)">
                      {{ item.title }}
                    </button>
                  </header>
                  <p class="text-xs leading-relaxed text-dimmed">{{ firstSentence(item.lead, 200) }}</p>
                  <div class="space-y-1">
                    <h5 class="pano-label">Who enters</h5>
                    <div class="flex flex-wrap gap-1">
                      <button v-for="actor in resolveEntities(workspace, item.actorIds)" :key="actor.id" type="button" class="pano-chip" @click="openInspector(actor)">{{ actor.title }}</button>
                      <span v-if="!item.actorIds.length" class="pano-empty">No Actors declared.</span>
                    </div>
                  </div>
                  <BlrAvail :pairs="[]" :entry-points="item.entryPoints" label="Entry points" />
                  <div class="space-y-1">
                    <h5 class="pano-label">Capability boundary</h5>
                    <BlrProse :text="item.capabilityBoundary" />
                  </div>
                  <div class="space-y-1.5 border-t border-muted pt-2.5">
                    <h5 class="pano-label">In scope here (derived)</h5>
                    <BlrLinks :workspace="workspace" :ids="item.experienceIds" kind="experience" label="Experiences within" interactive @select="openInspector" />
                    <BlrLinks :workspace="workspace" :ids="item.screenIds" kind="screen" interactive @select="openInspector" />
                    <BlrLinks :workspace="workspace" :ids="item.capabilityIds" kind="capability" interactive @select="openInspector" />
                    <BlrLinks :workspace="workspace" :ids="item.journeyIds" kind="journey" interactive @select="openInspector" />
                  </div>
                </article>
              </div>
            </section>
            <section class="space-y-3">
              <h3 class="text-sm font-medium text-highlighted">Experiences — access contexts within an Interface</h3>
              <p v-if="!workspace.experiences.length" class="pano-empty">
                This Product declares no Experiences — every availability scope is direct Interface availability.
              </p>
              <div v-else class="grid gap-4 lg:grid-cols-2">
                <article v-for="item in workspace.experiences" :key="item.id" class="pano-card space-y-3">
                  <header class="flex items-center gap-2">
                    <BlrKind kind="experience" :labelled="false" />
                    <button type="button" class="min-w-0 truncate text-sm font-medium text-highlighted hover:text-primary" @click="openInspector(item)">
                      {{ item.title }}
                    </button>
                    <UBadge :color="ACCESS_TONE[item.accessMode] || 'neutral'" variant="subtle" size="sm" class="ms-auto shrink-0">{{ item.accessMode }}</UBadge>
                  </header>
                  <p class="text-xs leading-relaxed text-dimmed">{{ firstSentence(item.lead, 200) }}</p>
                  <BlrLinks :workspace="workspace" :ids="item.interfaceIds" kind="interface" label="Within" interactive @select="openInspector" />
                  <div class="space-y-1">
                    <h5 class="pano-label">Who enters</h5>
                    <div class="flex flex-wrap gap-1">
                      <button v-for="actor in resolveEntities(workspace, item.actorIds)" :key="actor.id" type="button" class="pano-chip" @click="openInspector(actor)">{{ actor.title }}</button>
                      <span v-if="!item.actorIds.length" class="pano-empty">No Actors declared.</span>
                    </div>
                  </div>
                  <BlrAvail :pairs="[]" :entry-points="item.entryPoints" label="Entry points" />
                  <div class="space-y-1">
                    <h5 class="pano-label">Capability boundary</h5>
                    <BlrProse :text="item.capabilityBoundary" />
                  </div>
                  <div class="space-y-1.5 border-t border-muted pt-2.5">
                    <h5 class="pano-label">In scope here (derived)</h5>
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
            <span class="pano-label me-1">Journey overlay</span>
            <button type="button" class="pano-chip" :class="{ 'pano-chip--on': overlayJourneyId === null }" @click="overlayJourneyId = null">Every Screen</button>
            <button
              v-for="journey in workspace.journeys"
              :key="journey.id"
              type="button"
              class="pano-chip"
              :class="{ 'pano-chip--on': overlayJourneyId === journey.id }"
              @click="overlayJourneyId = overlayJourneyId === journey.id ? null : journey.id"
            >
              {{ journey.title }}
            </button>
            <span v-if="overlayJourney" class="ms-auto text-[11px] text-dimmed">
              {{ overlayScreenIds?.size ?? 0 }} of {{ workspace.screens.length }} Screens participate — participation, not navigation order.
            </span>
          </div>
          <div v-if="workspace.interfaces.length" class="min-h-0 flex-1">
            <BlrFlowCanvas :nodes="surfaceMap.nodes" @select="inspectId" @focus="inspectId" />
          </div>
          <div v-else class="flex flex-1 items-center justify-center p-6">
            <p class="pano-empty">No Interfaces authored — the Product declares no delivery surface.</p>
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
                  <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-dimmed">{{ selectedJourney.id }}</code>
                </div>
                <h2 class="text-xl tracking-tight text-highlighted">{{ selectedJourney.title }}</h2>
              </header>
              <BlrProse :text="selectedJourney.lead" />
              <section v-if="selectedJourney.intent" class="space-y-1.5">
                <h4 class="pano-label">Intent</h4>
                <BlrProse :text="selectedJourney.intent" />
              </section>
              <BlrAvail :pairs="selectedJourney.availability" :entry-points="selectedJourney.entryPoints" />
              <div class="space-y-1.5 rounded-lg border border-default p-3">
                <BlrLinks :workspace="workspace" :ids="selectedJourney.actorIds" kind="actor" interactive @select="openInspector" />
                <BlrLinks :workspace="workspace" :ids="selectedJourney.capabilityIds" kind="capability" interactive @select="openInspector" />
                <BlrLinks :workspace="workspace" :ids="selectedJourney.domainIds" kind="domain" label="Domains (derived)" interactive @select="openInspector" />
                <BlrLinks :workspace="workspace" :ids="selectedJourney.screenIds" kind="screen" interactive @select="openInspector" />
                <BlrLinks :workspace="workspace" :ids="selectedJourney.ruleIds" kind="rule" label="Constrained by" interactive @select="openInspector" />
              </div>
              <div class="flex items-center gap-2 border-b border-default pb-2">
                <UButton :variant="journeyTab === 'scenarios' ? 'soft' : 'ghost'" color="neutral" size="xs" :label="`Scenarios · ${journeyScenarios.length}`" @click="journeyTab = 'scenarios'" />
                <UButton :variant="journeyTab === 'map' ? 'soft' : 'ghost'" color="neutral" size="xs" label="Map" @click="journeyTab = 'map'" />
              </div>
              <template v-if="journeyTab === 'scenarios'">
                <p v-if="!journeyScenarios.length" class="pano-empty">No Scenarios authored for this Journey.</p>
                <!-- Complete acceptance contract per Scenario — BlrEntityDetail is the completeness guarantee. -->
                <article v-for="scenario in journeyScenarios" :key="scenario.id" class="pano-card">
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
                <UButton :variant="journeyMode === 'cards' ? 'soft' : 'ghost'" color="neutral" size="xs" icon="i-lucide-layout-grid" label="Cards" @click="journeyMode = 'cards'" />
                <UButton :variant="journeyMode === 'table' ? 'soft' : 'ghost'" color="neutral" size="xs" icon="i-lucide-table-2" label="Table" @click="journeyMode = 'table'" />
                <span class="ms-auto text-[11px] text-dimmed">{{ workspace.journeys.length }} promises · {{ workspace.counts.scenarios }} Scenarios</span>
              </div>
              <p v-if="!workspace.journeys.length" class="pano-empty">No Journeys authored.</p>

              <div v-else-if="journeyMode === 'cards'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <article
                  v-for="journey in workspace.journeys"
                  :key="journey.id"
                  class="pano-card cursor-pointer space-y-2.5 transition hover:border-accented"
                  role="button"
                  tabindex="0"
                  @click="openJourney(journey.id)"
                  @keydown.enter="openJourney(journey.id)"
                >
                  <header class="flex items-center gap-1.5">
                    <BlrKind kind="journey" :labelled="false" />
                    <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ journey.title }}</span>
                    <UBadge color="neutral" variant="subtle" size="sm" class="shrink-0">{{ journey.scenarioIds.length }} scenarios</UBadge>
                  </header>
                  <p class="text-xs leading-relaxed text-toned">{{ firstSentence(journey.lead, 200) }}</p>
                  <BlrAvail :pairs="journey.availability" label="" />
                  <div class="space-y-1 border-t border-muted pt-2">
                    <BlrLinks :workspace="workspace" :ids="journey.actorIds" kind="actor" :max="3" />
                    <BlrLinks :workspace="workspace" :ids="journey.capabilityIds" kind="capability" :max="3" />
                    <BlrLinks :workspace="workspace" :ids="journey.screenIds" kind="screen" :max="3" />
                    <BlrLinks :workspace="workspace" :ids="journey.ruleIds" kind="rule" :max="2" />
                  </div>
                  <p v-if="scenarioNames(journey)" class="text-[11px] leading-relaxed text-dimmed">{{ scenarioNames(journey) }}</p>
                </article>
              </div>

              <template v-else>
                <div class="overflow-x-auto rounded-lg border border-default">
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
                <p class="pano-empty">Screen, Scenario and Rule figures are derived counts; step depth sums the authored steps of each Journey’s Scenarios.</p>
              </template>
            </template>
          </div>
        </div>

        <!-- What it can do -->
        <div v-else-if="expanded === 'capabilities'" class="blr-pane h-full">
          <div class="mx-auto max-w-6xl space-y-8 p-6">
            <section class="space-y-4">
              <h3 class="text-sm font-medium text-highlighted">Capabilities by Domain</h3>
              <p v-if="!workspace.capabilities.length" class="pano-empty">No Capabilities authored.</p>
              <div v-for="group in domainGroups" :key="group.domain?.id ?? 'none'" class="space-y-2">
                <header class="flex flex-wrap items-baseline gap-2">
                  <BlrKind kind="domain" :labelled="false" />
                  <button v-if="group.domain" type="button" class="text-sm font-medium text-highlighted hover:text-primary" @click="openInspector(group.domain)">
                    {{ group.domain.title }}
                  </button>
                  <span v-else class="text-sm font-medium text-highlighted">No Domain</span>
                  <span v-if="group.domain" class="text-[11px] text-dimmed">{{ firstSentence(group.domain.lead, 140) }}</span>
                </header>
                <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <article v-for="capability in group.capabilities" :key="capability.id" class="pano-card space-y-2">
                    <header class="flex items-center gap-1.5">
                      <BlrKind kind="capability" :labelled="false" />
                      <button type="button" class="min-w-0 flex-1 truncate text-start text-sm font-medium text-highlighted hover:text-primary" @click="openInspector(capability)">
                        {{ capability.title }}
                      </button>
                    </header>
                    <p class="text-xs leading-relaxed text-toned">{{ firstSentence(capability.lead, 170) }}</p>
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
                <h3 class="text-sm font-medium text-highlighted">{{ matrix.question }}</h3>
                <p class="pano-label">{{ matrix.title }}</p>
              </header>
              <p v-if="!workspace.capabilities.length || !matrix.columns.length" class="pano-empty">{{ matrix.emptyNote }}</p>
              <template v-else>
                <div class="overflow-x-auto rounded-lg border border-default">
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
                <div v-if="matrixExplanation && matrixExplanation.matrixId === matrix.id" class="flex flex-wrap items-center gap-2 rounded-lg border border-default bg-elevated/40 px-3 py-2">
                  <UIcon :name="matrixExplanation.related ? 'i-lucide-circle-check' : 'i-lucide-circle-slash'" class="size-4 shrink-0" :class="matrixExplanation.related ? 'text-primary' : 'text-dimmed'" />
                  <span class="min-w-0 flex-1 text-xs text-toned">{{ matrixExplanation.text }}</span>
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
            <p v-if="!workspace.rules.length" class="pano-empty p-2">No Business rules authored.</p>
            <button
              v-for="rule in workspace.rules"
              :key="rule.id"
              type="button"
              class="w-full rounded-lg p-2.5 text-start transition hover:bg-elevated/60"
              :class="{ 'bg-elevated': activeRule?.id === rule.id }"
              @click="selectRule(rule.id)"
            >
              <span class="block text-xs font-medium text-highlighted">{{ rule.title }}</span>
              <span class="mt-0.5 block text-[11px] leading-relaxed text-dimmed">{{ firstSentence(rule.statement, 90) }}</span>
            </button>
          </aside>
          <div v-if="activeRule" class="blr-pane min-w-0 flex-1">
            <div class="mx-auto max-w-3xl space-y-5 p-6">
              <header class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind kind="rule" />
                  <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-dimmed">{{ activeRule.id }}</code>
                  <UButton class="ms-auto" icon="i-lucide-book-open" color="neutral" variant="outline" size="xs" label="Open full entity" @click="openInspector(activeRule)" />
                </div>
                <h2 class="text-xl tracking-tight text-highlighted">{{ activeRule.title }}</h2>
              </header>
              <div class="rounded-lg border-s-2 border-primary bg-elevated/40 p-3">
                <BlrProse :text="activeRule.statement" />
              </div>
              <section v-if="activeRule.rationale" class="space-y-1.5">
                <h4 class="pano-label">Rationale</h4>
                <BlrProse :text="activeRule.rationale" />
              </section>
              <div class="flex items-center gap-2 border-b border-default pb-2">
                <UButton :variant="ruleTab === 'impact' ? 'soft' : 'ghost'" color="neutral" size="xs" label="Impact" @click="ruleTab = 'impact'" />
                <UButton :variant="ruleTab === 'map' ? 'soft' : 'ghost'" color="neutral" size="xs" label="Map" @click="ruleTab = 'map'" />
              </div>
              <template v-if="ruleTab === 'impact'">
                <section class="space-y-2 rounded-lg border border-default p-4">
                  <h4 class="pano-label flex items-center gap-1.5"><UIcon name="i-lucide-anchor" class="size-3" /> Directly attached — authored on the Rule</h4>
                  <p v-if="!ruleHasDirect" class="pano-empty">This Rule names no Domains, Capabilities, Journeys or Scenarios directly.</p>
                  <BlrLinks :workspace="workspace" :ids="activeRule.domainIds" kind="domain" interactive @select="openInspector" />
                  <BlrLinks :workspace="workspace" :ids="activeRule.capabilityIds" kind="capability" interactive @select="openInspector" />
                  <BlrLinks :workspace="workspace" :ids="activeRule.journeyIds" kind="journey" interactive @select="openInspector" />
                  <BlrLinks :workspace="workspace" :ids="activeRule.scenarioIds" kind="scenario" interactive @select="openInspector" />
                </section>
                <section v-if="ruleImpact" class="space-y-2 rounded-lg border border-dashed border-default p-4">
                  <h4 class="pano-label flex items-center gap-1.5"><UIcon name="i-lucide-git-branch" class="size-3" /> Derived reach — through the constrained Capabilities and Scenarios</h4>
                  <p v-if="!ruleImpact.journeys.length && !ruleImpact.screens.length && !ruleImpact.domains.length" class="pano-empty">Nothing further is reached indirectly.</p>
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
          <p v-else class="pano-empty flex flex-1 items-center justify-center p-6">No Business rules authored.</p>
        </div>

        <!-- One case at a time -->
        <div v-else-if="expanded === 'flow'" class="flex h-full min-h-0">
          <aside class="blr-pane w-72 shrink-0 border-e border-default p-2">
            <p v-if="!workspace.scenarios.length" class="pano-empty p-2">No Scenarios authored.</p>
            <div v-for="group in flowGroups" :key="group.journey.id" class="mb-2">
              <p class="px-2.5 pt-2 pb-1 font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">{{ group.journey.title }}</p>
              <button
                v-for="scenario in group.scenarios"
                :key="scenario.id"
                type="button"
                class="w-full rounded-lg px-2.5 py-2 text-start transition hover:bg-elevated/60"
                :class="{ 'bg-elevated': activeScenario?.id === scenario.id }"
                @click="flowScenarioId = scenario.id"
              >
                <span class="block text-xs font-medium text-highlighted">{{ scenario.title }}</span>
                <span class="mt-0.5 block text-[10px] text-dimmed">{{ scenario.kindName }} · {{ scenario.steps.length }} steps</span>
              </button>
            </div>
          </aside>
          <div v-if="activeScenario" class="blr-pane min-w-0 flex-1">
            <div class="mx-auto max-w-6xl space-y-5 p-6">
              <header class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind kind="scenario" />
                  <UBadge color="neutral" variant="subtle" size="sm">{{ activeScenario.kindName }}</UBadge>
                  <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-dimmed">{{ activeScenario.id }}</code>
                  <UButton class="ms-auto" icon="i-lucide-book-open" color="neutral" variant="outline" size="xs" label="Open full entity" @click="openInspector(activeScenario)" />
                </div>
                <h2 class="text-xl tracking-tight text-highlighted">{{ activeScenario.title }}</h2>
                <p class="text-xs text-dimmed">
                  In journey
                  <button type="button" class="text-primary underline underline-offset-2" @click="inspectId(activeScenario.journeyId)">{{ activeScenario.journeyTitle }}</button>
                </p>
              </header>
              <div class="grid gap-4 lg:grid-cols-[1fr_1.6fr_1fr]">
                <section class="pano-card space-y-1.5">
                  <h4 class="pano-label flex items-center gap-1.5"><UIcon name="i-lucide-play" class="size-3" /> Trigger</h4>
                  <BlrProse :text="activeScenario.trigger" />
                </section>
                <section class="pano-card space-y-3">
                  <h4 class="pano-label flex items-center gap-1.5"><UIcon name="i-lucide-list-ordered" class="size-3" /> Steps and decisions</h4>
                  <ol class="space-y-1.5">
                    <li v-for="(step, index) in activeScenario.steps" :key="index" class="flex gap-3 text-sm leading-relaxed">
                      <span class="mt-0.5 w-5 shrink-0 text-end font-mono text-[11px] text-dimmed tabular-nums">{{ index + 1 }}</span>
                      <span class="text-toned">{{ step }}</span>
                    </li>
                  </ol>
                  <div v-for="(point, pointIndex) in activeScenario.decisionPoints" :key="pointIndex" class="rounded-lg border border-dashed border-default p-3">
                    <p class="text-sm font-medium text-highlighted">{{ point.title }}</p>
                    <BlrProse :text="point.question" class="mt-1" />
                    <ul class="mt-2 space-y-1.5">
                      <li v-for="(branch, branchIndex) in point.branches" :key="branchIndex" class="flex flex-wrap items-baseline gap-1.5 text-xs">
                        <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-toned">{{ branch.condition }}</span>
                        <UIcon name="i-lucide-arrow-right" class="size-3 self-center text-dimmed" />
                        <span class="text-dimmed">{{ branch.outcome }}</span>
                      </li>
                    </ul>
                  </div>
                </section>
                <section class="space-y-4">
                  <div class="pano-card space-y-1.5">
                    <h4 class="pano-label flex items-center gap-1.5"><UIcon name="i-lucide-flag" class="size-3" /> Outcome</h4>
                    <BlrProse :text="activeScenario.outcome" />
                  </div>
                  <div v-if="activeScenario.edgeCases.length" class="pano-card space-y-1.5">
                    <h4 class="pano-label">Edge cases · {{ activeScenario.edgeCases.length }}</h4>
                    <ul class="list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed">
                      <li v-for="(edge, edgeIndex) in activeScenario.edgeCases" :key="edgeIndex">{{ edge }}</li>
                    </ul>
                  </div>
                </section>
              </div>
              <div class="space-y-1.5 rounded-lg border border-default p-3">
                <BlrLinks :workspace="workspace" :ids="activeScenario.screenIds" kind="screen" label="On Screens" interactive @select="openInspector" />
                <BlrLinks :workspace="workspace" :ids="activeScenario.ruleIds" kind="rule" label="Constrained by" interactive @select="openInspector" />
                <BlrAvail :pairs="activeScenario.availability" inherited-note="Applies to every pair its Journey declares." />
              </div>
            </div>
          </div>
          <p v-else class="pano-empty flex flex-1 items-center justify-center p-6">No Scenarios authored.</p>
        </div>

        <!-- What connects here -->
        <div v-else-if="expanded === 'topology'" class="flex h-full min-h-0 flex-col">
          <div class="flex flex-wrap items-center gap-2 border-b border-default px-4 py-2">
            <span class="pano-label">Focus</span>
            <select v-model="topoKind" class="pano-select" aria-label="Entity kind">
              <option v-for="meta in topoKinds" :key="meta.kind" :value="meta.kind">{{ meta.plural }}</option>
            </select>
            <select v-model="topoEntityId" class="pano-select max-w-72" aria-label="Entity">
              <option :value="null">Choose…</option>
              <option v-for="entity in topoOptions" :key="entity.id" :value="entity.id">{{ entity.title }}</option>
            </select>
            <span class="hidden text-[11px] text-dimmed sm:inline">Double-click a box to re-root; Expand widens the neighbourhood deliberately.</span>
          </div>
          <div v-if="topoEntity" class="min-h-0 flex-1">
            <BlrTopology :workspace="workspace" :focus-id="topoEntity.id" @inspect="openInspector" />
          </div>
          <div v-else class="flex flex-1 items-center justify-center p-6">
            <p class="pano-empty">Topology is contextual — pick an entity above and the map shows what directly supports it.</p>
          </div>
        </div>

        <!-- Docked inspector -->
        <aside v-if="inspectorEntity" class="absolute inset-y-0 end-0 z-30 flex w-full max-w-md flex-col border-s border-default bg-default shadow-2xl">
          <header class="flex items-center gap-2 border-b border-default px-4 py-2.5">
            <BlrKind :kind="inspectorEntity.kind" :labelled="false" />
            <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ inspectorEntity.title }}</span>
            <UButton :variant="inspectorTab === 'detail' ? 'soft' : 'ghost'" color="neutral" size="xs" label="Detail" @click="inspectorTab = 'detail'" />
            <UButton :variant="inspectorTab === 'map' ? 'soft' : 'ghost'" color="neutral" size="xs" label="Map" @click="inspectorTab = 'map'" />
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" aria-label="Close inspector" @click="inspectorEntity = null" />
          </header>
          <div v-if="inspectorTab === 'detail'" class="blr-pane flex-1 p-4">
            <BlrEntityDetail :workspace="workspace" :entity="inspectorEntity" @select="openInspector" />
          </div>
          <div v-else class="min-h-0 flex-1">
            <BlrTopology :workspace="workspace" :focus-id="inspectorEntity.id" direction="TB" @inspect="openInspector" />
          </div>
        </aside>
      </div>
    </template>
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
  border: 1px solid var(--ui-border);
  border-radius: 0.9rem;
  background: var(--ui-bg);
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--ui-text) 4%, transparent),
    0 10px 28px -20px color-mix(in srgb, var(--ui-text) 30%, transparent);
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.pano-tile:hover {
  border-color: var(--ui-border-accented);
  transform: translateY(-1px);
  box-shadow:
    0 2px 4px color-mix(in srgb, var(--ui-text) 6%, transparent),
    0 16px 36px -20px color-mix(in srgb, var(--ui-text) 35%, transparent);
}

.pano-head { display: flex; align-items: center; gap: 0.6rem; border-bottom: 1px solid var(--ui-border-muted); padding: 0.65rem 0.9rem; }
.pano-head-icon { width: 1rem; height: 1rem; flex: none; color: var(--ui-text-dimmed); }
.pano-title { font-size: 0.8125rem; font-weight: 500; line-height: 1.2; color: var(--ui-text-highlighted); }

.pano-question {
  margin-top: 1px;
  overflow: hidden;
  font-size: 11px;
  color: var(--ui-text-dimmed);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Shared small parts. */
.pano-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ui-text-dimmed); }
.pano-empty { font-size: 12px; font-style: italic; color: var(--ui-text-dimmed); }

.pano-card {
  min-width: 0;
  border: 1px solid var(--ui-border);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--ui-bg-elevated) 35%, transparent);
  padding: 1rem;
}

.pano-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  padding: 0.1rem 0.55rem;
  font-size: 11px;
  color: var(--ui-text-toned);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

button.pano-chip:hover { border-color: var(--ui-border-accented); color: var(--ui-text-highlighted); }
.pano-chip--on { border-color: var(--ui-primary); background: color-mix(in srgb, var(--ui-primary) 10%, transparent); color: var(--ui-primary); }

.pano-lane-seg {
  border: 1px solid var(--ui-border-muted);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--ui-bg-elevated) 40%, transparent);
  padding: 0.4rem 0.6rem;
}

.pano-lane-seg .pano-label { display: block; margin-bottom: 0.15rem; }

.pano-select {
  min-width: 0;
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  background: var(--ui-bg);
  padding: 0.3rem 0.55rem;
  font-size: 12px;
  color: var(--ui-text-toned);
}

.pano-select:focus { outline: 2px solid var(--ui-primary); outline-offset: 1px; }

/* The matrices: row heads stay put while columns scroll. */
.pano-matrix { border-collapse: collapse; font-size: 12px; }

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
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.pano-matrix-col { border-bottom: 1px solid var(--ui-border); padding: 0.5rem 0.25rem; vertical-align: bottom; }

.pano-matrix-col span {
  display: inline-block;
  max-height: 8.5rem;
  overflow: hidden;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 11px;
  color: var(--ui-text-dimmed);
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
.pano-table { width: 100%; border-collapse: collapse; font-size: 12px; }

.pano-table thead th {
  border-bottom: 1px solid var(--ui-border);
  background: color-mix(in srgb, var(--ui-bg-elevated) 50%, transparent);
  padding: 0.5rem 0.75rem;
  text-align: start;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
  white-space: nowrap;
}

.pano-table tbody th,
.pano-table tbody td {
  border-bottom: 1px solid var(--ui-border-muted);
  padding: 0.55rem 0.75rem;
  text-align: start;
  vertical-align: top;
  color: var(--ui-text-toned);
}

.pano-table tbody tr:last-child th,
.pano-table tbody tr:last-child td { border-bottom: 0; }

.pano-table .num { text-align: end; font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
</style>
