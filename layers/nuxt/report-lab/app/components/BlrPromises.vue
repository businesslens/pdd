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
 * any entity anywhere opens the shared inspector with the complete entity
 * content and an optional neighbourhood map.
 */
import { h } from 'vue'
import type { NavigationMenuItem, TableColumn } from '@nuxt/ui'
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

const UButton = resolveComponent('UButton')

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
const inspectorEntity = ref<AnyEntityView | null>(null)
const inspectorTab = ref<'detail' | 'map'>('detail')
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

function titlesOf(ids: string[]): string {
  return resolve(ids).map(entity => entity.title).join(', ')
}

function pairLabel(pair: AvailabilityPair): string {
  return pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : pair.interfaceTitle
}

function goNav(id: NavId) {
  nav.value = id
  if (id === 'promises') journeyId.value = null
}

const navItems = computed<NavigationMenuItem[]>(() => NAV_ITEMS.map(item => ({
  label: item.label,
  icon: item.icon,
  active: nav.value === item.id,
  onSelect: () => goNav(item.id)
})))

function openJourney(id: string) {
  nav.value = 'promises'
  journeyId.value = id
  dossierTab.value = 'story'
}

function inspect(target: AnyEntityView | string | null) {
  const entity = typeof target === 'string' ? byId(target) ?? null : target
  inspectorEntity.value = entity
  inspectorTab.value = 'detail'
}

function inspectOnMap(target: AnyEntityView | string) {
  const entity = typeof target === 'string' ? byId(target) ?? null : target
  inspectorEntity.value = entity
  if (entity) inspectorTab.value = 'map'
}

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
/* Journey comparison table                                            */
/* ------------------------------------------------------------------ */

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

const promiseColumns: TableColumn<JourneyView>[] = [
  {
    accessorKey: 'title',
    header: sortableHeader('Promise'),
    cell: ({ row }) => h('div', { class: 'max-w-72 whitespace-normal' }, [
      h('p', { class: 'font-medium text-highlighted' }, row.original.title),
      h('p', { class: 'text-xs text-dimmed' }, firstSentence(row.original.lead))
    ])
  },
  {
    id: 'actors',
    accessorFn: journey => titlesOf(journey.actorIds),
    header: sortableHeader('Actors'),
    cell: ({ row }) => h('span', { class: 'text-muted' }, titlesOf(row.original.actorIds) || '—')
  },
  {
    id: 'contexts',
    accessorFn: journey => journey.availability.map(pairLabel).join(', '),
    header: sortableHeader('Contexts'),
    cell: ({ row }) => h('span', { class: 'text-muted' }, row.original.availability.map(pairLabel).join(', ') || '—')
  },
  {
    id: 'scenarios',
    accessorFn: journey => journey.scenarioIds.length,
    header: sortableHeader('Scenarios'),
    cell: ({ row }) => countCell(row.original.scenarioIds.length, titlesOf(row.original.scenarioIds))
  },
  {
    accessorKey: 'stepCount',
    header: sortableHeader('Step depth'),
    cell: ({ row }) => countCell(row.original.stepCount, '')
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
    id: 'rules',
    accessorFn: journey => journey.ruleIds.length,
    header: sortableHeader('Rules'),
    cell: ({ row }) => countCell(row.original.ruleIds.length, titlesOf(row.original.ruleIds))
  }
]

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
    selectedId: inspectorEntity.value?.id ?? null
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
  selectedId: inspectorEntity.value?.id ?? null
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
      return scenario && scenario.kind === 'scenario' && scenario.scenarioType === 'journey'
        ? scenario.journeyId
        : ''
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
  <div class="blr-promises flex h-full min-h-0 flex-col">
    <!-- Persistent slim nav -->
    <nav class="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-default py-1.5">
      <button type="button" class="me-1 inline-flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-start transition hover:bg-elevated/60" title="Back to the promises" @click="goNav('promises')">
        <img v-if="logoSrc" :src="logoSrc" alt="" class="size-5 rounded">
        <UIcon v-else name="i-lucide-heart-handshake" class="size-4 text-primary" />
        <span class="truncate text-sm font-semibold tracking-tight text-highlighted">{{ identity.title }}</span>
      </button>
      <UNavigationMenu orientation="horizontal" highlight :items="navItems" />
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
              <p class="blr-eyebrow">Product report · read as promises</p>
              <h1 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">{{ identity.title }}</h1>
              <p class="max-w-3xl text-sm leading-6 text-default">{{ identity.summary }}</p>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-1.5">
            <span class="blr-field me-1">Made for</span>
            <UButton
              v-for="actor in workspace.actors"
              :key="actor.id"
              color="neutral"
              variant="outline"
              size="xs"
              class="rounded-full"
              @click="inspect(actor)"
            >
              <BlrKind kind="actor" :labelled="false" size="xs" />
              {{ actor.title }}
            </UButton>
            <span v-if="!workspace.actors.length" class="text-sm text-muted italic">No Actors authored.</span>
          </div>
          <div class="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span v-for="fact in countFacts" :key="fact.label" class="blr-field">
              <span class="font-mono text-highlighted tabular-nums">{{ fact.value }}</span>
              {{ fact.label }}
            </span>
            <span v-if="coverage.rationale" class="text-xs text-dimmed italic">{{ firstSentence(coverage.rationale) }}</span>
            <UButton color="neutral" variant="ghost" size="xs" :icon="aboutOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" label="About this product & report" class="ms-auto" @click="aboutOpen = !aboutOpen" />
          </div>

          <div v-if="aboutOpen" class="mt-4 space-y-4 rounded-xl border border-default bg-default p-4">
            <BlrProse :text="identity.description" />
            <div v-if="identity.intent" class="space-y-1.5">
              <h4 class="blr-field">Intent</h4>
              <BlrProse :text="identity.intent" />
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge v-if="identity.categoryLabel" color="primary" variant="subtle" size="sm">{{ identity.categoryLabel }}</UBadge>
              <UBadge v-for="tag in identity.tags" :key="tag" color="neutral" variant="outline" size="sm">{{ tag }}</UBadge>
            </div>
            <div v-if="identity.authors.length" class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
              <span class="blr-field me-1">Authors</span>
              <template v-for="author in identity.authors" :key="author.name">
                <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">{{ author.name }}</a>
                <span v-else class="text-default">{{ author.name }}</span>
              </template>
              <span v-if="identity.license" class="text-dimmed">· {{ identity.license }}</span>
            </div>
            <div class="space-y-1.5">
              <h4 class="blr-field">Coverage</h4>
              <BlrProse :text="coverage.rationale" />
              <div v-if="coverage.method.length || coverage.sourceAreas.length" class="flex flex-wrap gap-1.5">
                <UBadge v-for="entry in [...coverage.method, ...coverage.sourceAreas]" :key="entry" color="neutral" variant="soft" size="sm">{{ entry }}</UBadge>
              </div>
              <ul v-if="coverage.unmapped.length" class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                <li v-for="entry in coverage.unmapped" :key="entry">Unmapped · {{ entry }}</li>
              </ul>
            </div>
            <div v-if="limitations.length" class="space-y-1.5">
              <h4 class="blr-field">Known limitations</h4>
              <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                <li v-for="entry in limitations" :key="entry">{{ entry }}</li>
              </ul>
            </div>
            <BlrRefs :references="identity.references" variant="list" />
            <p class="blr-meta">{{ identity.generator.name }} v{{ identity.generator.version }} · schema {{ identity.schemaVersion }} · {{ identity.generatedAt }}</p>
          </div>
        </header>

        <!-- Journey browser -->
        <section class="py-6">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            <h2 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">What we promise</h2>
            <p class="text-sm text-muted">{{ workspace.journeys.length }} Journeys, each read as a promise the Product keeps.</p>
            <UTabs
              v-model="journeyMode"
              :items="[
                { value: 'cards', label: 'Cards', icon: 'i-lucide-layout-grid' },
                { value: 'table', label: 'Compare', icon: 'i-lucide-table' }
              ]"
              :content="false"
              color="neutral"
              size="xs"
              class="ms-auto"
            />
          </div>

          <p v-if="!workspace.journeys.length" class="mt-6 text-sm text-muted italic">No Journeys are authored in this model yet — there are no promises to read.</p>

          <!-- Card view -->
          <div v-else-if="journeyMode === 'cards'" class="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <article v-for="(promise, index) in workspace.journeys" :key="promise.id" class="flex flex-col rounded-xl border border-default bg-default transition hover:border-accented">
              <div class="flex-1 space-y-3 px-4 pt-4 pb-3">
                <p class="blr-field">Promise {{ index + 1 }}</p>
                <h3 class="text-lg font-semibold tracking-tight text-highlighted">
                  <button type="button" class="text-start hover:text-primary" @click="openJourney(promise.id)">{{ promise.title }}</button>
                </h3>
                <p class="text-sm leading-6 text-muted line-clamp-3">{{ promise.lead }}</p>
                <div class="space-y-1.5">
                  <BlrLinks :workspace="workspace" :ids="promise.actorIds" kind="actor" label="Made for" interactive @select="inspect($event)" />
                  <div v-if="promise.availability.length" class="flex flex-wrap items-center gap-1.5">
                    <span class="blr-field me-1 inline-flex items-center gap-1">
                      <UIcon name="i-lucide-door-open" class="size-3" /> Available in
                    </span>
                    <UBadge v-for="pair in promise.availability" :key="pair.key" color="neutral" variant="outline" size="sm">{{ pairLabel(pair) }}</UBadge>
                  </div>
                </div>
                <div class="space-y-1.5 border-t border-muted pt-3">
                  <p class="blr-field">How it unfolds · {{ promise.scenarioIds.length }} scenarios</p>
                  <ul class="space-y-1">
                    <li v-for="scenario in (workspace.scenariosByJourney.get(promise.id) ?? []).slice(0, 4)" :key="scenario.id">
                      <button type="button" class="inline-flex max-w-full items-center gap-2 text-start text-sm text-default hover:text-highlighted" :title="scenario.kindName" @click="inspect(scenario)">
                        <span class="size-1.5 shrink-0 rounded-full" :style="{ backgroundColor: `var(--blr-slot-${scenario.kindSlot})` }" />
                        <span class="truncate">{{ scenario.title }}</span>
                      </button>
                    </li>
                    <li v-if="promise.scenarioIds.length > 4" class="text-sm text-dimmed">+{{ promise.scenarioIds.length - 4 }} more</li>
                    <li v-if="!promise.scenarioIds.length" class="text-sm text-muted italic">No Scenarios authored yet.</li>
                  </ul>
                </div>
                <div class="space-y-1.5 border-t border-muted pt-3">
                  <BlrLinks :workspace="workspace" :ids="promise.screenIds" kind="screen" label="Where" :max="3" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="promise.capabilityIds" kind="capability" label="Powered by" :max="3" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="promise.ruleIds" kind="rule" label="Held to" :max="3" interactive @select="inspect($event)" />
                </div>
              </div>
              <footer class="border-t border-muted px-4 py-2">
                <UButton color="neutral" variant="ghost" size="xs" trailing-icon="i-lucide-arrow-right" label="Read this promise" @click="openJourney(promise.id)" />
              </footer>
            </article>
          </div>

          <!-- Table view -->
          <div v-else class="mt-5 space-y-2">
            <UTable
              :data="workspace.journeys"
              :columns="promiseColumns"
              class="rounded-xl border border-default bg-default"
              :ui="{ tr: 'cursor-pointer' }"
              :on-select="(_event: Event, row: any) => { openJourney(row.original.id) }"
            />
            <p class="text-sm text-muted">All figures are derived from authored relations; step depth sums the steps of each promise’s Scenarios. Hover a count for names; click a row to read the promise.</p>
          </div>
        </section>
      </div>

      <!-- DOSSIER -->
      <div v-else class="flex h-full min-h-0 flex-col">
        <div class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-default py-2.5">
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="xs" label="All promises" @click="journeyId = null" />
          <span class="inline-flex min-w-0 items-center gap-2">
            <BlrKind kind="journey" :labelled="false" />
            <span class="truncate text-sm font-semibold tracking-tight text-highlighted">{{ journey.title }}</span>
          </span>
          <span class="blr-meta">{{ journeyScenarios.length }} scenarios · {{ journey.stepCount }} steps</span>
          <UTabs
            v-model="dossierTab"
            :items="[
              { value: 'story', label: 'Story', icon: 'i-lucide-scroll-text' },
              { value: 'map', label: 'Map', icon: 'i-lucide-waypoints' }
            ]"
            :content="false"
            color="neutral"
            size="xs"
            class="ms-auto"
          />
        </div>

        <!-- Story tab -->
        <div v-if="dossierTab === 'story'" class="blr-pane min-h-0 flex-1">
          <header class="space-y-3 border-b border-default py-5">
            <p class="blr-eyebrow">What we promise</p>
            <BlrProse :text="journey.lead" size="base" />
            <div v-if="journey.intent" class="space-y-1.5">
              <h4 class="blr-field">Why it matters</h4>
              <BlrProse :text="journey.intent" />
            </div>
            <div class="flex flex-wrap items-start gap-x-8 gap-y-3">
              <BlrAvail :pairs="journey.availability" :entry-points="journey.entryPoints" />
              <div class="space-y-2">
                <p class="blr-field">Who it is for</p>
                <div class="flex flex-wrap gap-1.5">
                  <UButton
                    v-for="actor in resolve(journey.actorIds)"
                    :key="actor.id"
                    color="neutral"
                    variant="outline"
                    size="xs"
                    class="rounded-full"
                    @click="inspect(actor)"
                  >
                    <BlrKind kind="actor" :labelled="false" size="xs" />
                    {{ actor.title }}
                  </UButton>
                </div>
              </div>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-book-open" label="Full journey record" class="ms-auto self-start" @click="inspect(journey)" />
            </div>
          </header>

          <!-- Scenario storyline -->
          <section class="space-y-4 py-6">
            <h3 class="text-base font-semibold tracking-tight text-highlighted">How it plays out</h3>
            <p v-if="!journeyScenarios.length" class="text-sm text-muted italic">No Scenarios are authored for this Journey yet — the promise has no acceptance story.</p>
            <article v-for="(scenario, scenarioIndex) in journeyScenarios" :key="scenario.id" class="overflow-hidden rounded-xl border border-default bg-default">
              <header class="flex flex-wrap items-center gap-2 border-b border-muted px-4 py-2.5">
                <span class="blr-field">Scenario {{ scenarioIndex + 1 }}</span>
                <UBadge color="neutral" variant="outline" size="sm">
                  <span class="size-1.5 rounded-full" :style="{ backgroundColor: `var(--blr-slot-${scenario.kindSlot})` }" />
                  {{ scenario.kindName }}
                </UBadge>
                <h4 class="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-highlighted">{{ scenario.title }}</h4>
                <span v-if="scenario.availability.length" class="hidden gap-1 sm:flex">
                  <UBadge v-for="pair in scenario.availability" :key="pair.key" color="neutral" variant="outline" size="sm">{{ pairLabel(pair) }}</UBadge>
                </span>
                <span v-else class="hidden text-xs text-dimmed italic sm:inline">wherever the journey is available</span>
                <UButton icon="i-lucide-book-open" color="neutral" variant="ghost" size="xs" title="Open the full scenario" @click="inspect(scenario)" />
              </header>
              <div class="grid lg:grid-cols-[15rem_minmax(0,1fr)_17rem]">
                <div class="space-y-1.5 border-b border-muted bg-elevated/30 p-4 lg:border-b-0 lg:border-e">
                  <p class="blr-field">It begins when</p>
                  <BlrProse :text="scenario.trigger" />
                </div>
                <div class="space-y-3 border-b border-muted p-4 lg:border-b-0">
                  <p class="blr-field">Step by step · {{ scenario.steps.length }}</p>
                  <ol class="space-y-1.5">
                    <li v-for="(step, stepIndex) in scenario.steps" :key="stepIndex" class="flex gap-2.5 text-sm leading-6">
                      <span class="blr-meta mt-0.5 w-5 shrink-0 text-end">{{ stepIndex + 1 }}</span>
                      <span class="text-default">{{ step }}</span>
                    </li>
                  </ol>
                  <div v-if="scenario.decisionPoints.length" class="space-y-2">
                    <p class="blr-field">Decisions on the way</p>
                    <div v-for="(point, pointIndex) in scenario.decisionPoints" :key="pointIndex" class="rounded-lg border border-dashed border-default p-3">
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
                  </div>
                </div>
                <div class="space-y-3 bg-elevated/30 p-4 lg:border-s lg:border-muted">
                  <div class="space-y-1.5">
                    <p class="blr-field">How it ends</p>
                    <BlrProse :text="scenario.outcome" />
                  </div>
                  <div v-if="scenario.edgeCases.length" class="space-y-1.5">
                    <p class="blr-field">Even when · {{ scenario.edgeCases.length }}</p>
                    <ul class="list-disc space-y-1 ps-4 text-sm text-dimmed marker:text-dimmed">
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
              <p class="text-sm text-muted">The Product surface with this promise’s {{ journey.screenIds.length }} Screens lifted; the rest stays for context.</p>
            </div>
            <div v-if="workspace.screens.length" class="h-80 overflow-hidden rounded-xl border border-default">
              <BlrFlowCanvas :nodes="dossierMap.nodes" :fit-padding="0.1" @select="inspect($event)" @focus="inspect($event)" />
            </div>
            <p v-else class="text-sm text-muted italic">No Screens are authored — this Product’s surface is not graphical, so the promise has no Screen map.</p>
          </section>

          <!-- Capabilities and Rules the promise relies on -->
          <section class="grid gap-6 border-t border-default py-6 lg:grid-cols-2">
            <div class="space-y-3">
              <h3 class="text-base font-semibold tracking-tight text-highlighted">What it relies on</h3>
              <p v-if="!dossierCapabilities.length" class="text-sm text-muted italic">No Capabilities are authored on this Journey.</p>
              <div v-for="capability in dossierCapabilities" :key="capability.id" class="rounded-lg border border-default p-3 transition hover:border-accented">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind kind="capability" :labelled="false" size="xs" />
                  <button type="button" class="text-sm font-medium text-highlighted hover:text-primary" @click="inspect(capability)">{{ capability.title }}</button>
                  <UButton v-if="capability.domainId" color="neutral" variant="outline" size="xs" class="ms-auto rounded-full" :label="titleOf(capability.domainId)" @click="inspect(capability.domainId)" />
                </div>
                <p class="mt-1.5 text-sm leading-6 text-muted">{{ firstSentence(capability.lead) }}</p>
              </div>
            </div>
            <div class="space-y-3">
              <h3 class="text-base font-semibold tracking-tight text-highlighted">What holds it to account</h3>
              <p v-if="!dossierRules.length" class="text-sm text-muted italic">No Business Rules reach this Journey.</p>
              <div v-for="reach in dossierRules" :key="reach.rule.id" class="rounded-lg border border-default p-3 transition hover:border-accented">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind kind="rule" :labelled="false" size="xs" />
                  <button type="button" class="text-sm font-medium text-highlighted hover:text-primary" @click="inspect(reach.rule)">{{ reach.rule.title }}</button>
                  <UBadge v-if="reach.direct" color="primary" variant="subtle" size="sm">authored on the journey</UBadge>
                  <UBadge v-else color="neutral" variant="subtle" size="sm">derived via scenario</UBadge>
                </div>
                <p class="mt-1.5 text-sm leading-6 text-muted">{{ firstSentence(reach.rule.statement) }}</p>
                <p v-if="reach.viaScenarios.length" class="mt-1.5 text-sm text-dimmed">
                  Reaches this promise through
                  <template v-for="(scenario, viaIndex) in reach.viaScenarios" :key="scenario.id">
                    <button type="button" class="text-default underline underline-offset-2 hover:text-primary" @click="inspect(scenario)">{{ scenario.title }}</button><span v-if="viaIndex < reach.viaScenarios.length - 1">, </span>
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
        <span class="hidden text-sm text-muted sm:inline">Interfaces are columns; Experiences nest their Screens.</span>
        <span class="blr-field ms-auto me-1">Promise overlay</span>
        <UButton
          v-for="promise in workspace.journeys"
          :key="promise.id"
          :label="promise.title"
          :color="surfaceOverlayId === promise.id ? 'primary' : 'neutral'"
          :variant="surfaceOverlayId === promise.id ? 'soft' : 'outline'"
          size="xs"
          class="rounded-full"
          @click="surfaceOverlayId = surfaceOverlayId === promise.id ? null : promise.id"
        />
        <UButton v-if="surfaceOverlayId" icon="i-lucide-x" color="neutral" variant="ghost" size="xs" title="Clear the overlay" @click="surfaceOverlayId = null" />
      </div>
      <div v-if="workspace.interfaces.length" class="min-h-0 flex-1">
        <BlrFlowCanvas :nodes="surfaceMap.nodes" :fit-padding="0.12" @select="inspect($event)" @focus="inspect($event)" />
      </div>
      <p v-else class="p-6 text-sm text-muted italic">No Interfaces are authored, so the Product declares no visible surface to map.</p>
    </div>

    <!-- ============================== ABILITIES ============================== -->
    <div v-else-if="nav === 'abilities'" class="blr-pane min-h-0 flex-1">
      <section class="space-y-5 py-6">
        <div class="space-y-1.5">
          <p class="blr-eyebrow">Abilities</p>
          <h2 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">What the Product can durably do</h2>
          <p class="text-sm text-muted">Capabilities grouped by Domain; promise and Rule reach are derived from authored relations.</p>
        </div>
        <p v-if="!workspace.capabilities.length" class="text-sm text-muted italic">No Capabilities are authored in this model.</p>
        <div v-for="group in abilityGroups" :key="group.id || 'none'" class="space-y-3">
          <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <BlrKind v-if="group.id" kind="domain" :labelled="false" size="xs" />
            <button v-if="group.id" type="button" class="text-base font-semibold tracking-tight text-highlighted hover:text-primary" @click="inspect(group.id)">{{ group.title }}</button>
            <span v-else class="text-base font-semibold tracking-tight text-highlighted">{{ group.title }}</span>
            <span v-if="group.lead" class="text-sm text-muted">{{ firstSentence(group.lead) }}</span>
          </div>
          <p v-if="!group.capabilities.length" class="text-sm text-muted italic">No Capabilities in this Domain yet.</p>
          <div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <article v-for="capability in group.capabilities" :key="capability.id" class="rounded-xl border border-default bg-default p-4 transition hover:border-accented">
              <div class="flex items-start gap-2">
                <BlrKind kind="capability" :labelled="false" size="xs" class="mt-1" />
                <button type="button" class="text-start text-base font-semibold tracking-tight text-highlighted hover:text-primary" @click="inspect(capability)">{{ capability.title }}</button>
              </div>
              <p class="mt-2 text-sm leading-6 text-muted line-clamp-3">{{ capability.lead }}</p>
              <div class="mt-3 space-y-1.5 border-t border-muted pt-3">
                <BlrLinks :workspace="workspace" :ids="capability.journeyIds" kind="journey" label="Serves promises" :max="3" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="capability.screenIds" kind="screen" label="Exposed on" :max="3" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="capability.ruleIds" kind="rule" label="Held to" :max="3" interactive @select="inspect($event)" />
                <div v-if="capability.availability.length" class="flex flex-wrap gap-1 pt-0.5">
                  <UBadge v-for="pair in capability.availability" :key="pair.key" color="neutral" variant="outline" size="sm">{{ pairLabel(pair) }}</UBadge>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section v-for="matrix in matrices" :key="matrix.id" class="space-y-3 border-t border-default py-6">
        <h3 class="text-lg font-semibold tracking-tight text-highlighted">{{ matrix.question }}</h3>
        <p class="text-sm text-muted">{{ matrix.note }} Click a cell for the explanation.</p>
        <div class="overflow-x-auto rounded-xl border border-default bg-default">
          <table class="blr-matrix">
            <thead>
              <tr>
                <th class="blr-matrix-corner">Capability</th>
                <th v-for="col in matrix.cols" :key="col.id" class="blr-matrix-col">
                  <button type="button" class="blr-matrix-colhead" :title="col.title" @click="inspect(col.id)">{{ col.title }}</button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in matrix.rows" :key="row.rowId">
                <th scope="row" class="blr-matrix-row">
                  <button type="button" class="hover:text-primary" @click="inspect(row.rowId)">{{ row.title }}</button>
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
        <div v-if="matrixExplanation && matrixCell?.matrixId === matrix.id" class="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-default px-4 py-3">
          <UIcon name="i-lucide-corner-down-right" class="size-3.5 shrink-0 text-dimmed" />
          <p class="min-w-0 flex-1 text-sm text-default">{{ matrixExplanation.text }}</p>
          <UButton color="neutral" variant="outline" size="xs" :label="matrixExplanation.capability.title" @click="inspect(matrixExplanation.capability)" />
          <UButton color="neutral" variant="outline" size="xs" :label="matrixExplanation.other.title" @click="inspect(matrixExplanation.other)" />
        </div>
      </section>
      <p v-if="!matrices.length" class="border-t border-default py-6 text-sm text-muted italic">Matrices need both Capabilities and something to compare them against; this model does not have enough of either yet.</p>
    </div>

    <!-- ============================== CONSTRAINTS ============================== -->
    <div v-else-if="nav === 'constraints'" class="blr-pane min-h-0 flex-1">
      <section class="space-y-5 py-6">
        <div class="space-y-1.5">
          <p class="blr-eyebrow">Constraints</p>
          <h2 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">What the Product holds itself to</h2>
          <p class="text-sm text-muted">Each Rule with where it is authored and how far it reaches. Derived reach is labelled — it is inferred, never authored.</p>
        </div>
        <p v-if="!ruleImpacts.length" class="text-sm text-muted italic">No Business Rules are authored in this model.</p>
        <article v-for="impact in ruleImpacts" :key="impact.rule.id" class="rounded-xl border border-default bg-default p-4 sm:p-5">
          <div class="flex flex-wrap items-center gap-2">
            <BlrKind kind="rule" :labelled="false" />
            <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ impact.rule.title }}</h3>
            <span class="ms-auto flex gap-1.5">
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-waypoints" label="Impact map" @click="inspectOnMap(impact.rule)" />
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-book-open" label="Open" @click="inspect(impact.rule)" />
            </span>
          </div>
          <div class="mt-3 rounded-lg border-s-2 border-primary bg-elevated/40 p-3.5">
            <BlrProse :text="impact.rule.statement" />
          </div>
          <div v-if="impact.rule.rationale" class="mt-3 space-y-1.5">
            <h4 class="blr-field">Why</h4>
            <BlrProse :text="impact.rule.rationale" />
          </div>
          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <div class="space-y-1.5 rounded-lg border border-default p-3">
              <p class="blr-field">Directly constrains — authored</p>
              <BlrLinks :workspace="workspace" :ids="impact.rule.domainIds" kind="domain" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="impact.rule.capabilityIds" kind="capability" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="impact.rule.journeyIds" kind="journey" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="impact.rule.scenarioIds" kind="scenario" interactive @select="inspect($event)" />
              <p v-if="!impact.rule.domainIds.length && !impact.rule.capabilityIds.length && !impact.rule.journeyIds.length && !impact.rule.scenarioIds.length" class="text-sm text-muted italic">Attached to nothing directly.</p>
            </div>
            <div class="space-y-1.5 rounded-lg border border-dashed border-default p-3">
              <p class="blr-field">Reach — derived</p>
              <BlrLinks :workspace="workspace" :ids="impact.derivedJourneys.map(item => item.id)" kind="journey" label="Promises via scenarios" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="impact.derivedCapabilities.map(item => item.id)" kind="capability" label="Capabilities via domain" interactive @select="inspect($event)" />
              <p v-if="!impact.derivedJourneys.length && !impact.derivedCapabilities.length" class="text-sm text-muted italic">No further reach beyond its direct attachments.</p>
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
        <div class="space-y-1.5">
          <p class="blr-eyebrow">Access</p>
          <h2 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">Who the Product is for</h2>
          <p class="text-sm text-muted">Actors, where they enter, and the promises they perform.</p>
        </div>
        <p v-if="!workspace.actors.length" class="text-sm text-muted italic">No Actors are authored in this model.</p>
        <div class="grid gap-4 md:grid-cols-2">
          <article v-for="actor in workspace.actors" :key="actor.id" class="rounded-xl border border-default bg-default p-4 transition hover:border-accented">
            <div class="flex flex-wrap items-center gap-2">
              <BlrKind kind="actor" :labelled="false" />
              <button type="button" class="text-base font-semibold tracking-tight text-highlighted hover:text-primary" @click="inspect(actor)">{{ actor.title }}</button>
              <UBadge color="neutral" variant="subtle" size="sm">{{ actor.actorKind }} · {{ actor.relationship }}</UBadge>
            </div>
            <p class="mt-2 text-sm leading-6 text-muted">{{ firstSentence(actor.lead) }}</p>
            <div class="mt-3 space-y-1.5 border-t border-muted pt-3">
              <BlrLinks :workspace="workspace" :ids="actor.interfaceIds" kind="interface" label="Enters" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="actor.experienceIds" kind="experience" label="Within" interactive @select="inspect($event)" />
              <BlrLinks :workspace="workspace" :ids="actor.journeyIds" kind="journey" label="Performs" interactive @select="inspect($event)" />
            </div>
          </article>
        </div>
      </section>

      <section class="space-y-4 border-t border-default py-6">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold tracking-tight text-highlighted">Where they enter</h2>
          <p class="text-sm text-muted">Each access context with the boundary it establishes and what is reachable inside it.</p>
        </div>
        <p v-if="!workspace.interfaces.length" class="text-sm text-muted italic">No Interfaces are authored in this model.</p>
        <article v-for="context in workspace.interfaces" :key="context.id" class="rounded-xl border border-default bg-default p-4 sm:p-5">
          <div class="flex flex-wrap items-center gap-2">
            <BlrKind kind="interface" :labelled="false" />
            <button type="button" class="text-base font-semibold tracking-tight text-highlighted hover:text-primary" @click="inspect(context)">{{ context.title }}</button>
            <UBadge v-for="point in context.entryPoints" :key="`${point.interfaceId}-${point.path}`" color="neutral" variant="soft" size="sm" class="font-mono">{{ point.path }}</UBadge>
          </div>
          <p class="mt-2 text-sm leading-6 text-default">{{ firstSentence(context.lead) }}</p>
          <div class="mt-2">
            <p class="blr-field">Boundary</p>
            <p class="mt-1 text-sm leading-6 text-muted">{{ firstSentence(context.capabilityBoundary) }}</p>
          </div>
          <div class="mt-3 space-y-1.5 border-t border-muted pt-3">
            <BlrLinks :workspace="workspace" :ids="context.actorIds" kind="actor" label="Who enters" interactive @select="inspect($event)" />
            <BlrLinks :workspace="workspace" :ids="context.screenIds" kind="screen" label="Screens here" interactive @select="inspect($event)" />
            <BlrLinks :workspace="workspace" :ids="context.capabilityIds" kind="capability" label="Abilities here" interactive @select="inspect($event)" />
            <BlrLinks :workspace="workspace" :ids="context.journeyIds" kind="journey" label="Promises kept here" interactive @select="inspect($event)" />
            <p v-if="!context.screenIds.length" class="text-sm text-muted italic">No Screens — this Interface is not a graphical surface, and that is a fact, not a gap.</p>
          </div>
          <div v-if="context.experienceIds.length" class="mt-4 space-y-3">
            <p class="blr-field">Experiences inside</p>
            <div v-for="experience in resolve(context.experienceIds)" :key="experience.id" class="rounded-lg border border-default bg-elevated/30 p-4">
              <div class="flex flex-wrap items-center gap-2">
                <BlrKind kind="experience" :labelled="false" size="xs" />
                <button type="button" class="text-sm font-medium text-highlighted hover:text-primary" @click="inspect(experience)">{{ experience.title }}</button>
                <UBadge v-if="experience.kind === 'experience'" :color="ACCESS_TONE[experience.accessMode] || 'neutral'" variant="subtle" size="sm">{{ experience.accessMode }}</UBadge>
              </div>
              <template v-if="experience.kind === 'experience'">
                <p class="mt-1.5 text-sm leading-6 text-muted">{{ firstSentence(experience.capabilityBoundary) }}</p>
                <div class="mt-2.5 space-y-1.5">
                  <BlrLinks :workspace="workspace" :ids="experience.actorIds" kind="actor" label="Who enters" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="experience.screenIds" kind="screen" label="Screens here" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="experience.capabilityIds" kind="capability" label="Abilities here" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="experience.journeyIds" kind="journey" label="Promises kept here" interactive @select="inspect($event)" />
                </div>
              </template>
            </div>
          </div>
          <p v-else class="mt-3 text-sm text-muted italic">No Experiences — everything here is directly available through the Interface.</p>
        </article>
      </section>
    </div>

    <!-- Inspector: the shared slideover every selection lands in -->
    <BlrInspector
      v-model:tab="inspectorTab"
      :workspace="workspace"
      :entity="inspectorEntity"
      @select="inspect($event)"
      @close="inspectorEntity = null"
    />
  </div>
</template>

<style scoped>
/*
  Categorical slots mirrored from reportPalette.ts so the Scenario-kind dots
  resolve outside the flow canvas too (BlrFlowCanvas only defines them under
  .blr-flow). These are data colours, not decoration.
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

/* Matrices: sticky row heads, rotated column heads, explainable cells. */
.blr-matrix { min-width: max-content; border-collapse: collapse; font-size: 0.75rem; }

.blr-matrix-corner {
  position: sticky; inset-inline-start: 0; z-index: 2; background: var(--ui-bg);
  padding: 0.375rem 0.75rem; text-align: start; vertical-align: bottom;
  font-size: var(--text-xs); font-weight: 500; color: var(--ui-text-muted);
}

.blr-matrix-col { padding: 0.375rem 0.125rem; vertical-align: bottom; }

.blr-matrix-colhead {
  display: inline-block; max-height: 9rem; overflow: hidden;
  writing-mode: vertical-rl; transform: rotate(180deg);
  white-space: nowrap; text-overflow: ellipsis;
  font-size: var(--text-xs); font-weight: 500; color: var(--ui-text-muted);
}

.blr-matrix-colhead:hover { color: var(--ui-text-highlighted); }

.blr-matrix-row {
  position: sticky; inset-inline-start: 0; z-index: 1; max-width: 16rem;
  background: var(--ui-bg); border-top: 1px solid var(--ui-border-muted);
  padding: 0.375rem 0.75rem; text-align: start; font-weight: 500;
  color: var(--ui-text-default); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.blr-matrix tbody td { border-top: 1px solid var(--ui-border-muted); }

.blr-cell {
  display: flex; align-items: center; justify-content: center;
  width: 100%; min-width: 2rem; height: 2rem; border-radius: 4px;
}

.blr-cell:hover { background: var(--ui-bg-elevated); }
.blr-cell:hover .blr-dot { opacity: 1; }
.blr-cell--selected { outline: 2px solid var(--ui-primary); outline-offset: -2px; }

.blr-dot { border-radius: 9999px; }
.blr-dot--direct { width: 0.65rem; height: 0.65rem; background: var(--ui-primary); opacity: 0.85; }
.blr-dot--derived { width: 0.65rem; height: 0.65rem; border: 1.5px solid var(--ui-primary); background: transparent; opacity: 0.7; }
.blr-dot--none { width: 0.375rem; height: 2px; border-radius: 1px; background: color-mix(in srgb, var(--ui-text-dimmed) 30%, transparent); }
</style>
