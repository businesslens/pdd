<script setup lang="ts">
/**
 * Inquiry — the Product questions are the navigation.
 *
 * IA: home is a numbered wall of eight questions, each an editorial card with
 * a factual teaser derived from the model. Opening a question fills the
 * surface with the one view built to answer it — identity, access contexts,
 * the shared Screen map with a promise overlay, the Journey browser
 * (cards ⇄ comparison table ⇄ full promise detail with complete Scenarios),
 * the Capability map with two named matrices, Business-Rule impact with
 * direct and derived reach kept apart, one Scenario read as a vertical flow,
 * and contextual topology behind an entity picker. The question stays in the
 * header with its number, and a persistent "Questions" control returns home.
 * Selecting an entity anywhere docks a panel with the complete entity content
 * (BlrEntityDetail) and a map toggle (BlrTopology). Nothing is scored: every
 * number is a count derived from the model, labelled derived where ambiguous.
 */
import type {
  AnyEntityView,
  CapabilityView,
  ExperienceView,
  InterfaceView,
  ReportEntityKind,
  ReportWorkspace,
  WorkspaceCounts
} from '../utils/reportWorkspace'
import { REPORT_ENTITY_KINDS } from '../utils/reportWorkspace'
import { buildScreenMap } from '../utils/flowGraph'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

type QuestionId = 'identity' | 'access' | 'surfaces' | 'promises' | 'capabilities' | 'rules' | 'cases' | 'connections'

interface QuestionCard {
  id: QuestionId
  no: string
  question: string
  teaser: string
  kinds: ReportEntityKind[]
}

/* ---------- navigation ---------- */
const activeQuestion = ref<QuestionId | null>(null)
const inspectedId = ref<string | null>(null)
const inspectorMode = ref<'detail' | 'map'>('detail')

/* Per-question state, kept so returning to a question restores its reading. */
const overlayJourneyId = ref<string | null>(null)
const journeyLens = ref<'cards' | 'table'>('cards')
const openJourneyId = ref<string | null>(null)
const matrixCell = ref<{ matrix: 'promise' | 'exposure', capId: string, otherId: string } | null>(null)
const flowScenarioId = ref<string | null>(null)
const topologyFocusId = ref<string | null>(null)

const plural = (count: number, singular: string, pluralForm?: string) =>
  `${count} ${count === 1 ? singular : (pluralForm ?? `${singular}s`)}`

const questions = computed<QuestionCard[]>(() => {
  const c = props.workspace.counts
  const directAttachments = props.workspace.rules.reduce((total, rule) =>
    total + rule.domainIds.length + rule.capabilityIds.length + rule.journeyIds.length + rule.scenarioIds.length, 0)
  const cards: Array<Omit<QuestionCard, 'no'>> = [
    { id: 'identity', question: 'What is this Product?', teaser: firstSentence(props.workspace.identity.summary) || 'Its identity, coverage and counts.', kinds: [] },
    { id: 'access', question: 'Who uses it, and how do they get in?', teaser: `${plural(c.actors, 'actor')} enter${c.actors === 1 ? 's' : ''} through ${plural(c.interfaces, 'interface')}${c.experiences ? ` and ${plural(c.experiences, 'experience')}` : ''}`, kinds: ['actor', 'interface', ...(c.experiences ? ['experience' as const] : [])] },
    { id: 'surfaces', question: 'What does each surface show?', teaser: c.screens ? `${plural(c.screens, 'screen')} across ${plural(c.interfaces, 'interface')}` : 'No Screens — the surfaces here are not graphical', kinds: ['screen', 'interface', ...(c.experiences ? ['experience' as const] : [])] },
    { id: 'promises', question: 'What promises does it keep?', teaser: `${plural(c.journeys, 'promise')}, told through ${plural(c.scenarios, 'scenario')}`, kinds: ['journey', 'scenario', 'actor'] },
    { id: 'capabilities', question: 'What can it durably do?', teaser: `${plural(c.capabilities, 'capability', 'capabilities')} in ${plural(c.domains, 'domain')}`, kinds: ['capability', 'domain'] },
    { id: 'rules', question: 'What must always hold?', teaser: `${plural(c.rules, 'rule')} with ${plural(directAttachments, 'direct attachment')}`, kinds: ['rule'] },
    { id: 'cases', question: 'How does one case complete?', teaser: `${plural(c.scenarios, 'case')} told in ${plural(c.steps, 'step')} and ${plural(c.decisionPoints, 'decision')}`, kinds: ['scenario', 'screen', 'rule'] },
    { id: 'connections', question: 'What connects to this?', teaser: `${props.workspace.byId.size} entities; every one has a neighbourhood`, kinds: ['journey', 'capability', 'screen', 'rule'] }
  ]
  return cards.map((entry, index) => ({ ...entry, no: String(index + 1).padStart(2, '0') }))
})

const activeCard = computed(() => questions.value.find(item => item.id === activeQuestion.value) ?? null)
const inspectedEntity = computed(() => (inspectedId.value && props.workspace.byId.get(inspectedId.value)) || null)

function openQuestion(id: QuestionId) {
  activeQuestion.value = id
}
function goHome() {
  activeQuestion.value = null
}
function inspect(entity: AnyEntityView) {
  inspectedId.value = entity.id
  inspectorMode.value = 'detail'
}
function inspectById(entityId: string) {
  const entity = props.workspace.byId.get(entityId)
  if (entity) inspect(entity)
}

/* ---------- Q2 access contexts ---------- */
interface AccessContextRow {
  entity: InterfaceView | ExperienceView
  accessMode: 'public' | 'authenticated' | 'restricted' | null
  relatedIds: string[]
  relatedKind: ReportEntityKind
  relatedLabel: string
}
const accessContexts = computed<AccessContextRow[]>(() => ([
  ...props.workspace.interfaces.map(item => ({
    entity: item as InterfaceView | ExperienceView,
    accessMode: null,
    relatedIds: item.experienceIds,
    relatedKind: 'experience' as const,
    relatedLabel: 'Experiences within'
  })),
  ...props.workspace.experiences.map(item => ({
    entity: item as InterfaceView | ExperienceView,
    accessMode: item.accessMode,
    relatedIds: item.interfaceIds,
    relatedKind: 'interface' as const,
    relatedLabel: 'Within Interfaces'
  }))
]))

/* ---------- Q3 Screen map ---------- */
const overlayJourney = computed(() => {
  const entity = overlayJourneyId.value ? props.workspace.byId.get(overlayJourneyId.value) : null
  return entity?.kind === 'journey' ? entity : null
})
const screenMap = computed(() => buildScreenMap(props.workspace, {
  emphasizeScreenIds: overlayJourney.value ? new Set(overlayJourney.value.screenIds) : null,
  selectedId: inspectedId.value
}))
function toggleOverlay(journeyId: string) {
  overlayJourneyId.value = overlayJourneyId.value === journeyId ? null : journeyId
}

/* ---------- Q4 promises ---------- */
const openJourney = computed(() => {
  const entity = openJourneyId.value ? props.workspace.byId.get(openJourneyId.value) : null
  return entity?.kind === 'journey' ? entity : null
})
const openJourneyScenarios = computed(() =>
  openJourney.value ? props.workspace.scenariosByJourney.get(openJourney.value.id) ?? [] : [])

/* ---------- Q5 capability map and named matrices ---------- */
interface MatrixDef {
  id: 'promise' | 'exposure'
  question: string
  note: string
  cols: AnyEntityView[]
  filled: (capability: CapabilityView, colId: string) => boolean
  emptyNote: string
}
const matrices = computed<MatrixDef[]>(() => [
  {
    id: 'promise',
    question: 'Which promises depend on each Capability?',
    note: 'A dot marks a Journey that declares the Capability. Click any cell for the sentence.',
    cols: props.workspace.journeys,
    filled: (capability, colId) => capability.journeyIds.includes(colId),
    emptyNote: 'No Journeys in this model, so nothing depends on these Capabilities yet.'
  },
  {
    id: 'exposure',
    question: 'Where is each Capability exposed?',
    note: 'A dot marks a Screen that exposes the Capability. Click any cell for the sentence.',
    cols: props.workspace.screens,
    filled: (capability, colId) => capability.screenIds.includes(colId),
    emptyNote: 'No Screens in this model — these Capabilities are reached without a graphical surface.'
  }
])
const domainGroups = computed(() => {
  const groups = props.workspace.domains.map(domain => ({
    id: domain.id,
    title: domain.title,
    lead: firstSentence(domain.lead),
    capabilities: props.workspace.capabilitiesByDomain.get(domain.id) ?? []
  }))
  const undomained = props.workspace.capabilitiesByDomain.get('') ?? []
  if (undomained.length) groups.push({ id: '', title: 'No Domain', lead: 'Capabilities the model leaves ungrouped.', capabilities: undomained })
  return groups
})
function selectCell(matrix: 'promise' | 'exposure', capId: string, otherId: string) {
  const current = matrixCell.value
  matrixCell.value = current && current.matrix === matrix && current.capId === capId && current.otherId === otherId
    ? null
    : { matrix, capId, otherId }
}
const matrixExplanation = computed(() => {
  const cell = matrixCell.value
  if (!cell) return null
  const capability = props.workspace.byId.get(cell.capId)
  const other = props.workspace.byId.get(cell.otherId)
  if (capability?.kind !== 'capability' || !other) return null
  if (cell.matrix === 'promise' && other.kind === 'journey') {
    const sentence = other.capabilityIds.includes(capability.id)
      ? `“${other.title}” uses “${capability.title}” — one of ${plural(other.capabilityIds.length, 'Capability', 'Capabilities')} the promise declares. In turn, ${capability.journeyIds.length} of ${props.workspace.counts.journeys} Journeys depend on this Capability.`
      : `“${other.title}” completes without “${capability.title}”: the Journey never declares it.`
    return { sentence, capability, other }
  }
  if (cell.matrix === 'exposure' && other.kind === 'screen') {
    const where = other.availability.map(pair => pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : pair.interfaceTitle).join(', ')
    const sentence = other.capabilityIds.includes(capability.id)
      ? `“${other.title}” exposes “${capability.title}”${where ? ` in ${where}` : ''}; the Capability appears on ${plural(capability.screenIds.length, 'Screen')} in total.`
      : `“${other.title}” does not expose “${capability.title}”.`
    return { sentence, capability, other }
  }
  return null
})

/* ---------- Q6 rule impact: direct is authored, everything else computed ---------- */
const ruleImpacts = computed(() => props.workspace.rules.map((rule) => {
  const directJourneys = new Set(rule.journeyIds)
  const directDomains = new Set(rule.domainIds)
  const constrainedScenarios = new Set(rule.scenarioIds)
  return {
    rule,
    derivedJourneyIds: props.workspace.journeys
      .filter(journey => !directJourneys.has(journey.id) && journey.ruleIds.includes(rule.id))
      .map(journey => journey.id),
    derivedDomainIds: props.workspace.domains
      .filter(domain => !directDomains.has(domain.id) && domain.ruleIds.includes(rule.id))
      .map(domain => domain.id),
    derivedScreenIds: props.workspace.screens
      .filter(screen => screen.scenarioIds.some(id => constrainedScenarios.has(id)))
      .map(screen => screen.id)
  }
}))

/* ---------- Q7 scenario flow ---------- */
const scenarioGroups = computed(() => props.workspace.journeys
  .map(journey => ({ journey, scenarios: props.workspace.scenariosByJourney.get(journey.id) ?? [] }))
  .filter(group => group.scenarios.length > 0))
const flowScenario = computed(() => {
  const entity = flowScenarioId.value ? props.workspace.byId.get(flowScenarioId.value) : null
  if (entity?.kind === 'scenario') return entity
  return props.workspace.scenarios[0] ?? null
})

/* ---------- Q8 topology picker ---------- */
const topologyFocus = computed(() =>
  (topologyFocusId.value && props.workspace.byId.get(topologyFocusId.value)) || null)
function listOfKind(kind: ReportEntityKind): AnyEntityView[] {
  const ws = props.workspace
  switch (kind) {
    case 'actor': return ws.actors
    case 'interface': return ws.interfaces
    case 'experience': return ws.experiences
    case 'screen': return ws.screens
    case 'domain': return ws.domains
    case 'capability': return ws.capabilities
    case 'journey': return ws.journeys
    case 'scenario': return ws.scenarios
    case 'rule': return ws.rules
    default: return []
  }
}
const pickerGroups = computed(() => REPORT_ENTITY_KINDS
  .map(meta => ({ meta, entities: listOfKind(meta.kind) }))
  .filter(group => group.entities.length > 0))

/* ---------- Q1 identity rows ---------- */
const MODEL_COUNT_ROWS: Array<{ key: keyof WorkspaceCounts, label: string }> = [
  { key: 'actors', label: 'Actors' },
  { key: 'interfaces', label: 'Interfaces' },
  { key: 'experiences', label: 'Experiences' },
  { key: 'screens', label: 'Screens' },
  { key: 'domains', label: 'Domains' },
  { key: 'capabilities', label: 'Capabilities' },
  { key: 'journeys', label: 'Journeys' },
  { key: 'scenarios', label: 'Scenarios' },
  { key: 'rules', label: 'Business rules' }
]
const DERIVED_COUNT_ROWS: Array<{ key: keyof WorkspaceCounts, label: string }> = [
  { key: 'steps', label: 'Authored steps' },
  { key: 'decisionPoints', label: 'Decision points' },
  { key: 'branches', label: 'Decision branches' },
  { key: 'edgeCases', label: 'Edge cases' },
  { key: 'screenStates', label: 'Screen states' },
  { key: 'entryPoints', label: 'Entry points' },
  { key: 'references', label: 'References' },
  { key: 'availabilityPairs', label: 'Availability scopes' }
]
const coverageLists = computed(() => [
  { label: 'Method', items: props.workspace.coverage.method },
  { label: 'Source areas', items: props.workspace.coverage.sourceAreas },
  { label: 'Unmapped', items: props.workspace.coverage.unmapped },
  { label: 'Coverage limitations', items: props.workspace.coverage.limitations }
].filter(group => group.items.length > 0))
const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'neutral'> = { complete: 'success', partial: 'warning', draft: 'neutral' }
const ACCESS_TONE: Record<string, 'success' | 'warning' | 'error'> = { public: 'success', authenticated: 'warning', restricted: 'error' }
</script>

<template>
  <div class="relative flex h-full min-h-0 flex-col overflow-hidden">
    <!-- Persistent breadcrumb: the way back to the questions is always one click. -->
    <header class="flex min-h-12 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-default px-1 py-2 sm:px-2">
      <UButton v-if="activeCard" icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" label="Questions" @click="goHome" />
      <span v-else class="inline-flex min-w-0 items-center gap-2 px-2">
        <img v-if="logoSrc" :src="logoSrc" alt="" class="size-5 rounded">
        <UIcon v-else name="i-lucide-circle-help" class="size-4 text-primary" />
        <span class="truncate text-sm font-semibold tracking-tight text-highlighted">{{ workspace.identity.title }}</span>
        <span class="hidden text-xs text-dimmed sm:inline">— read as {{ questions.length }} questions</span>
      </span>
      <template v-if="activeCard">
        <span class="font-mono text-[10px] tracking-[0.16em] text-dimmed uppercase">No. {{ activeCard.no }}</span>
        <span class="min-w-0 flex-1 truncate text-sm font-medium tracking-tight text-highlighted">{{ activeCard.question }}</span>
      </template>
    </header>

    <div class="min-h-0 flex-1">
      <!-- ================= Home: the wall of questions ================= -->
      <div v-if="!activeCard" class="blr-pane h-full">
        <div class="mx-auto w-full max-w-7xl py-10 sm:py-14">
          <header class="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-default pb-8">
            <div class="min-w-0">
              <p class="inq-kicker">Product report · {{ workspace.identity.generatedAt }}</p>
              <h1 class="inq-title mt-3 text-highlighted">{{ workspace.identity.title }}</h1>
              <p class="mt-3 max-w-2xl text-sm leading-relaxed text-toned">{{ workspace.identity.summary }}</p>
            </div>
            <img v-if="logoSrc" :src="logoSrc" alt="" class="size-14 shrink-0 rounded-lg border border-default">
          </header>
          <p class="inq-kicker mb-5">A table of contents of questions — open one to read its answer</p>
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <button v-for="item in questions" :key="item.id" type="button" class="inq-card group flex flex-col gap-3 rounded-xl border border-default bg-elevated/30 p-5 text-start transition hover:border-accented hover:bg-elevated/60" @click="openQuestion(item.id)">
              <span class="inq-number">{{ item.no }}</span>
              <span class="inq-headline text-lg leading-snug font-semibold text-highlighted">{{ item.question }}</span>
              <span class="text-xs leading-relaxed text-dimmed">{{ item.teaser }}</span>
              <span class="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-2">
                <BlrKind v-for="kind in item.kinds" :key="kind" :kind="kind" size="xs" />
              </span>
            </button>
          </div>
          <p class="mt-8 text-[11px] text-dimmed">
            Coverage {{ workspace.coverage.status }} · generated by {{ workspace.identity.generator.name }} {{ workspace.identity.generator.version }} · every number on this page is a count derived from the model.
          </p>
        </div>
      </div>

      <!-- ================= 01 · What is this Product? ================= -->
      <div v-else-if="activeQuestion === 'identity'" class="blr-pane h-full">
        <div class="mx-auto w-full max-w-4xl py-10">
          <header class="mb-8 border-b border-default pb-6">
            <p class="inq-kicker">Question {{ activeCard.no }}</p>
            <h2 class="inq-headline mt-2 text-3xl font-semibold text-highlighted sm:text-4xl">{{ activeCard.question }}</h2>
          </header>
          <div class="flex flex-wrap items-center gap-1.5">
            <UBadge v-if="workspace.identity.categoryLabel" color="primary" variant="subtle" size="sm">{{ workspace.identity.categoryLabel }}</UBadge>
            <UBadge v-for="tag in workspace.identity.tags" :key="tag" color="neutral" variant="subtle" size="sm">{{ tag }}</UBadge>
          </div>
          <p class="mt-4 text-lg leading-relaxed text-toned">{{ workspace.identity.summary }}</p>
          <BlrProse :text="workspace.identity.description" size="base" class="mt-4" />
          <section v-if="workspace.identity.intent" class="mt-6">
            <p class="inq-kicker">Intent</p>
            <BlrProse :text="workspace.identity.intent" class="mt-1.5" />
          </section>
          <section v-if="workspace.identity.supportingContent" class="mt-6">
            <p class="inq-kicker">Supporting context</p>
            <BlrProse :text="workspace.identity.supportingContent" class="mt-1.5" />
          </section>
          <section v-if="workspace.identity.authors.length" class="mt-6">
            <p class="inq-kicker">Authors</p>
            <ul class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <li v-for="author in workspace.identity.authors" :key="author.name">
                <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">{{ author.name }}</a>
                <span v-else class="text-toned">{{ author.name }}</span>
              </li>
            </ul>
          </section>
          <section class="mt-8 rounded-xl border border-default p-5">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="inq-section !mb-0">Coverage</h3>
              <UBadge :color="COVERAGE_TONE[workspace.coverage.status] ?? 'neutral'" variant="subtle" size="sm">{{ workspace.coverage.status }}</UBadge>
            </div>
            <BlrProse v-if="workspace.coverage.rationale" :text="workspace.coverage.rationale" class="mt-3" />
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div v-for="group in coverageLists" :key="group.label">
                <p class="inq-kicker">{{ group.label }}</p>
                <ul class="mt-1.5 list-disc space-y-1 ps-5 text-sm text-toned marker:text-dimmed"><li v-for="(item, index) in group.items" :key="index">{{ item }}</li></ul>
              </div>
            </div>
          </section>
          <section v-if="workspace.identity.limitations.length" class="mt-6">
            <p class="inq-kicker">Report limitations</p>
            <ul class="mt-1.5 list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed"><li v-for="(item, index) in workspace.identity.limitations" :key="index">{{ item }}</li></ul>
          </section>
          <section class="mt-8">
            <h3 class="inq-section">What the model contains</h3>
            <dl class="grid grid-cols-3 gap-3 sm:grid-cols-5">
              <div v-for="row in MODEL_COUNT_ROWS" :key="row.key" class="rounded-lg border border-default bg-elevated/30 p-3">
                <dt class="text-[11px] text-dimmed">{{ row.label }}</dt>
                <dd class="mt-1 font-mono text-xl tabular-nums text-highlighted">{{ workspace.counts[row.key] }}</dd>
              </div>
            </dl>
            <p class="inq-kicker mt-5">Derived depth — computed from the model, not authored</p>
            <dl class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div v-for="row in DERIVED_COUNT_ROWS" :key="row.key" class="rounded-lg border border-muted p-3">
                <dt class="text-[11px] text-dimmed">{{ row.label }}</dt>
                <dd class="mt-1 font-mono text-base tabular-nums text-toned">{{ workspace.counts[row.key] }}</dd>
              </div>
            </dl>
          </section>
          <section class="mt-8">
            <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />
            <p class="mt-2 text-xs text-dimmed">{{ workspace.counts.references }} references across the whole model, each attached to its owning entity.</p>
          </section>
          <footer class="mt-10 border-t border-default pt-4 text-[11px] text-dimmed">
            Generated {{ workspace.identity.generatedAt }} by {{ workspace.identity.generator.name }} {{ workspace.identity.generator.version }} · schema {{ workspace.identity.schemaVersion }} · {{ workspace.identity.referenceProfile }} reference profile<span v-if="workspace.identity.license"> · {{ workspace.identity.license }}</span>
          </footer>
        </div>
      </div>

      <!-- ================= 02 · Who uses it, and how do they get in? ================= -->
      <div v-else-if="activeQuestion === 'access'" class="blr-pane h-full">
        <div class="mx-auto w-full max-w-6xl py-10">
          <header class="mb-8 border-b border-default pb-6">
            <p class="inq-kicker">Question {{ activeCard.no }}</p>
            <h2 class="inq-headline mt-2 text-3xl font-semibold text-highlighted sm:text-4xl">{{ activeCard.question }}</h2>
          </header>
          <section>
            <h3 class="inq-section">The Actors</h3>
            <div class="grid gap-4 md:grid-cols-2">
              <article v-for="actor in workspace.actors" :key="actor.id" class="rounded-xl border border-default bg-elevated/30 p-5">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind kind="actor" :labelled="false" />
                  <h4 class="text-base font-semibold tracking-tight text-highlighted">{{ actor.title }}</h4>
                  <UBadge color="neutral" variant="subtle" size="sm">{{ actor.actorKind }} · {{ actor.relationship }}</UBadge>
                  <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="ghost" class="ms-auto" title="Open the full entity" @click="inspect(actor)" />
                </div>
                <BlrProse :text="actor.lead" class="mt-3" />
                <div class="mt-4 space-y-1.5">
                  <BlrLinks :workspace="workspace" :ids="actor.interfaceIds" kind="interface" label="Enters" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="actor.experienceIds" kind="experience" label="Enters (Experiences)" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="actor.journeyIds" kind="journey" label="Performs" interactive @select="inspect" />
                </div>
              </article>
            </div>
            <p v-if="!workspace.actors.length" class="text-sm text-dimmed italic">No Actors are authored in this model.</p>
          </section>
          <section class="mt-10">
            <h3 class="inq-section">The ways in</h3>
            <p class="text-xs text-dimmed">Interfaces are delivery surfaces; Experiences are access boundaries inside them. "In scope here" lists are derived from availability.</p>
            <div class="mt-4 grid gap-4 lg:grid-cols-2">
              <article v-for="context in accessContexts" :key="context.entity.id" class="rounded-xl border border-default bg-elevated/30 p-5">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind :kind="context.entity.kind" :labelled="false" />
                  <h4 class="text-base font-semibold tracking-tight text-highlighted">{{ context.entity.title }}</h4>
                  <UBadge v-if="context.accessMode" :color="ACCESS_TONE[context.accessMode] ?? 'neutral'" variant="subtle" size="sm">{{ context.accessMode }}</UBadge>
                  <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="ghost" class="ms-auto" title="Open the full entity" @click="inspect(context.entity)" />
                </div>
                <BlrProse :text="context.entity.lead" class="mt-3" />
                <BlrAvail :pairs="[]" :entry-points="context.entity.entryPoints" label="Entry points" class="mt-4" />
                <div v-if="context.entity.capabilityBoundary" class="mt-4">
                  <p class="inq-kicker">Capability boundary</p>
                  <BlrProse :text="context.entity.capabilityBoundary" class="mt-1.5" />
                </div>
                <div class="mt-4 space-y-1.5 border-t border-muted pt-3">
                  <BlrLinks :workspace="workspace" :ids="context.entity.actorIds" kind="actor" label="Who enters" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="context.relatedIds" :kind="context.relatedKind" :label="context.relatedLabel" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="context.entity.capabilityIds" kind="capability" label="In scope here (derived)" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="context.entity.screenIds" kind="screen" label="Screens here (derived)" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="context.entity.journeyIds" kind="journey" label="Completable here (derived)" interactive @select="inspect" />
                </div>
              </article>
            </div>
            <p v-if="!workspace.experiences.length" class="mt-4 text-xs text-dimmed italic">This model declares no Experiences: every Interface is entered directly.</p>
          </section>
        </div>
      </div>

      <!-- ================= 03 · What does each surface show? ================= -->
      <div v-else-if="activeQuestion === 'surfaces'" class="flex h-full min-h-0 flex-col">
        <div class="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-default px-1 py-2.5">
          <span class="inq-kicker me-1.5">Overlay a promise</span>
          <UButton size="xs" :variant="overlayJourneyId === null ? 'solid' : 'outline'" :color="overlayJourneyId === null ? 'primary' : 'neutral'" label="Full landscape" @click="overlayJourneyId = null" />
          <UButton v-for="journey in workspace.journeys" :key="journey.id" size="xs" :variant="overlayJourneyId === journey.id ? 'solid' : 'outline'" :color="overlayJourneyId === journey.id ? 'primary' : 'neutral'" :label="journey.title" @click="toggleOverlay(journey.id)" />
          <span v-if="overlayJourney" class="ms-auto hidden text-xs text-dimmed lg:inline">Screens “{{ overlayJourney.title }}” passes through stay lit; the rest fade.</span>
        </div>
        <div v-if="workspace.interfaces.length" class="min-h-0 flex-1">
          <BlrFlowCanvas :nodes="screenMap.nodes" :edges="screenMap.edges" @select="inspectById" @focus="inspectById" />
        </div>
        <div v-else class="flex flex-1 items-center justify-center p-10 text-sm text-dimmed italic">
          This model declares no Interfaces, so there is no surface to map.
        </div>
      </div>

      <!-- ================= 04 · What promises does it keep? ================= -->
      <div v-else-if="activeQuestion === 'promises'" class="blr-pane h-full">
        <div class="mx-auto w-full max-w-6xl py-10">
          <!-- One promise, read in full -->
          <template v-if="openJourney">
            <UButton icon="i-lucide-arrow-left" size="xs" color="neutral" variant="ghost" label="All promises" @click="openJourneyId = null" />
            <header class="mt-4 border-b border-default pb-6">
              <div class="flex flex-wrap items-center gap-2">
                <BlrKind kind="journey" />
                <UBadge color="neutral" variant="subtle" size="sm">{{ plural(openJourney.scenarioIds.length, 'scenario') }}</UBadge>
                <span class="ms-auto flex gap-1.5">
                  <UButton icon="i-lucide-waypoints" size="xs" color="neutral" variant="outline" label="Neighbourhood" @click="inspect(openJourney!); inspectorMode = 'map'" />
                  <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="outline" label="Full entity" @click="inspect(openJourney!)" />
                </span>
              </div>
              <h3 class="inq-headline mt-3 text-3xl font-semibold text-highlighted">{{ openJourney.title }}</h3>
              <BlrProse :text="openJourney.lead" size="base" class="mt-4" />
            </header>
            <section v-if="openJourney.intent" class="mt-6">
              <p class="inq-kicker">Intent</p>
              <BlrProse :text="openJourney.intent" class="mt-1.5" />
            </section>
            <section class="mt-6 grid gap-6 md:grid-cols-2">
              <BlrAvail :pairs="openJourney.availability" :entry-points="openJourney.entryPoints" />
              <div class="space-y-1.5">
                <BlrLinks :workspace="workspace" :ids="openJourney.actorIds" kind="actor" interactive @select="inspect" />
                <BlrLinks :workspace="workspace" :ids="openJourney.capabilityIds" kind="capability" label="Uses" interactive @select="inspect" />
                <BlrLinks :workspace="workspace" :ids="openJourney.domainIds" kind="domain" label="Domains (derived)" interactive @select="inspect" />
                <BlrLinks :workspace="workspace" :ids="openJourney.screenIds" kind="screen" label="Passes through" interactive @select="inspect" />
                <BlrLinks :workspace="workspace" :ids="openJourney.ruleIds" kind="rule" label="Constrained by" interactive @select="inspect" />
              </div>
            </section>
            <section class="mt-10">
              <h4 class="inq-section">The Scenarios, complete</h4>
              <article v-for="scenario in openJourneyScenarios" :key="scenario.id" class="mt-5 rounded-xl border border-default p-5">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge color="neutral" variant="subtle" size="sm">{{ scenario.kindName }}</UBadge>
                  <h5 class="text-base font-semibold tracking-tight text-highlighted">{{ scenario.title }}</h5>
                  <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="ghost" class="ms-auto" title="Open the full entity" @click="inspect(scenario)" />
                </div>
                <div class="mt-4 space-y-4">
                  <div><p class="inq-kicker">Trigger</p><BlrProse :text="scenario.trigger" class="mt-1.5" /></div>
                  <div>
                    <p class="inq-kicker">Steps · {{ scenario.steps.length }}</p>
                    <ol class="mt-2 space-y-1.5">
                      <li v-for="(step, stepIndex) in scenario.steps" :key="stepIndex" class="flex gap-3 text-sm leading-relaxed">
                        <span class="mt-0.5 w-5 shrink-0 text-end font-mono text-[11px] text-dimmed tabular-nums">{{ stepIndex + 1 }}</span>
                        <span class="text-toned">{{ step }}</span>
                      </li>
                    </ol>
                  </div>
                  <div v-if="scenario.decisionPoints.length">
                    <p class="inq-kicker">Decisions · {{ scenario.decisionPoints.length }}</p>
                    <div v-for="(point, pointIndex) in scenario.decisionPoints" :key="pointIndex" class="mt-2 rounded-lg border border-dashed border-default p-3">
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
                  </div>
                  <div><p class="inq-kicker">Outcome</p><BlrProse :text="scenario.outcome" class="mt-1.5" /></div>
                  <div v-if="scenario.edgeCases.length">
                    <p class="inq-kicker">Edge cases · {{ scenario.edgeCases.length }}</p>
                    <ul class="mt-1.5 list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed">
                      <li v-for="(edge, edgeIndex) in scenario.edgeCases" :key="edgeIndex">{{ edge }}</li>
                    </ul>
                  </div>
                  <div class="space-y-1.5 border-t border-muted pt-3">
                    <BlrLinks :workspace="workspace" :ids="scenario.screenIds" kind="screen" label="Served by" interactive @select="inspect" />
                    <BlrLinks :workspace="workspace" :ids="scenario.ruleIds" kind="rule" label="Under rules" interactive @select="inspect" />
                  </div>
                </div>
              </article>
              <p v-if="!openJourneyScenarios.length" class="mt-4 text-sm text-dimmed italic">No Scenarios are authored for this Journey.</p>
            </section>
          </template>
          <!-- The browser: cards for recognition, the table for comparison -->
          <template v-else>
            <header class="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-default pb-6">
              <div>
                <p class="inq-kicker">Question {{ activeCard.no }}</p>
                <h2 class="inq-headline mt-2 text-3xl font-semibold text-highlighted sm:text-4xl">{{ activeCard.question }}</h2>
              </div>
              <div class="flex gap-1.5">
                <UButton size="xs" icon="i-lucide-layout-grid" label="Cards" :variant="journeyLens === 'cards' ? 'solid' : 'outline'" :color="journeyLens === 'cards' ? 'primary' : 'neutral'" @click="journeyLens = 'cards'" />
                <UButton size="xs" icon="i-lucide-table" label="Compare" :variant="journeyLens === 'table' ? 'solid' : 'outline'" :color="journeyLens === 'table' ? 'primary' : 'neutral'" @click="journeyLens = 'table'" />
              </div>
            </header>
            <div v-if="journeyLens === 'cards'" class="grid gap-4 lg:grid-cols-2">
              <article v-for="journey in workspace.journeys" :key="journey.id" class="flex flex-col rounded-xl border border-default bg-elevated/30 p-5">
                <div class="flex items-start gap-2">
                  <h3 class="inq-headline text-lg font-semibold text-highlighted">{{ journey.title }}</h3>
                  <UBadge class="ms-auto shrink-0" color="neutral" variant="subtle" size="sm">{{ plural(journey.scenarioIds.length, 'scenario') }}</UBadge>
                </div>
                <BlrProse :text="journey.lead" class="mt-2.5" />
                <div class="mt-4 space-y-2">
                  <BlrAvail :pairs="journey.availability" />
                  <BlrLinks :workspace="workspace" :ids="journey.actorIds" kind="actor" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="journey.capabilityIds" kind="capability" label="Uses" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="journey.screenIds" kind="screen" label="Passes through" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="journey.ruleIds" kind="rule" label="Constrained by" interactive @select="inspect" />
                </div>
                <div class="mt-3">
                  <p class="inq-kicker">Scenarios</p>
                  <div class="mt-1.5 flex flex-wrap gap-1.5">
                    <button v-for="scenario in workspace.scenariosByJourney.get(journey.id) ?? []" :key="scenario.id" type="button" class="rounded-full border border-default px-2 py-0.5 text-[11px] text-toned transition hover:bg-elevated" @click="inspect(scenario)">{{ scenario.title }}</button>
                  </div>
                </div>
                <div class="mt-4 border-t border-muted pt-3">
                  <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-book-open" label="Read this promise" @click="openJourneyId = journey.id" />
                </div>
              </article>
            </div>
            <div v-else class="overflow-x-auto rounded-xl border border-default">
              <table class="w-full min-w-[56rem] border-collapse text-sm">
                <thead>
                  <tr class="border-b border-default bg-elevated/50">
                    <th class="inq-th text-start">Promise</th>
                    <th class="inq-th text-start">Actors</th>
                    <th class="inq-th text-start">Available in</th>
                    <th class="inq-th text-end">Capabilities</th>
                    <th class="inq-th text-end">Screens</th>
                    <th class="inq-th text-end">Scenarios</th>
                    <th class="inq-th text-end">Rules</th>
                    <th class="inq-th text-end">Steps</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="journey in workspace.journeys" :key="journey.id" class="cursor-pointer border-b border-muted last:border-0 hover:bg-elevated/40" @click="openJourneyId = journey.id">
                    <td class="px-3 py-2.5 font-medium text-highlighted">{{ journey.title }}</td>
                    <td class="px-3 py-2.5 text-xs text-toned">{{ journey.actorIds.map(id => workspace.byId.get(id)?.title ?? id).join(', ') }}</td>
                    <td class="px-3 py-2.5 text-xs text-toned">{{ journey.availability.map(pair => pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : pair.interfaceTitle).join(', ') }}</td>
                    <td class="px-3 py-2.5 text-end font-mono text-xs tabular-nums text-toned">{{ journey.capabilityIds.length }}</td>
                    <td class="px-3 py-2.5 text-end font-mono text-xs tabular-nums text-toned">{{ journey.screenIds.length }}</td>
                    <td class="px-3 py-2.5 text-end font-mono text-xs tabular-nums text-toned">{{ journey.scenarioIds.length }}</td>
                    <td class="px-3 py-2.5 text-end font-mono text-xs tabular-nums text-toned">{{ journey.ruleIds.length }}</td>
                    <td class="px-3 py-2.5 text-end font-mono text-xs tabular-nums text-toned">{{ journey.stepCount }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="border-t border-default px-3 py-2 text-[11px] text-dimmed">Counts are derived from the model, not authored. Click a promise to read it in full.</p>
            </div>
            <p v-if="!workspace.journeys.length" class="text-sm text-dimmed italic">No Journeys are authored in this model.</p>
          </template>
        </div>
      </div>

      <!-- ================= 05 · What can it durably do? ================= -->
      <div v-else-if="activeQuestion === 'capabilities'" class="blr-pane h-full">
        <div class="mx-auto w-full max-w-6xl py-10">
          <header class="mb-8 border-b border-default pb-6">
            <p class="inq-kicker">Question {{ activeCard.no }}</p>
            <h2 class="inq-headline mt-2 text-3xl font-semibold text-highlighted sm:text-4xl">{{ activeCard.question }}</h2>
          </header>
          <section v-for="group in domainGroups" :key="group.id || 'no-domain'" class="mb-8">
            <div class="flex flex-wrap items-baseline gap-2">
              <BlrKind v-if="group.id" kind="domain" :labelled="false" />
              <h3 class="inq-section !mb-0">{{ group.title }}</h3>
              <span class="text-xs text-dimmed">{{ group.lead }}</span>
              <UButton v-if="group.id" icon="i-lucide-book-open" size="xs" color="neutral" variant="ghost" title="Open the Domain" @click="inspectById(group.id)" />
            </div>
            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <article v-for="capability in group.capabilities" :key="capability.id" class="rounded-xl border border-default bg-elevated/30 p-4">
                <div class="flex items-center gap-2">
                  <BlrKind kind="capability" :labelled="false" />
                  <h4 class="text-sm font-semibold tracking-tight text-highlighted">{{ capability.title }}</h4>
                  <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="ghost" class="ms-auto" title="Open the full entity" @click="inspect(capability)" />
                </div>
                <BlrProse :text="capability.lead" class="mt-2" />
                <div class="mt-3 space-y-1.5">
                  <BlrAvail :pairs="capability.availability" />
                  <BlrLinks :workspace="workspace" :ids="capability.journeyIds" kind="journey" label="Used by (derived)" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="capability.screenIds" kind="screen" label="Exposed on (derived)" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="capability.ruleIds" kind="rule" label="Constrained by (derived)" interactive @select="inspect" />
                </div>
              </article>
            </div>
          </section>
          <p v-if="!workspace.capabilities.length" class="text-sm text-dimmed italic">No Capabilities are authored in this model.</p>
          <section class="mt-4 space-y-10">
            <div v-for="matrix in matrices" :key="matrix.id">
              <h3 class="inq-headline text-xl font-semibold text-highlighted">{{ matrix.question }}</h3>
              <p class="mt-1 text-xs text-dimmed">{{ matrix.note }}</p>
              <div v-if="matrix.cols.length && workspace.capabilities.length" class="mt-3 overflow-x-auto rounded-xl border border-default">
                <table class="inq-matrix text-xs">
                  <thead>
                    <tr>
                      <th class="inq-matrix-corner">Capability</th>
                      <th v-for="col in matrix.cols" :key="col.id" class="inq-matrix-col"><span>{{ col.title }}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="capability in workspace.capabilities" :key="capability.id">
                      <th class="inq-matrix-row">{{ capability.title }}</th>
                      <td v-for="col in matrix.cols" :key="col.id" class="inq-matrix-cell">
                        <button type="button" class="inq-cell" :class="matrixCell?.matrix === matrix.id && matrixCell?.capId === capability.id && matrixCell?.otherId === col.id && 'inq-cell--active'" :title="`${capability.title} × ${col.title}`" @click="selectCell(matrix.id, capability.id, col.id)">
                          <span v-if="matrix.filled(capability, col.id)" class="inq-dot" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="mt-3 text-sm text-dimmed italic">{{ matrix.emptyNote }}</p>
              <div v-if="matrixExplanation && matrixCell?.matrix === matrix.id" class="mt-3 rounded-xl border border-accented bg-elevated/40 p-4">
                <p class="text-sm leading-relaxed text-toned">{{ matrixExplanation.sentence }}</p>
                <div class="mt-2.5 flex flex-wrap gap-1.5">
                  <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-book-open" :label="`Open ${matrixExplanation.capability.title}`" @click="inspect(matrixExplanation!.capability)" />
                  <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-book-open" :label="`Open ${matrixExplanation.other.title}`" @click="inspect(matrixExplanation!.other)" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- ================= 06 · What must always hold? ================= -->
      <div v-else-if="activeQuestion === 'rules'" class="blr-pane h-full">
        <div class="mx-auto w-full max-w-4xl py-10">
          <header class="mb-8 border-b border-default pb-6">
            <p class="inq-kicker">Question {{ activeCard.no }}</p>
            <h2 class="inq-headline mt-2 text-3xl font-semibold text-highlighted sm:text-4xl">{{ activeCard.question }}</h2>
          </header>
          <article v-for="impact in ruleImpacts" :key="impact.rule.id" class="mb-8 rounded-xl border border-default p-5 sm:p-6">
            <div class="flex flex-wrap items-center gap-2">
              <BlrKind kind="rule" :labelled="false" />
              <h3 class="inq-headline text-xl font-semibold text-highlighted">{{ impact.rule.title }}</h3>
              <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="ghost" class="ms-auto" title="Open the full entity" @click="inspect(impact.rule)" />
            </div>
            <div class="mt-4 rounded-lg border-s-2 border-primary bg-elevated/40 p-3.5">
              <BlrProse :text="impact.rule.statement" />
            </div>
            <div v-if="impact.rule.rationale" class="mt-4">
              <p class="inq-kicker">Rationale</p>
              <BlrProse :text="impact.rule.rationale" class="mt-1.5" />
            </div>
            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <div class="rounded-lg border border-default bg-elevated/30 p-3.5">
                <p class="inq-kicker">Directly attached — authored</p>
                <div class="mt-2.5 space-y-1.5">
                  <BlrLinks :workspace="workspace" :ids="impact.rule.domainIds" kind="domain" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="impact.rule.capabilityIds" kind="capability" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="impact.rule.journeyIds" kind="journey" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="impact.rule.scenarioIds" kind="scenario" interactive @select="inspect" />
                </div>
                <p v-if="!(impact.rule.domainIds.length || impact.rule.capabilityIds.length || impact.rule.journeyIds.length || impact.rule.scenarioIds.length)" class="mt-2 text-xs text-dimmed italic">Attached to nothing directly.</p>
              </div>
              <div class="rounded-lg border border-dashed border-default p-3.5 opacity-90">
                <p class="inq-kicker">Derived reach — computed</p>
                <div class="mt-2.5 space-y-1.5">
                  <BlrLinks :workspace="workspace" :ids="impact.derivedJourneyIds" kind="journey" label="Journeys, via their Scenarios" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="impact.derivedDomainIds" kind="domain" label="Domains, via their Capabilities" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="impact.derivedScreenIds" kind="screen" label="Screens serving constrained Scenarios" interactive @select="inspect" />
                </div>
                <p v-if="!(impact.derivedJourneyIds.length || impact.derivedDomainIds.length || impact.derivedScreenIds.length)" class="mt-2 text-xs text-dimmed italic">No reach beyond the direct attachments.</p>
              </div>
            </div>
            <BlrAvail class="mt-4" :pairs="impact.rule.availability" label="Scoped to" inherited-note="Not narrowed — holds in every context its attachments reach." />
          </article>
          <p v-if="!workspace.rules.length" class="text-sm text-dimmed italic">No Business Rules are authored in this model.</p>
        </div>
      </div>

      <!-- ================= 07 · How does one case complete? ================= -->
      <div v-else-if="activeQuestion === 'cases'" class="flex h-full min-h-0">
        <aside class="blr-pane hidden w-72 shrink-0 border-e border-default py-4 pe-4 md:block">
          <p class="inq-kicker mb-3">Pick a case</p>
          <div v-for="group in scenarioGroups" :key="group.journey.id" class="mb-4">
            <p class="mb-1.5 truncate text-xs font-medium text-toned">{{ group.journey.title }}</p>
            <button v-for="scenario in group.scenarios" :key="scenario.id" type="button" class="mb-1 block w-full truncate rounded-md border px-2.5 py-1.5 text-start text-xs transition" :class="flowScenario?.id === scenario.id ? 'border-accented bg-elevated text-highlighted' : 'border-transparent text-dimmed hover:bg-elevated/60 hover:text-toned'" @click="flowScenarioId = scenario.id">
              {{ scenario.title }}
            </button>
          </div>
        </aside>
        <div class="blr-pane min-w-0 flex-1 py-6 md:ps-8">
          <div class="mb-4 flex flex-wrap gap-1.5 md:hidden">
            <UButton v-for="scenario in workspace.scenarios" :key="scenario.id" size="xs" :variant="flowScenario?.id === scenario.id ? 'solid' : 'outline'" :color="flowScenario?.id === scenario.id ? 'primary' : 'neutral'" :label="scenario.title" @click="flowScenarioId = scenario.id" />
          </div>
          <template v-if="flowScenario">
            <header class="max-w-3xl border-b border-default pb-5">
              <p class="inq-kicker">A case of “{{ flowScenario.journeyTitle }}”</p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <h3 class="inq-headline text-2xl font-semibold text-highlighted">{{ flowScenario.title }}</h3>
                <UBadge color="neutral" variant="subtle" size="sm">{{ flowScenario.kindName }}</UBadge>
                <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="ghost" class="ms-auto" title="Open the full entity" @click="inspect(flowScenario!)" />
              </div>
              <BlrAvail class="mt-3" :pairs="flowScenario.availability" inherited-note="Applies to every pair its Journey declares." />
            </header>
            <div class="inq-flow mt-6 max-w-3xl space-y-5">
              <div class="inq-node">
                <p class="inq-kicker">Trigger</p>
                <BlrProse :text="flowScenario.trigger" class="mt-1" />
              </div>
              <div v-for="(step, stepIndex) in flowScenario.steps" :key="stepIndex" class="inq-node">
                <p class="inq-kicker">Step {{ stepIndex + 1 }}</p>
                <p class="mt-1 text-sm leading-relaxed text-toned">{{ step }}</p>
              </div>
              <div v-for="(point, pointIndex) in flowScenario.decisionPoints" :key="`decision-${pointIndex}`" class="inq-node inq-node--decision">
                <p class="inq-kicker">Decision</p>
                <div class="mt-1 rounded-lg border border-dashed border-default p-3">
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
              </div>
              <div class="inq-node inq-node--outcome">
                <p class="inq-kicker">Outcome</p>
                <BlrProse :text="flowScenario.outcome" class="mt-1" />
              </div>
              <div v-if="flowScenario.edgeCases.length" class="inq-node">
                <p class="inq-kicker">Edge cases · {{ flowScenario.edgeCases.length }}</p>
                <ul class="mt-1.5 list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed">
                  <li v-for="(edge, edgeIndex) in flowScenario.edgeCases" :key="edgeIndex">{{ edge }}</li>
                </ul>
              </div>
            </div>
            <div class="mt-6 max-w-3xl space-y-1.5 border-t border-default pt-4">
              <BlrLinks :workspace="workspace" :ids="flowScenario.screenIds" kind="screen" label="On screens" interactive @select="inspect" />
              <BlrLinks :workspace="workspace" :ids="flowScenario.ruleIds" kind="rule" label="Under rules" interactive @select="inspect" />
            </div>
          </template>
          <p v-else class="text-sm text-dimmed italic">No Scenarios are authored in this model.</p>
        </div>
      </div>

      <!-- ================= 08 · What connects to this? ================= -->
      <div v-else-if="activeQuestion === 'connections'" class="flex h-full min-h-0 flex-col">
        <template v-if="topologyFocus">
          <div class="flex shrink-0 items-center gap-2 border-b border-default px-1 py-2">
            <UButton icon="i-lucide-list" size="xs" color="neutral" variant="ghost" label="Pick another entity" @click="topologyFocusId = null" />
            <BlrKind :kind="topologyFocus.kind" :labelled="false" />
            <span class="truncate text-sm font-medium text-highlighted">{{ topologyFocus.title }}</span>
          </div>
          <div class="min-h-0 flex-1">
            <BlrTopology :workspace="workspace" :focus-id="topologyFocus.id" @inspect="inspect" />
          </div>
        </template>
        <div v-else class="blr-pane h-full">
          <div class="mx-auto w-full max-w-5xl py-10">
            <header class="mb-8 border-b border-default pb-6">
              <p class="inq-kicker">Question {{ activeCard.no }}</p>
              <h2 class="inq-headline mt-2 text-3xl font-semibold text-highlighted sm:text-4xl">{{ activeCard.question }}</h2>
              <p class="mt-2 text-sm text-dimmed">Choose the entity to put at the centre; the map shows its neighbourhood, one hop at a time.</p>
            </header>
            <section v-for="group in pickerGroups" :key="group.meta.kind" class="mb-6">
              <div class="mb-2 flex items-center gap-2">
                <BlrKind :kind="group.meta.kind" :count="group.entities.length" />
              </div>
              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <button v-for="entity in group.entities" :key="entity.id" type="button" class="rounded-lg border border-default bg-elevated/30 p-3 text-start transition hover:border-accented hover:bg-elevated/60" @click="topologyFocusId = entity.id">
                  <span class="block truncate text-sm font-medium text-highlighted">{{ entity.title }}</span>
                  <span class="mt-0.5 block truncate text-xs text-dimmed">{{ firstSentence(entity.lead) }}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>

    <!-- Docked inspector: complete entity content, with a map toggle. -->
    <div v-if="inspectedEntity" class="absolute inset-y-0 end-0 z-30 flex w-full flex-col border-s border-default bg-default shadow-2xl sm:max-w-xl">
      <div class="flex shrink-0 items-center gap-2 border-b border-default px-4 py-2.5">
        <BlrKind :kind="inspectedEntity.kind" :labelled="false" />
        <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ inspectedEntity.title }}</span>
        <UButton size="xs" icon="i-lucide-file-text" label="Content" :variant="inspectorMode === 'detail' ? 'solid' : 'outline'" :color="inspectorMode === 'detail' ? 'primary' : 'neutral'" @click="inspectorMode = 'detail'" />
        <UButton size="xs" icon="i-lucide-waypoints" label="Map" :variant="inspectorMode === 'map' ? 'solid' : 'outline'" :color="inspectorMode === 'map' ? 'primary' : 'neutral'" @click="inspectorMode = 'map'" />
        <UButton size="xs" icon="i-lucide-x" color="neutral" variant="ghost" title="Close" @click="inspectedId = null" />
      </div>
      <div v-if="inspectorMode === 'detail'" class="blr-pane flex-1 p-5">
        <BlrEntityDetail :workspace="workspace" :entity="inspectedEntity" depth="full" @select="inspect" />
      </div>
      <div v-else class="min-h-0 flex-1">
        <BlrTopology :workspace="workspace" :focus-id="inspectedEntity.id" direction="TB" @inspect="inspect" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Editorial type: weight, size and tracking only — no new fonts. */
.inq-title { font-size: clamp(2rem, 4.5vw, 3.25rem); font-weight: 650; letter-spacing: -0.03em; line-height: 1.05; }
.inq-headline { letter-spacing: -0.02em; text-wrap: balance; }
.inq-kicker { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ui-text-dimmed); }
.inq-section { margin-bottom: 0.75rem; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ui-text-muted); }

/* Magazine-feature numerals on the question wall. */
.inq-number { font-size: 3.25rem; line-height: 1; font-weight: 250; letter-spacing: -0.045em; font-variant-numeric: tabular-nums; color: color-mix(in srgb, var(--ui-text) 25%, transparent); transition: color 0.2s ease; }
.inq-card:hover .inq-number { color: var(--ui-primary); }

/* Journey comparison table headers. */
.inq-th { padding: 0.55rem 0.75rem; font-family: var(--font-mono); font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ui-text-dimmed); white-space: nowrap; }

/* Named matrices: sticky row heads, rotated column heads, clickable cells. */
.inq-matrix { width: max-content; min-width: 100%; border-collapse: separate; border-spacing: 0; }
.inq-matrix th, .inq-matrix td { border-block-end: 1px solid var(--ui-border-muted); border-inline-end: 1px solid var(--ui-border-muted); }
.inq-matrix thead th { background: var(--ui-bg-elevated); }
.inq-matrix-corner, .inq-matrix-row { position: sticky; inset-inline-start: 0; z-index: 2; text-align: start; }
.inq-matrix-corner { min-width: 11rem; padding: 0.6rem 0.75rem; vertical-align: bottom; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ui-text-dimmed); }
.inq-matrix-row { padding: 0.45rem 0.75rem; background: var(--ui-bg); font-weight: 500; color: var(--ui-text-toned); white-space: nowrap; }
.inq-matrix-col { padding: 0.5rem 0.4rem; vertical-align: bottom; }
.inq-matrix-col span { display: inline-block; max-height: 8.5rem; overflow: hidden; writing-mode: vertical-rl; transform: rotate(180deg); font-weight: 500; color: var(--ui-text-toned); white-space: nowrap; }
.inq-matrix-cell { padding: 0; text-align: center; }
.inq-cell { display: flex; align-items: center; justify-content: center; width: 100%; min-width: 2.2rem; height: 2.2rem; cursor: pointer; }
.inq-cell:hover { background: color-mix(in srgb, var(--ui-primary) 10%, transparent); }
.inq-cell--active { outline: 2px solid var(--ui-primary); outline-offset: -2px; }
.inq-dot { width: 0.55rem; height: 0.55rem; border-radius: 9999px; background: var(--ui-primary); }

/* Scenario flow: one thread from trigger to outcome, decisions as diamonds. */
.inq-flow { position: relative; }
.inq-flow::before { content: ''; position: absolute; inset-inline-start: 0.5rem; top: 0.4rem; bottom: 0.4rem; width: 1px; background: color-mix(in srgb, var(--ui-border-accented) 85%, transparent); }
.inq-node { position: relative; padding-inline-start: 2rem; }
.inq-node::before { content: ''; position: absolute; inset-inline-start: 0.3rem; top: 0.3rem; width: 0.42rem; height: 0.42rem; border-radius: 9999px; border: 1.5px solid var(--ui-primary); background: var(--ui-bg); }
.inq-node--decision::before { border-radius: 1px; transform: rotate(45deg); border-color: var(--ui-warning); }
.inq-node--outcome::before { background: var(--ui-primary); }
</style>
