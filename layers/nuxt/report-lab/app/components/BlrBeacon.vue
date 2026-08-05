<script setup lang="ts">
/**
 * Beacon — the search-first Product Report explorer.
 *
 * IA: one commanding omnibox with kind-filter chips, over six view tabs.
 * - Explore (home): with nothing asked, an orientation panel — identity,
 *   clickable composition facts, coverage and references. Typing produces a
 *   ranked, kind-grouped, keyboard-navigable result list indexing titles,
 *   leads, intents and Scenario trigger/step/outcome text. Opening a result
 *   lands on the design's heart: a split canvas — full entity content on the
 *   left (with a breadcrumb trail), contextual topology on the right.
 * - Promises: Journey cards ⇄ comparison table, and full Journey detail with
 *   every Scenario complete (trigger, steps, decisions, outcome, edge cases).
 * - Surface: the shared Screen map with a Journey overlay.
 * - Abilities: Domain-grouped Capability cards plus named matrices, each
 *   headed by the question it answers, with cell-click explanations.
 * - Constraints: one Rule at a time — statement, rationale, direct
 *   attachments vs derived reach, narrowed availability.
 * - Access: Actor cards and Interface/Experience context comparison.
 * Every selection anywhere returns to Explore's split canvas: words + map.
 */
import type {
  AnyEntityView,
  AvailabilityPair,
  CapabilityView,
  EntryPointView,
  JourneyView,
  ReportEntityKind,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  WorkspaceCounts
} from '../utils/reportWorkspace'
import { ENTITY_KIND_META, REPORT_ENTITY_KINDS, resolveEntities } from '../utils/reportWorkspace'
import { buildScreenMap } from '../utils/flowGraph'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

/* ------------------------------------------------------------------ */
/* Views                                                               */
/* ------------------------------------------------------------------ */

const VIEWS = [
  { id: 'explore', label: 'Explore', icon: 'i-lucide-search' },
  { id: 'promises', label: 'Promises', icon: 'i-lucide-heart-handshake' },
  { id: 'surface', label: 'Surface', icon: 'i-lucide-monitor' },
  { id: 'abilities', label: 'Abilities', icon: 'i-lucide-zap' },
  { id: 'constraints', label: 'Constraints', icon: 'i-lucide-scale' },
  { id: 'access', label: 'Access', icon: 'i-lucide-door-open' }
] as const
type ViewId = (typeof VIEWS)[number]['id']

const view = ref<ViewId>('explore')

const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  complete: 'success',
  partial: 'warning',
  draft: 'neutral'
}
const ACCESS_TONE: Record<string, 'success' | 'warning' | 'error'> = {
  public: 'success',
  authenticated: 'warning',
  restricted: 'error'
}

const COUNT_FIELD: Partial<Record<ReportEntityKind, keyof WorkspaceCounts>> = {
  actor: 'actors',
  interface: 'interfaces',
  experience: 'experiences',
  screen: 'screens',
  domain: 'domains',
  capability: 'capabilities',
  journey: 'journeys',
  scenario: 'scenarios',
  rule: 'rules'
}

function countOf(kind: ReportEntityKind): number {
  const field = COUNT_FIELD[kind]
  return field ? props.workspace.counts[field] : 0
}

const compositionFacts = computed(() =>
  REPORT_ENTITY_KINDS.map(meta => ({ meta, count: countOf(meta.kind) })))

function pairLabel(pair: AvailabilityPair): string {
  return pair.experienceTitle ? `${pair.interfaceTitle} · ${pair.experienceTitle}` : pair.interfaceTitle
}

function nameList(ids: string[], max = 3): string {
  const titles = ids
    .map(id => props.workspace.byId.get(id)?.title)
    .filter((title): title is string => Boolean(title))
  if (!titles.length) return '—'
  const rest = titles.length - max
  return titles.slice(0, max).join(', ') + (rest > 0 ? ` +${rest}` : '')
}

function scenariosOf(journeyId: string): ScenarioView[] {
  return props.workspace.scenariosByJourney.get(journeyId) ?? []
}

/* ------------------------------------------------------------------ */
/* Trail: the split canvas navigation                                  */
/* ------------------------------------------------------------------ */

const trail = ref<string[]>([])
const currentEntity = computed<AnyEntityView | null>(() => {
  const id = trail.value.at(-1)
  return (id && props.workspace.byId.get(id)) || null
})

/** Land any selection on Explore's split canvas: words + map. */
function open(target: AnyEntityView | string | null | undefined) {
  const id = typeof target === 'string' ? target : target?.id
  if (!id || !props.workspace.byId.has(id)) return
  query.value = ''
  indexKind.value = null
  view.value = 'explore'
  if (trail.value.at(-1) !== id) trail.value = [...trail.value.slice(-11), id]
}

function goHome() {
  trail.value = []
  query.value = ''
  indexKind.value = null
  view.value = 'explore'
}

/* ------------------------------------------------------------------ */
/* Search: omnibox, kind filter, ranked results                        */
/* ------------------------------------------------------------------ */

const query = ref('')
/** Set by a composition-fact click: browse a whole kind without typing. */
const indexKind = ref<ReportEntityKind | null>(null)
const activeKinds = ref<Set<ReportEntityKind>>(new Set(REPORT_ENTITY_KINDS.map(meta => meta.kind)))
const resultIndex = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)
const resultsPane = ref<HTMLElement | null>(null)

const presentKinds = computed(() => REPORT_ENTITY_KINDS.filter(meta => countOf(meta.kind) > 0))
const kindsNarrowed = computed(() => presentKinds.value.some(meta => !activeKinds.value.has(meta.kind)))
const searching = computed(() => Boolean(query.value.trim()) || indexKind.value !== null)

interface SearchHit {
  entity: AnyEntityView
  /** 0 title startsWith · 1 title includes · 2 body includes. */
  rank: number
  snippet: string
}

function bodySnippet(entity: AnyEntityView, q: string): string | null {
  const probes: Array<{ prefix: string, text: string }> = []
  if (entity.kind === 'scenario') {
    probes.push({ prefix: 'Trigger — ', text: entity.trigger })
    entity.steps.forEach((step, index) => probes.push({ prefix: `Step ${index + 1} — `, text: step }))
    probes.push({ prefix: 'Outcome — ', text: entity.outcome })
    entity.edgeCases.forEach(item => probes.push({ prefix: 'Edge case — ', text: item }))
  }
  probes.push({ prefix: '', text: entity.lead }, { prefix: 'Intent — ', text: entity.intent })
  if (entity.kind === 'rule') probes.push({ prefix: 'Rationale — ', text: entity.rationale })
  for (const probe of probes) {
    if (probe.text && probe.text.toLowerCase().includes(q)) {
      return probe.prefix + firstSentence(probe.text, 120)
    }
  }
  return null
}

const searchHits = computed<SearchHit[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) {
    if (!indexKind.value) return []
    return [...props.workspace.byId.values()]
      .filter(entity => entity.kind === indexKind.value)
      .map(entity => ({ entity, rank: 0, snippet: firstSentence(entity.lead) }))
  }
  const hits: SearchHit[] = []
  for (const entity of props.workspace.byId.values()) {
    if (!activeKinds.value.has(entity.kind)) continue
    const title = entity.title.toLowerCase()
    if (title.startsWith(q)) {
      hits.push({ entity, rank: 0, snippet: firstSentence(entity.lead) })
    } else if (title.includes(q)) {
      hits.push({ entity, rank: 1, snippet: firstSentence(entity.lead) })
    } else {
      const snippet = bodySnippet(entity, q)
      if (snippet !== null) hits.push({ entity, rank: 2, snippet })
    }
  }
  return hits
})

/** Kind-grouped, rank-sorted; `start` is the group's offset in the flat list. */
const groupedResults = computed(() => {
  const groups: Array<{ meta: (typeof REPORT_ENTITY_KINDS)[number], hits: SearchHit[], start: number }> = []
  let start = 0
  for (const meta of REPORT_ENTITY_KINDS) {
    const hits = searchHits.value
      .filter(hit => hit.entity.kind === meta.kind)
      .sort((a, b) => a.rank - b.rank || a.entity.title.localeCompare(b.entity.title))
    if (!hits.length) continue
    groups.push({ meta, hits, start })
    start += hits.length
  }
  return groups
})
const flatResults = computed(() => groupedResults.value.flatMap(group => group.hits))

watch(query, (next) => {
  resultIndex.value = 0
  if (next.trim()) {
    indexKind.value = null
    view.value = 'explore'
  }
})
watch(flatResults, (next) => {
  if (resultIndex.value > next.length - 1) resultIndex.value = 0
})
watch(resultIndex, async () => {
  await nextTick()
  resultsPane.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
})

function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    resultIndex.value = Math.min(resultIndex.value + 1, Math.max(flatResults.value.length - 1, 0))
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    resultIndex.value = Math.max(resultIndex.value - 1, 0)
  } else if (event.key === 'Enter') {
    const hit = flatResults.value[resultIndex.value]
    if (hit) open(hit.entity)
  } else if (event.key === 'Escape') {
    query.value = ''
    indexKind.value = null
  }
}

function toggleSearchKind(kind: ReportEntityKind) {
  const next = new Set(activeKinds.value)
  if (next.has(kind)) next.delete(kind)
  else next.add(kind)
  activeKinds.value = next
}

function resetKinds() {
  activeKinds.value = new Set(REPORT_ENTITY_KINDS.map(meta => meta.kind))
}

async function browseKind(kind: ReportEntityKind) {
  activeKinds.value = new Set([kind])
  indexKind.value = kind
  query.value = ''
  view.value = 'explore'
  await nextTick()
  searchInput.value?.focus()
}

/** "/" focuses the omnibox from anywhere that is not already an input. */
function onGlobalKeydown(event: KeyboardEvent) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
  event.preventDefault()
  searchInput.value?.focus()
}
onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))

/* ------------------------------------------------------------------ */
/* Promises: journey browser                                           */
/* ------------------------------------------------------------------ */

const journeyMode = ref<'cards' | 'table'>('cards')
const openJourneyId = ref<string | null>(null)
const openJourney = computed<JourneyView | null>(() =>
  props.workspace.journeys.find(journey => journey.id === openJourneyId.value) ?? null)

/* ------------------------------------------------------------------ */
/* Surface: screen map with journey overlay                            */
/* ------------------------------------------------------------------ */

const overlayJourneyId = ref<string | null>(null)
const overlayJourney = computed<JourneyView | null>(() =>
  props.workspace.journeys.find(journey => journey.id === overlayJourneyId.value) ?? null)
const screenMap = computed(() => buildScreenMap(props.workspace, {
  emphasizeScreenIds: overlayJourney.value ? new Set(overlayJourney.value.screenIds) : null
}))

/* ------------------------------------------------------------------ */
/* Abilities: capability map and named matrices                        */
/* ------------------------------------------------------------------ */

const domainGroups = computed(() => {
  const groups: Array<{ id: string, title: string, lead: string, capabilities: CapabilityView[] }> = []
  for (const domain of props.workspace.domains) {
    groups.push({
      id: domain.id,
      title: domain.title,
      lead: firstSentence(domain.lead),
      capabilities: props.workspace.capabilitiesByDomain.get(domain.id) ?? []
    })
  }
  const undomained = props.workspace.capabilitiesByDomain.get('') ?? []
  if (undomained.length) {
    groups.push({ id: '', title: 'No Domain', lead: 'Capabilities not assigned to a Domain.', capabilities: undomained })
  }
  return groups
})

interface MatrixColumn {
  id: string
  title: string
  kind: ReportEntityKind
  entityId: string
}
interface MatrixDef {
  id: string
  question: string
  note: string
  columns: MatrixColumn[]
  filled: (capability: CapabilityView, columnId: string) => boolean
  explain: (capability: CapabilityView, column: MatrixColumn) => string
}

const matrices = computed<MatrixDef[]>(() => {
  const ws = props.workspace
  if (!ws.capabilities.length) return []
  const defs: MatrixDef[] = []
  if (ws.journeys.length) {
    defs.push({
      id: 'cap-journey',
      question: 'Which promises depend on each Capability?',
      note: 'Capabilities × Journeys — derived from each Journey’s authored Capability list.',
      columns: ws.journeys.map(journey => ({ id: journey.id, title: journey.title, kind: 'journey', entityId: journey.id })),
      filled: (capability, columnId) => capability.journeyIds.includes(columnId),
      explain: (capability, column) => `The Journey “${column.title}” uses the Capability “${capability.title}”.`
    })
  }
  if (ws.screens.length) {
    defs.push({
      id: 'cap-screen',
      question: 'Where is each Capability exposed?',
      note: 'Capabilities × Screens — derived from each Screen’s authored Capability list.',
      columns: ws.screens.map(screen => ({ id: screen.id, title: screen.title, kind: 'screen', entityId: screen.id })),
      filled: (capability, columnId) => capability.screenIds.includes(columnId),
      explain: (capability, column) => `The Screen “${column.title}” exposes the Capability “${capability.title}”.`
    })
  }
  if (ws.pairs.length) {
    defs.push({
      id: 'cap-context',
      question: 'Through which access contexts can each Capability be reached?',
      note: 'Capabilities × Interface availability scopes — from authored availability.',
      columns: ws.pairs.map(pair => ({
        id: pair.key,
        title: pairLabel(pair),
        kind: pair.experienceId ? 'experience' : 'interface',
        entityId: pair.experienceId || pair.interfaceId
      })),
      filled: (capability, columnId) => capability.availability.some(pair => pair.key === columnId),
      explain: (capability, column) => `The Capability “${capability.title}” is available in ${column.title}.`
    })
  }
  return defs
})

const matrixCell = ref<{ matrixId: string, capId: string, columnId: string } | null>(null)
function selectCell(matrixId: string, capId: string, columnId: string) {
  const same = matrixCell.value
    && matrixCell.value.matrixId === matrixId
    && matrixCell.value.capId === capId
    && matrixCell.value.columnId === columnId
  matrixCell.value = same ? null : { matrixId, capId, columnId }
}
const cellExplanation = computed(() => {
  const cell = matrixCell.value
  if (!cell) return null
  const matrix = matrices.value.find(item => item.id === cell.matrixId)
  const capability = props.workspace.capabilities.find(item => item.id === cell.capId)
  const column = matrix?.columns.find(item => item.id === cell.columnId)
  if (!matrix || !capability || !column) return null
  return {
    matrixId: matrix.id,
    text: matrix.explain(capability, column),
    capId: capability.id,
    capTitle: capability.title,
    colEntityId: column.entityId,
    colTitle: column.title
  }
})

/* ------------------------------------------------------------------ */
/* Constraints: rule impact                                            */
/* ------------------------------------------------------------------ */

const currentRuleId = ref<string | null>(null)
const currentRule = computed<RuleView | null>(() =>
  props.workspace.rules.find(rule => rule.id === currentRuleId.value)
  ?? props.workspace.rules[0]
  ?? null)

const ruleDirect = computed<AnyEntityView[]>(() => {
  const rule = currentRule.value
  if (!rule) return []
  return resolveEntities(props.workspace, [
    ...rule.domainIds,
    ...rule.capabilityIds,
    ...rule.journeyIds,
    ...rule.scenarioIds
  ])
})

const ruleDerived = computed<Array<{ label: string, entities: AnyEntityView[] }>>(() => {
  const rule = currentRule.value
  if (!rule) return []
  const ws = props.workspace
  const directCaps = new Set(rule.capabilityIds)
  const directJourneys = new Set(rule.journeyIds)
  const directScenarios = new Set(rule.scenarioIds)
  const groups: Array<{ label: string, ids: string[] }> = [
    {
      label: 'Capabilities inside a constrained Domain',
      ids: ws.capabilities
        .filter(item => item.domainId && rule.domainIds.includes(item.domainId) && !directCaps.has(item.id))
        .map(item => item.id)
    },
    {
      label: 'Journeys that use a constrained Capability',
      ids: ws.journeys
        .filter(item => !directJourneys.has(item.id) && item.capabilityIds.some(id => directCaps.has(id)))
        .map(item => item.id)
    },
    {
      label: 'Scenarios of a constrained Journey',
      ids: ws.scenarios
        .filter(item => !directScenarios.has(item.id) && directJourneys.has(item.journeyId))
        .map(item => item.id)
    },
    {
      label: 'Screens exposing a constrained Capability',
      ids: ws.screens
        .filter(item => item.capabilityIds.some(id => directCaps.has(id)))
        .map(item => item.id)
    }
  ]
  return groups
    .filter(group => group.ids.length)
    .map(group => ({ label: group.label, entities: resolveEntities(ws, group.ids) }))
})

/* ------------------------------------------------------------------ */
/* Access: interface and experience contexts, one comparable card shape */
/* ------------------------------------------------------------------ */

interface AccessContextCard {
  entity: AnyEntityView
  badge: { label: string, color: 'success' | 'warning' | 'error' | 'neutral' } | null
  lead: string
  links: Array<{ label: string, kind: ReportEntityKind, ids: string[] }>
  entryPoints: EntryPointView[]
  boundary: string
  /** Derived from authored availability, and labelled as derived in the card. */
  scope: { capabilities: number, screens: number, journeys: number }
}

const accessContexts = computed<AccessContextCard[]>(() => [
  ...props.workspace.interfaces.map((item): AccessContextCard => ({
    entity: item,
    badge: null,
    lead: firstSentence(item.lead, 220),
    links: [
      { label: 'Entered by', kind: 'actor', ids: item.actorIds },
      { label: 'Contains', kind: 'experience', ids: item.experienceIds }
    ],
    entryPoints: item.entryPoints,
    boundary: item.capabilityBoundary,
    scope: { capabilities: item.capabilityIds.length, screens: item.screenIds.length, journeys: item.journeyIds.length }
  })),
  ...props.workspace.experiences.map((item): AccessContextCard => ({
    entity: item,
    badge: { label: item.accessMode, color: ACCESS_TONE[item.accessMode] ?? 'neutral' },
    lead: firstSentence(item.lead, 220),
    links: [
      { label: 'Entered by', kind: 'actor', ids: item.actorIds },
      { label: 'Within', kind: 'interface', ids: item.interfaceIds }
    ],
    entryPoints: item.entryPoints,
    boundary: item.capabilityBoundary,
    scope: { capabilities: item.capabilityIds.length, screens: item.screenIds.length, journeys: item.journeyIds.length }
  }))
])
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- Top bar: brand · omnibox · kind chips · view tabs -->
    <header class="shrink-0 border-b border-default">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3 pb-2 sm:px-6">
        <button
          type="button"
          class="flex shrink-0 items-center gap-2"
          title="Back to orientation"
          @click="goHome"
        >
          <img v-if="logoSrc" :src="logoSrc" alt="" class="size-5 rounded">
          <UIcon v-else name="i-lucide-package" class="size-5 text-primary" />
          <span class="hidden max-w-44 truncate text-sm font-medium text-highlighted md:inline">
            {{ workspace.identity.title }}
          </span>
        </button>

        <div class="relative min-w-56 flex-1 basis-72">
          <UIcon name="i-lucide-search" class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-dimmed" />
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            class="blx-omni"
            placeholder="Search the Product Model…"
            aria-label="Search the Product Model"
            autocomplete="off"
            spellcheck="false"
            @keydown="onSearchKeydown"
          >
          <button
            v-if="query || indexKind"
            type="button"
            class="absolute end-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-dimmed hover:text-toned"
            title="Clear search"
            @click="query = ''; indexKind = null"
          >
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <kbd v-else class="blx-kbd">/</kbd>
        </div>

        <div class="flex flex-wrap items-center gap-1">
          <button
            v-for="meta in presentKinds"
            :key="meta.kind"
            type="button"
            class="rounded-full border px-1.5 py-0.5 transition"
            :class="activeKinds.has(meta.kind)
              ? 'border-default bg-elevated/50'
              : 'border-transparent opacity-35 grayscale hover:opacity-60'"
            :title="activeKinds.has(meta.kind)
              ? `Exclude ${meta.plural} from search`
              : `Include ${meta.plural} in search`"
            @click="toggleSearchKind(meta.kind)"
          >
            <BlrKind :kind="meta.kind" size="xs" />
          </button>
          <UButton
            v-if="kindsNarrowed"
            label="All kinds"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="resetKinds"
          />
        </div>
      </div>

      <nav class="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
        <button
          v-for="tab in VIEWS"
          :key="tab.id"
          type="button"
          class="blx-tab"
          :data-on="view === tab.id"
          @click="view = tab.id"
        >
          <UIcon :name="tab.icon" class="size-3.5" />
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <!-- EXPLORE: results list -->
    <div v-if="view === 'explore' && searching" ref="resultsPane" class="blr-pane flex-1">
      <div class="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
        <p class="mb-3 text-xs text-dimmed">
          <template v-if="query.trim()">
            {{ flatResults.length }} {{ flatResults.length === 1 ? 'match' : 'matches' }} for
            “{{ query.trim() }}”<span v-if="kindsNarrowed"> in the selected kinds</span>
            — ↑↓ to move, Enter to open, Esc to clear.
          </template>
          <template v-else-if="indexKind">
            All {{ flatResults.length }} {{ ENTITY_KIND_META[indexKind].plural }} — Enter opens the highlighted one.
          </template>
        </p>
        <section v-for="group in groupedResults" :key="group.meta.kind" class="mb-4">
          <h3 class="mb-1.5 flex items-baseline gap-2">
            <BlrKind :kind="group.meta.kind" size="xs" />
            <span class="font-mono text-[10px] text-dimmed tabular-nums">{{ group.hits.length }}</span>
          </h3>
          <ul class="space-y-0.5">
            <li v-for="(hit, index) in group.hits" :key="hit.entity.id">
              <button
                type="button"
                class="blx-result"
                :data-active="resultIndex === group.start + index ? 'true' : undefined"
                @mousemove="resultIndex = group.start + index"
                @click="open(hit.entity)"
              >
                <BlrKind :kind="hit.entity.kind" :labelled="false" />
                <span class="shrink-0 text-sm font-medium text-highlighted">{{ hit.entity.title }}</span>
                <span class="min-w-0 flex-1 truncate text-xs text-dimmed">{{ hit.snippet }}</span>
                <UIcon
                  v-if="resultIndex === group.start + index"
                  name="i-lucide-corner-down-left"
                  class="size-3.5 shrink-0 text-dimmed"
                />
              </button>
            </li>
          </ul>
        </section>
        <p v-if="!flatResults.length" class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-dimmed">
          Nothing in the Product Model matches “{{ query.trim() }}”<span v-if="kindsNarrowed"> within the selected kinds — try widening the kind filter</span>.
        </p>
      </div>
    </div>

    <!-- EXPLORE: split detail canvas — words left, map right -->
    <div v-else-if="view === 'explore' && currentEntity" class="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <div class="flex shrink-0 flex-wrap items-center gap-1 border-b border-default px-3 py-1.5">
          <UButton
            icon="i-lucide-house"
            color="neutral"
            variant="ghost"
            size="xs"
            title="Back to orientation"
            @click="goHome"
          />
          <template v-for="(id, index) in trail" :key="`${index}-${id}`">
            <UIcon v-if="index > 0" name="i-lucide-chevron-right" class="size-3 shrink-0 text-dimmed" />
            <button
              type="button"
              class="max-w-40 truncate rounded px-1 py-0.5 text-xs transition"
              :class="index === trail.length - 1
                ? 'font-medium text-highlighted'
                : 'text-dimmed hover:bg-elevated/60 hover:text-toned'"
              @click="trail = trail.slice(0, index + 1)"
            >
              {{ workspace.byId.get(id)?.title ?? id }}
            </button>
          </template>
          <UButton
            v-if="trail.length > 1"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="xs"
            label="Back"
            class="ms-auto"
            @click="trail = trail.slice(0, -1)"
          />
        </div>
        <div class="blr-pane flex-1 px-4 py-5 sm:px-6">
          <BlrEntityDetail
            :workspace="workspace"
            :entity="currentEntity"
            @select="open($event)"
          />
        </div>
      </div>
      <div class="h-96 shrink-0 border-t border-default lg:h-auto lg:min-h-0 lg:min-w-0 lg:flex-1 lg:shrink lg:border-t-0 lg:border-s">
        <BlrTopology
          :workspace="workspace"
          :focus-id="currentEntity.id"
          @inspect="open($event)"
        />
      </div>
    </div>

    <!-- EXPLORE: orientation panel -->
    <div v-else-if="view === 'explore'" class="blr-pane flex-1">
      <div class="mx-auto w-full max-w-3xl space-y-10 px-4 py-10 sm:px-6">
        <header class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge v-if="workspace.identity.categoryLabel" color="neutral" variant="subtle" size="sm">
              {{ workspace.identity.categoryLabel }}
            </UBadge>
            <UBadge :color="COVERAGE_TONE[workspace.coverage.status] ?? 'neutral'" variant="subtle" size="sm">
              coverage: {{ workspace.coverage.status }}
            </UBadge>
            <UBadge v-if="workspace.identity.license" color="neutral" variant="subtle" size="sm">
              {{ workspace.identity.license }}
            </UBadge>
          </div>
          <h1 class="text-3xl tracking-tight text-highlighted">
            {{ workspace.identity.title }}
          </h1>
          <p class="text-base leading-relaxed text-toned">
            {{ workspace.identity.summary }}
          </p>
          <BlrProse :text="workspace.identity.description" />
          <section v-if="workspace.identity.intent" class="space-y-1.5">
            <h4 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Intent</h4>
            <BlrProse :text="workspace.identity.intent" />
          </section>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span v-for="tag in workspace.identity.tags" :key="tag" class="rounded-full border border-default px-2 py-0.5 text-dimmed">
              {{ tag }}
            </span>
            <span v-for="author in workspace.identity.authors" :key="author.name" class="inline-flex items-center gap-1 text-toned">
              <UIcon name="i-lucide-pen-line" class="size-3 text-dimmed" />
              <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">{{ author.name }}</a>
              <template v-else>{{ author.name }}</template>
            </span>
          </div>
        </header>

        <section class="space-y-3">
          <h2 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">
            What this Product is made of — click a fact to browse that kind
          </h2>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              v-for="fact in compositionFacts"
              :key="fact.meta.kind"
              type="button"
              class="flex flex-col items-start gap-1 rounded-xl border border-default p-3 text-start transition enabled:hover:border-accented enabled:hover:bg-elevated/50 disabled:opacity-45"
              :disabled="!fact.count"
              @click="browseKind(fact.meta.kind)"
            >
              <span class="text-2xl font-light text-highlighted tabular-nums">{{ fact.count }}</span>
              <span class="inline-flex items-center gap-1.5 text-xs text-toned">
                <BlrKind :kind="fact.meta.kind" :labelled="false" size="xs" />
                {{ fact.count === 1 ? fact.meta.label : fact.meta.plural }}
              </span>
            </button>
          </div>
          <p class="font-mono text-[10px] leading-relaxed text-dimmed">
            Derived depth — {{ workspace.counts.steps }} steps ·
            {{ workspace.counts.decisionPoints }} decision points ·
            {{ workspace.counts.branches }} branches ·
            {{ workspace.counts.edgeCases }} edge cases ·
            {{ workspace.counts.screenStates }} screen states ·
            {{ workspace.counts.entryPoints }} entry points ·
            {{ workspace.counts.availabilityPairs }} availability scopes ·
            {{ workspace.counts.references }} references
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Coverage</h2>
          <div class="space-y-3 rounded-xl border border-default p-4">
            <BlrProse :text="workspace.coverage.rationale" />
            <div v-if="workspace.coverage.method.length" class="flex flex-wrap items-baseline gap-1.5 text-xs">
              <span class="font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">Method</span>
              <span v-for="item in workspace.coverage.method" :key="item" class="rounded bg-muted px-1.5 py-0.5 text-toned">{{ item }}</span>
            </div>
            <div v-if="workspace.coverage.sourceAreas.length" class="flex flex-wrap items-baseline gap-1.5 text-xs">
              <span class="font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">Source areas</span>
              <code v-for="item in workspace.coverage.sourceAreas" :key="item" class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-toned">{{ item }}</code>
            </div>
            <div v-if="workspace.coverage.unmapped.length" class="space-y-1">
              <p class="font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">Unmapped</p>
              <ul class="space-y-1 text-xs text-dimmed">
                <li v-for="item in workspace.coverage.unmapped" :key="item" class="flex items-start gap-1.5">
                  <UIcon name="i-lucide-circle-dashed" class="mt-0.5 size-3 shrink-0" />{{ item }}
                </li>
              </ul>
            </div>
            <div v-if="workspace.identity.limitations.length" class="space-y-1">
              <p class="font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">Limitations</p>
              <ul class="space-y-1 text-xs text-dimmed">
                <li v-for="item in workspace.identity.limitations" :key="item" class="flex items-start gap-1.5">
                  <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-3 shrink-0" />{{ item }}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section v-if="workspace.identity.references.length" class="space-y-3">
          <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />
          <p class="text-[11px] text-dimmed">
            {{ workspace.counts.references }} references across the whole model — open any entity to see its own.
          </p>
        </section>

        <section v-if="workspace.identity.supportingContent" class="space-y-1.5">
          <h2 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Supporting context</h2>
          <BlrProse :text="workspace.identity.supportingContent" />
        </section>

        <footer class="border-t border-muted pt-3 font-mono text-[10px] text-dimmed">
          Generated {{ workspace.identity.generatedAt.slice(0, 10) }}
          by {{ workspace.identity.generator.name }} {{ workspace.identity.generator.version }}
          · schema {{ workspace.identity.schemaVersion }}
          · {{ workspace.identity.referenceProfile }} references
        </footer>
      </div>
    </div>

    <!-- PROMISES: journey browser -->
    <div v-else-if="view === 'promises'" class="blr-pane flex-1">
      <div class="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <template v-if="!openJourney">
          <div class="mb-4 flex flex-wrap items-center gap-2">
            <h2 class="text-sm font-medium text-highlighted">
              Journeys · {{ workspace.journeys.length }}
            </h2>
            <span class="text-xs text-dimmed">the promises this Product makes</span>
            <span class="ms-auto flex gap-1">
              <button type="button" class="blx-tab" :data-on="journeyMode === 'cards'" @click="journeyMode = 'cards'">
                <UIcon name="i-lucide-layout-grid" class="size-3.5" /> Cards
              </button>
              <button type="button" class="blx-tab" :data-on="journeyMode === 'table'" @click="journeyMode = 'table'">
                <UIcon name="i-lucide-table-2" class="size-3.5" /> Table
              </button>
            </span>
          </div>

          <p v-if="!workspace.journeys.length" class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-dimmed">
            This model declares no Journeys.
          </p>

          <div v-else-if="journeyMode === 'cards'" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="journey in workspace.journeys"
              :key="journey.id"
              class="cursor-pointer rounded-xl border border-default bg-elevated/30 p-4 transition hover:border-accented hover:bg-elevated/60"
              @click="openJourneyId = journey.id"
            >
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-sm font-medium text-highlighted">{{ journey.title }}</h3>
                <span class="shrink-0 font-mono text-[10px] text-dimmed tabular-nums">{{ journey.stepCount }} steps</span>
              </div>
              <p class="mt-1 text-xs leading-relaxed text-dimmed">{{ firstSentence(journey.lead, 200) }}</p>
              <div class="mt-3 space-y-1.5">
                <BlrLinks :workspace="workspace" :ids="journey.actorIds" kind="actor" :max="3" />
                <BlrLinks :workspace="workspace" :ids="journey.capabilityIds" kind="capability" :max="3" />
                <BlrLinks :workspace="workspace" :ids="journey.screenIds" kind="screen" :max="3" />
                <BlrLinks :workspace="workspace" :ids="journey.ruleIds" kind="rule" :max="3" />
              </div>
              <div class="mt-3 border-t border-muted pt-2">
                <p class="font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">
                  Scenarios · {{ journey.scenarioIds.length }}
                </p>
                <ul class="mt-1 space-y-0.5 text-xs text-toned">
                  <li v-for="scenario in scenariosOf(journey.id)" :key="scenario.id" class="truncate">
                    {{ scenario.title }}
                  </li>
                </ul>
              </div>
              <div class="mt-2 flex flex-wrap gap-1">
                <span v-for="pair in journey.availability" :key="pair.key" class="rounded-full border border-default px-2 py-0.5 text-[10px] text-dimmed">
                  {{ pairLabel(pair) }}
                </span>
              </div>
            </article>
          </div>

          <template v-else>
            <div class="overflow-x-auto rounded-lg border border-default">
              <table class="min-w-full text-xs">
                <thead>
                  <tr class="border-b border-default">
                    <th v-for="head in ['Journey', 'Actors', 'Availability', 'Capabilities', 'Screens', 'Scenarios', 'Rules', 'Steps']" :key="head" class="px-3 py-2 text-start font-mono text-[10px] font-medium tracking-[0.1em] text-dimmed uppercase">
                      {{ head }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="journey in workspace.journeys"
                    :key="journey.id"
                    class="cursor-pointer border-b border-muted last:border-0 hover:bg-elevated/40"
                    @click="openJourneyId = journey.id"
                  >
                    <td class="px-3 py-2">
                      <div class="font-medium text-highlighted">{{ journey.title }}</div>
                      <div class="max-w-64 truncate text-dimmed">{{ firstSentence(journey.lead, 80) }}</div>
                    </td>
                    <td class="px-3 py-2 text-toned">{{ nameList(journey.actorIds) }}</td>
                    <td class="px-3 py-2 text-toned">{{ journey.availability.map(pairLabel).join(', ') || '—' }}</td>
                    <td class="px-3 py-2 text-toned tabular-nums">{{ journey.capabilityIds.length }}</td>
                    <td class="px-3 py-2 text-toned tabular-nums">{{ journey.screenIds.length }}</td>
                    <td class="px-3 py-2 text-toned tabular-nums">{{ journey.scenarioIds.length }}</td>
                    <td class="px-3 py-2 text-toned tabular-nums">{{ journey.ruleIds.length }}</td>
                    <td class="px-3 py-2 text-toned tabular-nums">{{ journey.stepCount }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="mt-2 text-[11px] text-dimmed">
              Counts are derived from authored relations; Steps is the authored step total across each Journey’s Scenarios.
            </p>
          </template>
        </template>

        <!-- Journey detail: the promise, complete -->
        <template v-else>
          <div class="mb-4 flex items-center gap-2">
            <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="xs" label="All Journeys" @click="openJourneyId = null" />
            <UButton icon="i-lucide-compass" color="neutral" variant="outline" size="xs" label="Open in Explore" class="ms-auto" @click="open(openJourney)" />
          </div>
          <header class="max-w-3xl space-y-2">
            <BlrKind kind="journey" />
            <h2 class="text-2xl tracking-tight text-highlighted">{{ openJourney.title }}</h2>
            <BlrProse :text="openJourney.lead" />
            <section v-if="openJourney.intent" class="space-y-1.5">
              <h4 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Intent</h4>
              <BlrProse :text="openJourney.intent" />
            </section>
          </header>
          <div class="mt-4 max-w-3xl space-y-1.5">
            <BlrLinks :workspace="workspace" :ids="openJourney.actorIds" kind="actor" interactive @select="open($event)" />
            <BlrLinks :workspace="workspace" :ids="openJourney.capabilityIds" kind="capability" interactive @select="open($event)" />
            <BlrLinks :workspace="workspace" :ids="openJourney.domainIds" kind="domain" label="Domains (derived)" interactive @select="open($event)" />
            <BlrLinks :workspace="workspace" :ids="openJourney.screenIds" kind="screen" label="Screens (derived)" interactive @select="open($event)" />
            <BlrLinks :workspace="workspace" :ids="openJourney.ruleIds" kind="rule" label="Constrained by" interactive @select="open($event)" />
          </div>
          <BlrAvail class="mt-4 max-w-3xl" :pairs="openJourney.availability" :entry-points="openJourney.entryPoints" />

          <section class="mt-8 max-w-3xl space-y-4">
            <h3 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">
              Scenarios · {{ openJourney.scenarioIds.length }}
            </h3>
            <p v-if="!scenariosOf(openJourney.id).length" class="text-sm text-dimmed italic">
              No Scenarios authored for this Journey.
            </p>
            <!-- BlrEntityDetail is the completeness guarantee: trigger, ordered
                 steps, decision branches, outcome, edge cases, links, scope. -->
            <article
              v-for="scenario in scenariosOf(openJourney.id)"
              :key="scenario.id"
              class="rounded-xl border border-default p-4"
            >
              <BlrEntityDetail :workspace="workspace" :entity="scenario" @select="open($event)" />
            </article>
          </section>
        </template>
      </div>
    </div>

    <!-- SURFACE: the shared Screen map with a journey overlay -->
    <div v-else-if="view === 'surface'" class="flex min-h-0 flex-1 flex-col">
      <template v-if="workspace.interfaces.length">
        <div class="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-default px-4 py-2 sm:px-6">
          <span class="me-1 font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">Journey overlay</span>
          <button type="button" class="blx-tab" :data-on="overlayJourneyId === null" @click="overlayJourneyId = null">
            All Screens
          </button>
          <button
            v-for="journey in workspace.journeys"
            :key="journey.id"
            type="button"
            class="blx-tab"
            :data-on="overlayJourneyId === journey.id"
            @click="overlayJourneyId = overlayJourneyId === journey.id ? null : journey.id"
          >
            <BlrKind kind="journey" :labelled="false" size="xs" />
            {{ journey.title }}
            <span class="font-mono text-[10px] text-dimmed tabular-nums">{{ journey.screenIds.length }}</span>
          </button>
          <span v-if="overlayJourney" class="ms-auto text-[11px] text-dimmed">
            {{ overlayJourney.screenIds.length }} of {{ workspace.screens.length }} Screens serve “{{ overlayJourney.title }}” — click any box to open it.
          </span>
          <span v-else class="ms-auto hidden text-[11px] text-dimmed sm:inline">
            Click a Screen, Experience or Interface to open it in Explore.
          </span>
        </div>
        <div class="min-h-0 flex-1">
          <BlrFlowCanvas
            :nodes="screenMap.nodes"
            :edges="screenMap.edges"
            @select="open($event)"
            @focus="open($event)"
          />
        </div>
      </template>
      <p v-else class="m-auto max-w-md rounded-lg border border-dashed border-default p-6 text-center text-sm text-dimmed">
        This model declares no Interfaces — there is no visible surface to map.
      </p>
    </div>

    <!-- ABILITIES: capability map by Domain + named matrices -->
    <div v-else-if="view === 'abilities'" class="blr-pane flex-1">
      <div class="mx-auto w-full max-w-6xl space-y-8 px-4 py-5 sm:px-6">
        <p v-if="!workspace.capabilities.length" class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-dimmed">
          This model declares no Capabilities.
        </p>
        <section v-for="group in domainGroups" :key="group.id || 'none'" class="space-y-3">
          <div class="flex flex-wrap items-baseline gap-2">
            <BlrKind kind="domain" :labelled="false" />
            <h2 class="text-sm font-medium text-highlighted">{{ group.title }}</h2>
            <span class="text-xs text-dimmed">{{ group.lead }}</span>
            <UButton
              v-if="group.id"
              icon="i-lucide-compass"
              color="neutral"
              variant="ghost"
              size="xs"
              class="ms-auto"
              title="Open this Domain in Explore"
              @click="open(group.id)"
            />
          </div>
          <p v-if="!group.capabilities.length" class="text-xs text-dimmed italic">
            No Capabilities mapped to this Domain.
          </p>
          <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="capability in group.capabilities"
              :key="capability.id"
              class="cursor-pointer rounded-xl border border-default bg-elevated/30 p-4 transition hover:border-accented hover:bg-elevated/60"
              @click="open(capability)"
            >
              <div class="flex items-center gap-2">
                <BlrKind kind="capability" :labelled="false" />
                <h3 class="text-sm font-medium text-highlighted">{{ capability.title }}</h3>
              </div>
              <p class="mt-1.5 text-xs leading-relaxed text-dimmed">{{ firstSentence(capability.lead, 180) }}</p>
              <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1" title="Derived from authored relations">
                <BlrKind kind="journey" :count="capability.journeyIds.length" size="xs" />
                <BlrKind kind="screen" :count="capability.screenIds.length" size="xs" />
                <BlrKind kind="rule" :count="capability.ruleIds.length" size="xs" />
              </div>
              <div class="mt-2 flex flex-wrap gap-1">
                <span v-for="pair in capability.availability" :key="pair.key" class="rounded-full border border-default px-2 py-0.5 text-[10px] text-dimmed">
                  {{ pairLabel(pair) }}
                </span>
              </div>
            </article>
          </div>
        </section>

        <section v-for="matrix in matrices" :key="matrix.id" class="space-y-2">
          <div>
            <h3 class="text-sm font-medium text-highlighted">{{ matrix.question }}</h3>
            <p class="text-xs text-dimmed">{{ matrix.note }} Click a filled cell for the relationship.</p>
          </div>
          <div class="overflow-x-auto rounded-lg border border-default">
            <table class="blx-matrix">
              <thead>
                <tr>
                  <th class="blx-row-head">
                    <span class="font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">Capability</span>
                  </th>
                  <th v-for="column in matrix.columns" :key="column.id" class="blx-col-head" :title="column.title">
                    <span class="blx-col-label">{{ column.title }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="capability in workspace.capabilities" :key="capability.id">
                  <th class="blx-row-head">
                    <button type="button" class="flex items-center gap-1.5 text-xs text-toned hover:text-highlighted" @click="open(capability)">
                      <BlrKind kind="capability" :labelled="false" size="xs" />
                      <span class="max-w-44 truncate">{{ capability.title }}</span>
                    </button>
                  </th>
                  <td v-for="column in matrix.columns" :key="column.id" class="blx-cell">
                    <button
                      v-if="matrix.filled(capability, column.id)"
                      type="button"
                      class="blx-dot"
                      :data-on="matrixCell?.matrixId === matrix.id && matrixCell?.capId === capability.id && matrixCell?.columnId === column.id ? 'true' : undefined"
                      :title="matrix.explain(capability, column)"
                      :aria-label="matrix.explain(capability, column)"
                      @click="selectCell(matrix.id, capability.id, column.id)"
                    />
                    <span v-else class="blx-empty">·</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            v-if="cellExplanation && cellExplanation.matrixId === matrix.id"
            class="flex flex-wrap items-center gap-2 rounded-lg border border-default bg-elevated/40 px-3 py-2"
          >
            <p class="text-xs text-toned">{{ cellExplanation.text }}</p>
            <UButton size="xs" color="neutral" variant="outline" :label="`Open ${cellExplanation.capTitle}`" @click="open(cellExplanation.capId)" />
            <UButton size="xs" color="neutral" variant="outline" :label="`Open ${cellExplanation.colTitle}`" @click="open(cellExplanation.colEntityId)" />
            <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" class="ms-auto" @click="matrixCell = null" />
          </div>
        </section>
      </div>
    </div>

    <!-- CONSTRAINTS: rule impact -->
    <div v-else-if="view === 'constraints'" class="blr-pane flex-1">
      <div class="mx-auto w-full max-w-4xl space-y-5 px-4 py-5 sm:px-6">
        <p v-if="!workspace.rules.length" class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-dimmed">
          This model declares no Business rules.
        </p>
        <template v-else>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="rule in workspace.rules"
              :key="rule.id"
              type="button"
              class="blx-tab"
              :data-on="currentRule?.id === rule.id"
              @click="currentRuleId = rule.id"
            >
              <BlrKind kind="rule" :labelled="false" size="xs" />
              {{ rule.title }}
            </button>
          </div>

          <template v-if="currentRule">
            <header class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <BlrKind kind="rule" />
                <h2 class="text-xl tracking-tight text-highlighted">{{ currentRule.title }}</h2>
                <UButton icon="i-lucide-compass" color="neutral" variant="outline" size="xs" label="Open impact map" class="ms-auto" title="Open in Explore — full content plus the contextual topology" @click="open(currentRule)" />
              </div>
              <div class="rounded-xl border-s-2 border-primary bg-elevated/40 p-4">
                <BlrProse :text="currentRule.statement" size="base" />
              </div>
              <section v-if="currentRule.rationale" class="space-y-1.5">
                <h4 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">Rationale</h4>
                <BlrProse :text="currentRule.rationale" />
              </section>
            </header>

            <section class="space-y-2">
              <h3 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">
                Directly attached to · {{ ruleDirect.length }}
              </h3>
              <p v-if="!ruleDirect.length" class="text-xs text-dimmed italic">
                This Rule names no direct attachments.
              </p>
              <div v-else class="flex flex-wrap gap-1.5">
                <button
                  v-for="entity in ruleDirect"
                  :key="entity.id"
                  type="button"
                  class="blx-chip blx-direct"
                  @click="open(entity)"
                >
                  <BlrKind :kind="entity.kind" :labelled="false" size="xs" />
                  {{ entity.title }}
                </button>
              </div>
            </section>

            <section class="space-y-3">
              <h3 class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">
                Derived reach — dashed means implied, not authored
              </h3>
              <p v-if="!ruleDerived.length" class="text-xs text-dimmed italic">
                No further reach derives from the direct attachments.
              </p>
              <div v-for="group in ruleDerived" :key="group.label" class="space-y-1.5">
                <p class="text-[11px] text-dimmed">{{ group.label }}</p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="entity in group.entities"
                    :key="entity.id"
                    type="button"
                    class="blx-chip blx-derived"
                    @click="open(entity)"
                  >
                    <BlrKind :kind="entity.kind" :labelled="false" size="xs" />
                    {{ entity.title }}
                  </button>
                </div>
              </div>
            </section>

            <BlrAvail
              :pairs="currentRule.availability"
              label="Scoped to"
              inherited-note="Not narrowed — the Rule applies wherever its attachments are available."
            />
          </template>
        </template>
      </div>
    </div>

    <!-- ACCESS: actors and access-context comparison -->
    <div v-else-if="view === 'access'" class="blr-pane flex-1">
      <div class="mx-auto w-full max-w-6xl space-y-8 px-4 py-5 sm:px-6">
        <section class="space-y-3">
          <div>
            <h2 class="text-sm font-medium text-highlighted">Actors · {{ workspace.actors.length }}</h2>
            <p class="text-xs text-dimmed">Who the Product serves, and where each one gets in.</p>
          </div>
          <p v-if="!workspace.actors.length" class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-dimmed">
            This model declares no Actors.
          </p>
          <div v-else class="grid gap-3 md:grid-cols-2">
            <article v-for="actor in workspace.actors" :key="actor.id" class="space-y-2.5 rounded-xl border border-default p-4">
              <div class="flex flex-wrap items-center gap-2">
                <BlrKind kind="actor" :labelled="false" />
                <h3 class="text-sm font-medium text-highlighted">{{ actor.title }}</h3>
                <UBadge color="neutral" variant="subtle" size="sm">{{ actor.actorKind }} · {{ actor.relationship }}</UBadge>
                <UButton icon="i-lucide-compass" color="neutral" variant="ghost" size="xs" class="ms-auto" title="Open in Explore" @click="open(actor)" />
              </div>
              <p class="text-xs leading-relaxed text-dimmed">{{ firstSentence(actor.lead, 220) }}</p>
              <div class="space-y-1.5">
                <BlrLinks :workspace="workspace" :ids="actor.interfaceIds" kind="interface" label="Enters" interactive @select="open($event)" />
                <BlrLinks :workspace="workspace" :ids="actor.experienceIds" kind="experience" label="Within" interactive @select="open($event)" />
                <BlrLinks :workspace="workspace" :ids="actor.journeyIds" kind="journey" label="Performs" interactive @select="open($event)" />
              </div>
            </article>
          </div>
        </section>

        <section class="space-y-3">
          <div>
            <h2 class="text-sm font-medium text-highlighted">
              Access contexts · {{ workspace.interfaces.length + workspace.experiences.length }}
            </h2>
            <p class="text-xs text-dimmed">
              Interfaces and the Experiences inside them — who enters, where, and what each context makes reachable. Scope counts are derived from authored availability.
            </p>
          </div>
          <p v-if="!workspace.interfaces.length" class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-dimmed">
            This model declares no Interfaces.
          </p>
          <div v-else class="grid gap-3 lg:grid-cols-2">
            <article v-for="ctx in accessContexts" :key="ctx.entity.id" class="space-y-2.5 rounded-xl border border-default p-4">
              <div class="flex flex-wrap items-center gap-2">
                <BlrKind :kind="ctx.entity.kind" />
                <h3 class="text-sm font-medium text-highlighted">{{ ctx.entity.title }}</h3>
                <UBadge v-if="ctx.badge" :color="ctx.badge.color" variant="subtle" size="sm">{{ ctx.badge.label }}</UBadge>
                <UButton icon="i-lucide-compass" color="neutral" variant="ghost" size="xs" class="ms-auto" title="Open in Explore" @click="open(ctx.entity)" />
              </div>
              <p class="text-xs leading-relaxed text-dimmed">{{ ctx.lead }}</p>
              <div class="space-y-1.5">
                <BlrLinks
                  v-for="row in ctx.links"
                  :key="row.label"
                  :workspace="workspace"
                  :ids="row.ids"
                  :kind="row.kind"
                  :label="row.label"
                  interactive
                  @select="open($event)"
                />
                <BlrAvail :pairs="[]" :entry-points="ctx.entryPoints" label="Entry points" />
              </div>
              <div v-if="ctx.boundary" class="space-y-1 border-t border-muted pt-2">
                <p class="font-mono text-[10px] tracking-[0.1em] text-dimmed uppercase">Capability boundary</p>
                <p class="text-xs leading-relaxed text-toned">{{ ctx.boundary }}</p>
              </div>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-muted pt-2" title="Derived from authored availability">
                <BlrKind kind="capability" :count="ctx.scope.capabilities" size="xs" />
                <BlrKind kind="screen" :count="ctx.scope.screens" size="xs" />
                <BlrKind kind="journey" :count="ctx.scope.journeys" size="xs" />
                <span class="font-mono text-[10px] text-dimmed">derived scope</span>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The omnibox: the design's one strong focal element. */
.blx-omni {
  width: 100%;
  border: 1px solid var(--ui-border);
  border-radius: 0.75rem;
  background: var(--ui-bg-elevated);
  padding: 0.55rem 2.5rem;
  font-size: 0.95rem;
  color: var(--ui-text-highlighted);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.blx-omni::placeholder { color: var(--ui-text-dimmed); }
.blx-omni:focus {
  border-color: color-mix(in srgb, var(--ui-primary) 60%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ui-primary) 16%, transparent);
}
.blx-kbd {
  position: absolute;
  inset-inline-end: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  border: 1px solid var(--ui-border);
  border-radius: 0.3rem;
  padding: 0.05rem 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--ui-text-dimmed);
}

/* One keyboard-navigable result row. */
.blx-result {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  padding: 0.5rem 0.625rem;
  text-align: start;
}
.blx-result[data-active='true'] {
  border-color: var(--ui-border);
  background: var(--ui-bg-elevated);
}

/* The quiet pill used for view tabs, mode toggles and overlay chips. */
.blx-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: 9999px;
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
  color: var(--ui-text-dimmed);
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}
.blx-tab:hover { color: var(--ui-text-toned); }
.blx-tab[data-on='true'] {
  border-color: var(--ui-border);
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

/* Rule impact chips: solid = authored attachment, dashed = derived reach. */
.blx-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 0.5rem;
  padding: 0.25rem 0.55rem;
  font-size: 0.75rem;
  color: var(--ui-text-toned);
  transition: background 0.15s ease;
}
.blx-chip:hover { background: var(--ui-bg-elevated); }
.blx-direct {
  border: 1px solid color-mix(in srgb, var(--ui-primary) 45%, transparent);
  background: color-mix(in srgb, var(--ui-primary) 8%, transparent);
}
.blx-derived { border: 1px dashed var(--ui-border-accented); }

/* Named matrices: sticky row heads, bottom-up column labels, dot cells. */
.blx-matrix { border-collapse: separate; border-spacing: 0; font-size: 0.75rem; }
.blx-matrix th,
.blx-matrix td { border-bottom: 1px solid var(--ui-border-muted); }
.blx-matrix tr:last-child > * { border-bottom: 0; }
.blx-row-head {
  position: sticky;
  inset-inline-start: 0;
  z-index: 1;
  background: var(--ui-bg);
  padding: 0.45rem 0.75rem;
  text-align: start;
  font-weight: 500;
}
.blx-col-head { padding: 0.5rem 0.3rem; vertical-align: bottom; }
.blx-col-label {
  display: inline-block;
  overflow: hidden;
  max-height: 8.5rem;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.7rem;
  color: var(--ui-text-dimmed);
}
.blx-cell { padding: 0.2rem; text-align: center; }
.blx-dot {
  width: 1.15rem;
  height: 1.15rem;
  border: 1px solid transparent;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--ui-primary) 75%, transparent);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.blx-dot:hover { transform: scale(1.15); }
.blx-dot[data-on='true'] {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ui-primary) 25%, transparent);
}
.blx-empty { color: color-mix(in srgb, var(--ui-text-dimmed) 40%, transparent); }
</style>
