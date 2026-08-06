<script setup lang="ts">
/**
 * Crossgrid — named matrices are the spine of the report.
 *
 * The left rail is a list of written questions. Five of them are fixed,
 * named matrices — Capabilities × Journeys, × Screens, × availability
 * contexts, × Business rules, and Domains × Journeys — each owning exactly
 * one question, never one universal grid with interchangeable axes. Clicking
 * a filled cell lands an explanation panel under the matrix that names both
 * entities, states the relationship in a sentence, and lists the connecting
 * evidence; clicking a row or column header opens the shared BlrInspector
 * slideover, whose Detail tab carries the complete authored content and whose
 * Map tab shows the contextual topology. Three non-matrix entries complete
 * the report: "The promises" (the Journey browser with cards, a comparison
 * table and full Scenario detail), "The surface" (the shared Screen map with
 * a Journey overlay), and "About" (identity, coverage, counts, access
 * contexts and references). Filled marks are authored relations; rings are
 * derived ones, and every derived reading says so.
 */
import type { ReportReference } from 'businesslens/report'
import type {
  AnyEntityView,
  AvailabilityPair,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportEntityKind,
  ReportWorkspace,
  ScenarioView
} from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { buildScreenMap, kindSlot } from '../utils/flowGraph'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

/* ------------------------------------------------------------------ */
/* The five named matrices                                             */
/* ------------------------------------------------------------------ */

interface MatrixCol {
  id: string
  title: string
  sub: string
  entityId: string | null
  pair: AvailabilityPair | null
}

interface MatrixMark {
  direct: boolean
  derived: boolean
  count: number | null
}

interface MatrixDef {
  id: string
  index: number
  question: string
  axes: string
  /** Standing caveat under the header, e.g. that every mark is derived. */
  note: string
  /** What a ring means in this matrix; empty when nothing is derived. */
  derivedMeaning: string
  /** What a cell count means; empty when cells carry no counts. */
  countMeaning: string
  /** Factual annotation for a row with no marks. */
  emptyRowNote: string
  rowKind: ReportEntityKind
  rows: AnyEntityView[]
  cols: MatrixCol[]
  marks: Map<string, MatrixMark>
}

function pairLabel(pair: AvailabilityPair): string {
  return pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : `${pair.interfaceTitle} · direct`
}

const markKey = (rowId: string, colId: string) => `${rowId}=>${colId}`

const matrices = computed<MatrixDef[]>(() => {
  const ws = props.workspace
  const journeyCols: MatrixCol[] = ws.journeys.map(journey => ({
    id: journey.id,
    title: journey.title,
    sub: `${journey.scenarioIds.length} Scenarios`,
    entityId: journey.id,
    pair: null
  }))
  const screenCols: MatrixCol[] = ws.screens.map((screen) => {
    const first = screen.availability.at(0)
    const more = screen.availability.length - 1
    return {
      id: screen.id,
      title: screen.title,
      sub: first ? `${pairLabel(first)}${more > 0 ? ` +${more}` : ''}` : 'unplaced',
      entityId: screen.id,
      pair: null
    }
  })
  const pairCols: MatrixCol[] = ws.pairs.map(pair => ({
    id: pair.key,
    title: pairLabel(pair),
    sub: pair.experienceTitle ? 'Experience scope' : 'Interface, direct',
    entityId: null,
    pair
  }))
  const ruleCols: MatrixCol[] = ws.rules.map(rule => ({
    id: rule.id,
    title: rule.title,
    sub: firstSentence(rule.statement, 80),
    entityId: rule.id,
    pair: null
  }))

  const m1 = new Map<string, MatrixMark>()
  const m2 = new Map<string, MatrixMark>()
  const m3 = new Map<string, MatrixMark>()
  const m4 = new Map<string, MatrixMark>()
  for (const cap of ws.capabilities) {
    for (const journey of ws.journeys) {
      if (!journey.capabilityIds.includes(cap.id)) continue
      const through = (ws.scenariosByJourney.get(journey.id) ?? [])
        .filter(scenario => scenario.screenIds.some(id => cap.screenIds.includes(id))).length
      m1.set(markKey(cap.id, journey.id), { direct: true, derived: false, count: through || null })
    }
    for (const screenId of cap.screenIds) {
      m2.set(markKey(cap.id, screenId), { direct: true, derived: false, count: null })
    }
    for (const pair of cap.availability) {
      m3.set(markKey(cap.id, pair.key), { direct: true, derived: false, count: null })
    }
    for (const rule of ws.rules) {
      const direct = rule.capabilityIds.includes(cap.id)
      const derived = Boolean(cap.domainId && rule.domainIds.includes(cap.domainId))
      if (direct || derived) m4.set(markKey(cap.id, rule.id), { direct, derived, count: null })
    }
  }
  const m5 = new Map<string, MatrixMark>()
  for (const domain of ws.domains) {
    for (const journey of ws.journeys) {
      const linking = domain.capabilityIds.filter(id => journey.capabilityIds.includes(id)).length
      if (linking) m5.set(markKey(domain.id, journey.id), { direct: false, derived: true, count: linking })
    }
  }

  return [
    {
      id: 'cap-journeys',
      index: 1,
      question: 'Which promises depend on each Capability?',
      axes: 'Capabilities × Journeys',
      note: '',
      derivedMeaning: '',
      countMeaning: 'the Journey’s Scenarios that pass through Screens exposing the Capability',
      emptyRowNote: 'used by no Journey',
      rowKind: 'capability',
      rows: ws.capabilities,
      cols: journeyCols,
      marks: m1
    },
    {
      id: 'cap-screens',
      index: 2,
      question: 'Where is each Capability exposed?',
      axes: 'Capabilities × Screens',
      note: '',
      derivedMeaning: '',
      countMeaning: '',
      emptyRowNote: 'exposed on no Screen',
      rowKind: 'capability',
      rows: ws.capabilities,
      cols: screenCols,
      marks: m2
    },
    {
      id: 'cap-availability',
      index: 3,
      question: 'Where can each Capability be reached?',
      axes: 'Capabilities × availability contexts',
      note: '',
      derivedMeaning: '',
      countMeaning: '',
      emptyRowNote: 'no declared availability',
      rowKind: 'capability',
      rows: ws.capabilities,
      cols: pairCols,
      marks: m3
    },
    {
      id: 'cap-rules',
      index: 4,
      question: 'Which Rules constrain each Capability?',
      axes: 'Capabilities × Business rules',
      note: '',
      derivedMeaning: 'the Rule constrains the Capability’s Domain',
      countMeaning: '',
      emptyRowNote: 'no Rule attached',
      rowKind: 'capability',
      rows: ws.capabilities,
      cols: ruleCols,
      marks: m4
    },
    {
      id: 'domain-journeys',
      index: 5,
      question: 'Which Domains support each promise?',
      axes: 'Domains × Journeys',
      note: 'Every mark here is derived — the model links Domains to Journeys only through the Capabilities a Journey uses.',
      derivedMeaning: 'linked through shared Capabilities',
      countMeaning: 'linking Capabilities',
      emptyRowNote: 'supports no Journey',
      rowKind: 'domain',
      rows: ws.domains,
      cols: journeyCols,
      marks: m5
    }
  ]
})

const PAGES = [
  { id: 'promises', label: 'The promises', hint: 'Journey browser — cards, table, full Scenarios', icon: 'i-lucide-route' },
  { id: 'surface', label: 'The surface', hint: 'Screen map by Interface and Experience', icon: 'i-lucide-monitor' },
  { id: 'about', label: 'About this report', hint: 'Identity, coverage, access contexts, references', icon: 'i-lucide-info' }
] as const

const activeViewId = ref<string>('cap-journeys')
const activeMatrix = computed(() => matrices.value.find(matrix => matrix.id === activeViewId.value) ?? null)

const undomainedCapabilities = computed(() => props.workspace.capabilitiesByDomain.get('') ?? [])

/* ------------------------------------------------------------------ */
/* Matrix selection: picked cells explain inline, headers inspect      */
/* ------------------------------------------------------------------ */

const picked = ref<{ rowId: string, colId: string } | null>(null)
const hoverCol = ref<number | null>(null)

watch(activeViewId, () => {
  picked.value = null
  hoverCol.value = null
})

function rowCells(matrix: MatrixDef, rowId: string): Array<{ col: MatrixCol, mark: MatrixMark | null }> {
  return matrix.cols.map(col => ({ col, mark: matrix.marks.get(markKey(rowId, col.id)) ?? null }))
}

function rowMarkCount(matrix: MatrixDef, rowId: string): number {
  return matrix.cols.reduce((total, col) => total + (matrix.marks.has(markKey(rowId, col.id)) ? 1 : 0), 0)
}

function rowSub(row: AnyEntityView): string {
  if (row.kind === 'capability') {
    return (row.domainId && props.workspace.byId.get(row.domainId)?.title) || 'No Domain'
  }
  if (row.kind === 'domain') return `${row.capabilityIds.length} Capabilities`
  return ENTITY_KIND_META[row.kind].label
}

const isCellPicked = (rowId: string, colId: string) =>
  picked.value?.rowId === rowId && picked.value?.colId === colId

function pickCell(rowId: string, colId: string) {
  picked.value = isCellPicked(rowId, colId) ? null : { rowId, colId }
}

/** A column header inspects its entity; an availability pair inspects its narrowest context. */
function inspectCol(col: MatrixCol) {
  const id = col.entityId || col.pair?.experienceId || col.pair?.interfaceId
  if (id) inspectById(id)
}

function rowColorStyle(kind: ReportEntityKind) {
  return { '--row-color': `var(--blr-slot-${kindSlot(kind)})` }
}

interface EvidenceGroup { label: string, kind: ReportEntityKind, ids: string[] }

interface CellStory {
  row: AnyEntityView
  col: MatrixCol
  colEntity: AnyEntityView | null
  mark: MatrixMark
  sentence: string
  derivedNote: string
  quote: string
  evidence: EvidenceGroup[]
  pairs: AvailabilityPair[]
}

const cellStory = computed<CellStory | null>(() => {
  const sel = picked.value
  const matrix = activeMatrix.value
  if (!matrix || !sel) return null
  const row = props.workspace.byId.get(sel.rowId)
  const col = matrix.cols.find(candidate => candidate.id === sel.colId)
  const mark = matrix.marks.get(markKey(sel.rowId, sel.colId))
  if (!row || !col || !mark) return null
  const colEntity = col.entityId ? props.workspace.byId.get(col.entityId) ?? null : null

  const evidence: EvidenceGroup[] = []
  let sentence = ''
  let derivedNote = ''
  let quote = ''
  let pairs: AvailabilityPair[] = []

  if (matrix.id === 'cap-journeys' && row.kind === 'capability' && colEntity?.kind === 'journey') {
    const journeyScenarios = props.workspace.scenariosByJourney.get(colEntity.id) ?? []
    const through = journeyScenarios.filter(scenario => scenario.screenIds.some(id => row.screenIds.includes(id)))
    sentence = `Journey “${colEntity.title}” uses Capability “${row.title}”.`
    if (through.length) {
      sentence += ` ${through.length} of its ${journeyScenarios.length} Scenarios pass through Screens exposing it.`
    }
    evidence.push({ label: 'Connecting Scenarios', kind: 'scenario', ids: through.map(scenario => scenario.id) })
    evidence.push({ label: 'Screens where they meet', kind: 'screen', ids: row.screenIds.filter(id => colEntity.screenIds.includes(id)) })
    evidence.push({ label: 'Rules touching both', kind: 'rule', ids: row.ruleIds.filter(id => colEntity.ruleIds.includes(id)) })
    pairs = row.availability.filter(pair => colEntity.availability.some(other => other.key === pair.key))
  } else if (matrix.id === 'cap-screens' && row.kind === 'capability' && colEntity?.kind === 'screen') {
    sentence = `Screen “${colEntity.title}” exposes Capability “${row.title}”.`
    evidence.push({ label: 'Journeys passing through both', kind: 'journey', ids: row.journeyIds.filter(id => colEntity.journeyIds.includes(id)) })
    evidence.push({ label: 'Scenarios this Screen serves', kind: 'scenario', ids: colEntity.scenarioIds })
    pairs = row.availability.filter(pair => colEntity.availability.some(other => other.key === pair.key))
  } else if (matrix.id === 'cap-availability' && row.kind === 'capability' && col.pair) {
    const pair = col.pair
    sentence = `Capability “${row.title}” is declared available in ${pairLabel(pair)}.`
    evidence.push({
      label: 'Screens exposing it there',
      kind: 'screen',
      ids: row.screenIds.filter((id) => {
        const screen = props.workspace.byId.get(id)
        return screen?.kind === 'screen' && screen.availability.some(other => other.key === pair.key)
      })
    })
    evidence.push({
      label: 'Journeys using it there',
      kind: 'journey',
      ids: row.journeyIds.filter((id) => {
        const journey = props.workspace.byId.get(id)
        return journey?.kind === 'journey' && journey.availability.some(other => other.key === pair.key)
      })
    })
  } else if (matrix.id === 'cap-rules' && row.kind === 'capability' && colEntity?.kind === 'rule') {
    const domain = row.domainId ? props.workspace.byId.get(row.domainId) : undefined
    if (mark.direct) {
      sentence = `Rule “${colEntity.title}” constrains Capability “${row.title}” directly.`
      if (mark.derived && domain) {
        derivedNote = `It also constrains Domain “${domain.title}”, which this Capability belongs to.`
      }
    } else if (domain) {
      sentence = `Rule “${colEntity.title}” constrains Domain “${domain.title}”; Capability “${row.title}” belongs to that Domain, so this constraint is derived.`
    }
    quote = firstSentence(colEntity.statement, 220)
    if (mark.derived && domain) evidence.push({ label: 'Through Domain', kind: 'domain', ids: [domain.id] })
    evidence.push({ label: 'Journeys both touch', kind: 'journey', ids: row.journeyIds.filter(id => colEntity.journeyIds.includes(id)) })
  } else if (matrix.id === 'domain-journeys' && row.kind === 'domain' && colEntity?.kind === 'journey') {
    const linking = row.capabilityIds.filter(id => colEntity.capabilityIds.includes(id))
    sentence = `Domain “${row.title}” supports Journey “${colEntity.title}” through ${linking.length} ${linking.length === 1 ? 'Capability' : 'Capabilities'}.`
    derivedNote = 'Derived: the model never links Domains to Journeys directly; the path runs through Capabilities.'
    evidence.push({ label: 'Linking Capabilities', kind: 'capability', ids: linking })
  }

  return { row, col, colEntity, mark, sentence, derivedNote, quote, evidence: evidence.filter(group => group.ids.length), pairs }
})

/* ------------------------------------------------------------------ */
/* The promises — Journey browser                                      */
/* ------------------------------------------------------------------ */

const journeyMode = ref<'cards' | 'table'>('cards')
const openJourneyId = ref<string | null>(null)
const journeyTab = ref<'scenarios' | 'map'>('scenarios')

const openJourney = computed(() => (
  openJourneyId.value ? props.workspace.journeys.find(journey => journey.id === openJourneyId.value) ?? null : null
))
const openJourneyScenarios = computed<ScenarioView[]>(() => (
  openJourneyId.value ? props.workspace.scenariosByJourney.get(openJourneyId.value) ?? [] : []
))

function openPromise(id: string) {
  openJourneyId.value = id
  journeyTab.value = 'scenarios'
}

function journeyScenariosOf(id: string): ScenarioView[] {
  return props.workspace.scenariosByJourney.get(id) ?? []
}

const titlesOf = (ids: string[]) => ids.map(id => props.workspace.byId.get(id)?.title ?? id).join(', ')
const availLabel = (pairs: AvailabilityPair[]) => pairs.map(pairLabel).join(', ')

/** One comparison-table row, as labelled cells the template renders uniformly. */
function journeyRowCells(journey: JourneyView): Array<{ key: string, text: string, cls: string }> {
  const countAnd = (ids: string[]) => (ids.length ? `${ids.length} · ${titlesOf(ids)}` : '0')
  return [
    { key: 'actors', text: titlesOf(journey.actorIds) || '—', cls: 'max-w-40 truncate text-muted' },
    { key: 'availability', text: availLabel(journey.availability) || '—', cls: 'max-w-48 truncate text-muted' },
    { key: 'capabilities', text: countAnd(journey.capabilityIds), cls: 'max-w-48 truncate text-muted' },
    { key: 'screens', text: countAnd(journey.screenIds), cls: 'max-w-44 truncate text-muted' },
    { key: 'scenarios', text: String(journey.scenarioIds.length), cls: 'blr-meta' },
    { key: 'rules', text: countAnd(journey.ruleIds), cls: 'max-w-44 truncate text-muted' },
    { key: 'steps', text: String(journey.stepCount), cls: 'blr-meta text-end' }
  ]
}

/* ------------------------------------------------------------------ */
/* The surface — Screen map                                            */
/* ------------------------------------------------------------------ */

const overlayJourneyId = ref<string | null>(null)
const surfaceSelectedId = ref<string | null>(null)

const overlayJourney = computed(() => (
  overlayJourneyId.value ? props.workspace.journeys.find(journey => journey.id === overlayJourneyId.value) ?? null : null
))
const surfaceShape = computed(() => buildScreenMap(props.workspace, {
  emphasizeScreenIds: overlayJourney.value ? new Set(overlayJourney.value.screenIds) : null,
  selectedId: surfaceSelectedId.value
}))
const surfaceSelected = computed(() => (
  surfaceSelectedId.value ? props.workspace.byId.get(surfaceSelectedId.value) ?? null : null
))

/* ------------------------------------------------------------------ */
/* About — identity, coverage, counts, access contexts, references     */
/* ------------------------------------------------------------------ */

const identity = computed(() => props.workspace.identity)

const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  complete: 'success',
  partial: 'warning',
  draft: 'neutral'
}

const countGroups = computed(() => {
  const counts = props.workspace.counts
  return [
    {
      note: '',
      items: [
        ['Actors', counts.actors],
        ['Interfaces', counts.interfaces],
        ['Experiences', counts.experiences],
        ['Screens', counts.screens],
        ['Domains', counts.domains],
        ['Capabilities', counts.capabilities],
        ['Journeys', counts.journeys],
        ['Scenarios', counts.scenarios],
        ['Business rules', counts.rules]
      ] as Array<[string, number]>
    },
    {
      note: 'Derived depth — counted from the model, not authored',
      items: [
        ['Steps', counts.steps],
        ['Decision points', counts.decisionPoints],
        ['Branches', counts.branches],
        ['Edge cases', counts.edgeCases],
        ['Screen states', counts.screenStates],
        ['Entry points', counts.entryPoints],
        ['References', counts.references],
        ['Availability contexts', counts.availabilityPairs]
      ] as Array<[string, number]>
    }
  ]
})

/** Coverage list sections, kept only when they carry entries. */
const coverageLists = computed(() => {
  const coverage = props.workspace.coverage
  return [
    { label: 'Method', items: coverage.method },
    { label: 'Source areas', items: coverage.sourceAreas },
    { label: 'Unmapped', items: coverage.unmapped },
    { label: 'Limitations', items: [...coverage.limitations, ...identity.value.limitations] }
  ].filter(section => section.items.length)
})

const accessContexts = computed<Array<InterfaceView | ExperienceView>>(() => (
  [...props.workspace.interfaces, ...props.workspace.experiences]
))
const accessModeOf = (context: InterfaceView | ExperienceView) => (
  context.kind === 'experience' ? context.accessMode : null
)

interface OwnerReferences {
  ownerId: string
  ownerTitle: string
  ownerKind: ReportEntityKind
  references: ReportReference[]
}
const referenceGroups = computed<OwnerReferences[]>(() => {
  const groups: OwnerReferences[] = []
  const byOwner = new Map<string, OwnerReferences>()
  for (const item of props.workspace.references) {
    let group = byOwner.get(item.ownerId)
    if (!group) {
      group = { ownerId: item.ownerId, ownerTitle: item.ownerTitle, ownerKind: item.ownerKind, references: [] }
      byOwner.set(item.ownerId, group)
      groups.push(group)
    }
    group.references.push(item.reference)
  }
  return groups
})

/* ------------------------------------------------------------------ */
/* The shared inspector: every entity selection lands in it            */
/* ------------------------------------------------------------------ */

const inspected = ref<AnyEntityView | null>(null)
const inspectorTab = ref<'detail' | 'map'>('detail')

function inspect(entity: AnyEntityView) {
  inspected.value = entity
  inspectorTab.value = 'detail'
}
function inspectById(id: string) {
  const entity = props.workspace.byId.get(id)
  if (entity) inspect(entity)
}

const short = (value: string, limit = 22) => (value.length > limit ? `${value.slice(0, limit - 1)}…` : value)
</script>

<template>
  <div class="cg-root flex h-full min-h-0 flex-col overflow-hidden">
    <!-- Masthead: the report's identity is always in sight. -->
    <header class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-default px-4 py-2.5">
      <img v-if="logoSrc" :src="logoSrc" alt="" class="size-6 rounded">
      <h1 class="text-sm font-semibold tracking-tight text-highlighted">
        {{ identity.title }}
      </h1>
      <span class="hidden min-w-0 flex-1 truncate text-sm text-muted md:block">{{ identity.summary }}</span>
      <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">
        coverage: {{ workspace.coverage.status }}
      </UBadge>
      <span class="blr-meta">{{ identity.generatedAt }}</span>
    </header>

    <div class="flex min-h-0 flex-1">
      <!-- The spine: the question list. -->
      <nav class="blr-pane w-64 shrink-0 border-e border-default py-3 xl:w-72" aria-label="Report questions">
        <p class="blr-field px-4 pb-1.5">The questions</p>
        <button
          v-for="matrix in matrices"
          :key="matrix.id"
          type="button"
          class="cg-rail-item"
          :class="activeViewId === matrix.id && 'is-active'"
          @click="activeViewId = matrix.id"
        >
          <span class="blr-meta w-4 shrink-0 pt-0.5">{{ matrix.index }}</span>
          <span class="min-w-0">
            <span class="block text-sm leading-snug font-medium" :class="activeViewId === matrix.id ? 'text-highlighted' : 'text-default'">
              {{ matrix.question }}
            </span>
            <span class="blr-meta mt-0.5 block">
              {{ matrix.axes }} · {{ matrix.rows.length }}×{{ matrix.cols.length }}
            </span>
          </span>
        </button>

        <p class="blr-field px-4 pt-4 pb-1.5">The report</p>
        <button
          v-for="page in PAGES"
          :key="page.id"
          type="button"
          class="cg-rail-item"
          :class="activeViewId === page.id && 'is-active'"
          @click="activeViewId = page.id"
        >
          <UIcon :name="page.icon" class="mt-1 size-3.5 shrink-0 text-dimmed" />
          <span class="min-w-0">
            <span class="block text-sm leading-snug font-medium" :class="activeViewId === page.id ? 'text-highlighted' : 'text-default'">
              {{ page.label }}
            </span>
            <span class="mt-0.5 block text-xs text-muted">{{ page.hint }}</span>
          </span>
        </button>
      </nav>

      <main class="flex min-h-0 flex-1 flex-col">
        <!-- ============ Matrix surface ============ -->
        <template v-if="activeMatrix">
          <header class="shrink-0 space-y-1.5 border-b border-default px-6 pt-5 pb-4">
            <p class="blr-eyebrow">Matrix {{ activeMatrix.index }}</p>
            <h2 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">
              {{ activeMatrix.question }}
            </h2>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span class="blr-meta">{{ activeMatrix.axes }} · {{ activeMatrix.rows.length }}×{{ activeMatrix.cols.length }}</span>
              <span class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span class="inline-flex items-center gap-1.5"><span class="cg-dot" /> direct, authored</span>
                <span v-if="activeMatrix.derivedMeaning" class="inline-flex items-center gap-1.5">
                  <span class="cg-ring" /> derived — {{ activeMatrix.derivedMeaning }}
                </span>
                <span v-if="activeMatrix.countMeaning" class="inline-flex items-center gap-1.5">
                  <span class="blr-meta">n</span> = {{ activeMatrix.countMeaning }}
                </span>
              </span>
            </div>
            <p v-if="activeMatrix.note" class="text-sm text-muted">
              {{ activeMatrix.note }}
            </p>
          </header>

          <div class="flex min-h-0 flex-1 flex-col">
            <div class="blr-pane flex-1 overflow-x-auto">
              <table
                v-if="activeMatrix.rows.length && activeMatrix.cols.length"
                class="cg-table"
                @mouseleave="hoverCol = null"
              >
                <thead>
                  <tr>
                    <th class="cg-corner" scope="col">
                      <span class="blr-field">{{ ENTITY_KIND_META[activeMatrix.rowKind].plural }} ↓</span>
                    </th>
                    <th
                      v-for="(col, colIndex) in activeMatrix.cols"
                      :key="col.id"
                      scope="col"
                      class="cg-colhead"
                      :class="hoverCol === colIndex && 'is-hot'"
                    >
                      <button
                        type="button"
                        class="cg-colhead-btn"
                        :title="`${col.title} — ${col.sub}`"
                        @click="inspectCol(col)"
                        @mouseenter="hoverCol = colIndex"
                      >
                        <span class="cg-colhead-text">{{ col.title }}</span>
                        <span v-if="col.sub" class="cg-colhead-sub blr-meta">{{ col.sub }}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in activeMatrix.rows"
                    :key="row.id"
                    :style="rowColorStyle(row.kind)"
                  >
                    <th class="cg-rowhead" scope="row">
                      <button type="button" class="cg-rowhead-btn" :title="`Inspect ${row.title}`" @click="inspect(row)">
                        <UIcon :name="ENTITY_KIND_META[row.kind].icon" class="size-3.5 shrink-0" style="color: var(--row-color)" />
                        <span class="min-w-0">
                          <span class="block truncate text-sm font-medium text-highlighted">{{ row.title }}</span>
                          <span class="blr-meta block truncate">
                            {{ rowSub(row) }}<template v-if="!rowMarkCount(activeMatrix, row.id)"> · {{ activeMatrix.emptyRowNote }}</template>
                          </span>
                        </span>
                      </button>
                    </th>
                    <td
                      v-for="(cell, colIndex) in rowCells(activeMatrix, row.id)"
                      :key="cell.col.id"
                      class="cg-cell"
                      :class="[hoverCol === colIndex && 'is-hot', isCellPicked(row.id, cell.col.id) && 'is-selected']"
                      @mouseenter="hoverCol = colIndex"
                    >
                      <button
                        v-if="cell.mark"
                        type="button"
                        class="cg-cell-btn"
                        :title="`Explain: ${row.title} × ${cell.col.title}`"
                        @click="pickCell(row.id, cell.col.id)"
                      >
                        <span :class="cell.mark.direct ? 'cg-dot' : 'cg-ring'" />
                        <span v-if="cell.mark.count" class="blr-meta">{{ cell.mark.count }}</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="p-8 text-sm text-muted italic">
                Nothing to cross yet: this model authors
                {{ activeMatrix.rows.length }} {{ ENTITY_KIND_META[activeMatrix.rowKind].plural }}
                and {{ activeMatrix.cols.length }} columns for this question.
              </p>
              <p
                v-if="activeMatrix.id === 'domain-journeys' && undomainedCapabilities.length"
                class="max-w-2xl px-4 pb-4 text-sm text-muted"
              >
                {{ undomainedCapabilities.length }}
                {{ undomainedCapabilities.length === 1 ? 'Capability has' : 'Capabilities have' }}
                no Domain ({{ undomainedCapabilities.map(cap => cap.title).join(', ') }}) —
                a Journey using only those appears in no row here.
              </p>
            </div>

            <!-- The picked cell explains itself in a landing panel under the matrix. -->
            <div
              v-if="cellStory"
              class="shrink-0 border-t border-default"
              :style="rowColorStyle(cellStory.row.kind)"
            >
              <div class="blr-pane max-h-80 space-y-3 px-6 py-4">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <UIcon name="i-lucide-corner-down-right" class="size-3.5 shrink-0 text-dimmed" />
                  <button type="button" class="inline-flex min-w-0 items-center gap-1.5 text-start" @click="inspect(cellStory.row)">
                    <BlrKind :kind="cellStory.row.kind" :labelled="false" />
                    <span class="truncate text-sm font-medium text-highlighted hover:text-primary">{{ cellStory.row.title }}</span>
                  </button>
                  <span class="blr-meta">×</span>
                  <button type="button" class="inline-flex min-w-0 items-center gap-1.5 text-start" @click="inspectCol(cellStory.col)">
                    <BlrKind v-if="cellStory.colEntity" :kind="cellStory.colEntity.kind" :labelled="false" />
                    <UIcon v-else name="i-lucide-plug" class="size-3.5 shrink-0 text-dimmed" />
                    <span class="truncate text-sm font-medium text-highlighted hover:text-primary">{{ cellStory.col.title }}</span>
                  </button>
                  <span class="ms-auto flex items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 text-sm text-muted">
                      <span :class="cellStory.mark.direct ? 'cg-dot' : 'cg-ring'" />
                      {{ cellStory.mark.direct ? 'Direct — authored in the model.' : 'Derived — computed from authored links.' }}
                    </span>
                    <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" aria-label="Close explanation" @click="picked = null" />
                  </span>
                </div>

                <p class="max-w-3xl text-sm leading-6 text-default">
                  {{ cellStory.sentence }}
                </p>
                <p v-if="cellStory.derivedNote" class="max-w-3xl text-sm text-muted">
                  {{ cellStory.derivedNote }}
                </p>
                <blockquote v-if="cellStory.quote" class="max-w-3xl border-s-2 border-default ps-3 text-sm leading-6 text-muted italic">
                  {{ cellStory.quote }}
                </blockquote>

                <div v-if="cellStory.evidence.length || cellStory.pairs.length" class="space-y-2 border-t border-default pt-3">
                  <p class="blr-field">Connecting evidence</p>
                  <BlrLinks
                    v-for="group in cellStory.evidence"
                    :key="group.label"
                    :workspace="workspace"
                    :ids="group.ids"
                    :kind="group.kind"
                    :label="group.label"
                    interactive
                    @select="inspect"
                  />
                  <div v-if="cellStory.pairs.length" class="flex flex-wrap items-baseline gap-1.5">
                    <span class="blr-field">Shared availability</span>
                    <span v-for="pair in cellStory.pairs" :key="pair.key" class="rounded-full border border-default px-2 py-0.5 text-xs text-muted">
                      {{ pairLabel(pair) }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-1.5 border-t border-default pt-3">
                  <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-book-open" :label="`Open ${short(cellStory.row.title)}`" @click="inspect(cellStory.row)" />
                  <UButton v-if="cellStory.colEntity" size="xs" color="neutral" variant="outline" icon="i-lucide-book-open" :label="`Open ${short(cellStory.colEntity.title)}`" @click="inspect(cellStory.colEntity)" />
                  <template v-else-if="cellStory.col.pair">
                    <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-book-open" :label="`Open ${short(cellStory.col.pair.interfaceTitle)}`" @click="inspectById(cellStory.col.pair.interfaceId)" />
                    <UButton v-if="cellStory.col.pair.experienceId" size="xs" color="neutral" variant="outline" icon="i-lucide-book-open" :label="`Open ${short(cellStory.col.pair.experienceTitle)}`" @click="inspectById(cellStory.col.pair.experienceId)" />
                  </template>
                </div>
              </div>
            </div>
            <p v-else class="shrink-0 border-t border-default px-6 py-2.5 text-sm text-muted italic">
              Select a filled cell to read what the relationship means; row and column headers open the inspector.
            </p>
          </div>
        </template>

        <!-- ============ The promises: Journey browser ============ -->
        <template v-else-if="activeViewId === 'promises'">
          <template v-if="!openJourney">
            <div class="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-default px-6 pt-5 pb-4">
              <div class="space-y-1.5">
                <h2 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">
                  The promises
                </h2>
                <p class="blr-meta">
                  {{ workspace.journeys.length }} Journeys · {{ workspace.counts.scenarios }} Scenarios
                </p>
              </div>
              <UTabs
                v-model="journeyMode"
                :items="[
                  { value: 'cards', label: 'Cards', icon: 'i-lucide-layout-grid' },
                  { value: 'table', label: 'Table', icon: 'i-lucide-table' }
                ]"
                :content="false"
                color="neutral"
                size="xs"
              />
            </div>

            <div v-if="!workspace.journeys.length" class="p-8 text-sm text-muted italic">
              This model authors no Journeys yet.
            </div>

            <div v-else-if="journeyMode === 'cards'" class="blr-pane flex-1 px-6 py-5">
              <div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                <button
                  v-for="journey in workspace.journeys"
                  :key="journey.id"
                  type="button"
                  class="flex flex-col gap-2.5 rounded-xl border border-default bg-default p-4 text-start transition hover:border-accented"
                  @click="openPromise(journey.id)"
                >
                  <span class="flex items-center gap-2">
                    <BlrKind kind="journey" :labelled="false" />
                    <span class="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-highlighted">{{ journey.title }}</span>
                    <span class="blr-meta shrink-0">{{ journey.stepCount }} steps</span>
                  </span>
                  <span class="line-clamp-3 text-sm leading-6 text-muted">{{ journey.lead }}</span>
                  <span class="flex flex-wrap gap-1.5">
                    <span v-for="pair in journey.availability" :key="pair.key" class="rounded-full border border-default px-2 py-0.5 text-xs text-muted">
                      {{ pairLabel(pair) }}
                    </span>
                  </span>
                  <BlrLinks :workspace="workspace" :ids="journey.actorIds" kind="actor" />
                  <BlrLinks :workspace="workspace" :ids="journey.capabilityIds" kind="capability" :max="4" />
                  <BlrLinks :workspace="workspace" :ids="journey.screenIds" kind="screen" :max="4" />
                  <BlrLinks :workspace="workspace" :ids="journey.ruleIds" kind="rule" :max="3" />
                  <span class="mt-auto space-y-1 border-t border-default pt-2">
                    <span class="blr-field block">Scenarios · {{ journey.scenarioIds.length }}</span>
                    <span v-for="scenario in journeyScenariosOf(journey.id)" :key="scenario.id" class="flex items-baseline gap-2 text-sm">
                      <span class="blr-field shrink-0">{{ scenario.kindName }}</span>
                      <span class="min-w-0 truncate text-default">{{ scenario.title }}</span>
                    </span>
                  </span>
                </button>
              </div>
            </div>

            <div v-else class="blr-pane flex-1 overflow-x-auto">
              <table class="cg-jtable min-w-full text-sm">
                <thead>
                  <tr>
                    <th>Journey</th>
                    <th>Actors</th>
                    <th>Availability</th>
                    <th>Capabilities</th>
                    <th>Screens</th>
                    <th>Scenarios</th>
                    <th>Rules</th>
                    <th class="text-end!">
                      Steps
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="journey in workspace.journeys"
                    :key="journey.id"
                    class="cursor-pointer border-t border-default transition hover:bg-elevated/50"
                    @click="openPromise(journey.id)"
                  >
                    <th class="max-w-64 px-3 py-2 text-start align-top" scope="row">
                      <span class="block truncate text-sm font-medium text-highlighted">{{ journey.title }}</span>
                      <span class="block truncate text-xs font-normal text-muted">{{ firstSentence(journey.lead, 90) }}</span>
                    </th>
                    <td
                      v-for="cell in journeyRowCells(journey)"
                      :key="cell.key"
                      class="px-3 py-2 align-top"
                      :class="cell.cls"
                      :title="cell.text"
                    >
                      {{ cell.text }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <!-- Journey detail: the promise, its Scenarios in full, and its map. -->
          <template v-else>
            <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-default px-4 py-2">
              <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="xs" label="All promises" @click="openJourneyId = null" />
              <BlrKind kind="journey" :labelled="false" />
              <span class="min-w-0 truncate text-sm font-medium text-highlighted">{{ openJourney.title }}</span>
              <span class="ms-auto flex gap-1">
                <UButton size="xs" color="neutral" :variant="journeyTab === 'scenarios' ? 'soft' : 'ghost'" label="Scenarios" @click="journeyTab = 'scenarios'" />
                <UButton size="xs" color="neutral" :variant="journeyTab === 'map' ? 'soft' : 'ghost'" icon="i-lucide-waypoints" label="Map" @click="journeyTab = 'map'" />
                <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-book-open" label="Open" @click="inspect(openJourney)" />
              </span>
            </div>

            <div v-if="journeyTab === 'map'" class="min-h-0 flex-1">
              <BlrTopology :workspace="workspace" :focus-id="openJourney.id" @inspect="inspect" />
            </div>

            <div v-else class="blr-pane flex-1 p-4">
              <div class="mx-auto max-w-3xl space-y-5">
                <BlrProse :text="openJourney.lead" />
                <section v-if="openJourney.intent" class="space-y-1.5">
                  <h4 class="blr-field">Intent</h4>
                  <BlrProse :text="openJourney.intent" />
                </section>
                <BlrAvail :pairs="openJourney.availability" :entry-points="openJourney.entryPoints" />
                <div class="space-y-1.5 border-t border-default pt-4">
                  <BlrLinks :workspace="workspace" :ids="openJourney.actorIds" kind="actor" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="openJourney.capabilityIds" kind="capability" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="openJourney.domainIds" kind="domain" label="Domains (derived)" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="openJourney.screenIds" kind="screen" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="openJourney.ruleIds" kind="rule" label="Constrained by" interactive @select="inspect" />
                </div>

                <h3 class="border-t border-default pt-4 text-base font-semibold tracking-tight text-highlighted">
                  Scenarios <span class="blr-meta ms-1">{{ openJourneyScenarios.length }}</span>
                </h3>
                <p v-if="!openJourneyScenarios.length" class="text-sm text-muted italic">
                  No Scenarios authored for this Journey.
                </p>
                <section
                  v-for="scenario in openJourneyScenarios"
                  :key="scenario.id"
                  class="rounded-xl border border-default bg-default p-4"
                >
                  <BlrEntityDetail :workspace="workspace" :entity="scenario" @select="inspect" />
                </section>
              </div>
            </div>
          </template>
        </template>

        <!-- ============ The surface: Screen map ============ -->
        <template v-else-if="activeViewId === 'surface'">
          <header class="shrink-0 space-y-2 border-b border-default px-6 pt-5 pb-4">
            <h2 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">
              The surface
            </h2>
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="blr-field me-1">Journey overlay</span>
              <UButton size="xs" :color="!overlayJourneyId ? 'primary' : 'neutral'" :variant="!overlayJourneyId ? 'soft' : 'outline'" class="rounded-full" label="All Screens" @click="overlayJourneyId = null" />
              <UButton
                v-for="journey in workspace.journeys"
                :key="journey.id"
                size="xs"
                :color="overlayJourneyId === journey.id ? 'primary' : 'neutral'"
                :variant="overlayJourneyId === journey.id ? 'soft' : 'outline'"
                class="rounded-full"
                :label="`${journey.title} · ${journey.screenIds.length}`"
                @click="overlayJourneyId = overlayJourneyId === journey.id ? null : journey.id"
              />
            </div>
            <p class="text-sm text-muted">
              <template v-if="overlayJourney">
                Highlighted: Screens participating in “{{ overlayJourney.title }}” — participation is derived from its Scenarios and Capabilities, not an authored navigation order.
              </template>
              <template v-else-if="!workspace.counts.screens">
                This model authors no Screens; its Interfaces are shown with why that is fine.
              </template>
              <template v-else>
                Interfaces are columns; Screens sit directly under an Interface or inside its Experiences.
              </template>
            </p>
          </header>

          <div class="min-h-0 flex-1">
            <BlrFlowCanvas
              :nodes="surfaceShape.nodes"
              @select="surfaceSelectedId = $event"
              @focus="inspectById"
              @clear="surfaceSelectedId = null"
            />
          </div>

          <div class="flex min-h-10 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-default px-4 py-1.5">
            <template v-if="surfaceSelected">
              <BlrKind :kind="surfaceSelected.kind" :labelled="false" />
              <span class="text-sm font-medium text-highlighted">{{ surfaceSelected.title }}</span>
              <span class="min-w-0 flex-1 truncate text-sm text-muted">{{ firstSentence(surfaceSelected.lead) }}</span>
              <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-book-open" label="Open" @click="inspect(surfaceSelected)" />
            </template>
            <span v-else class="text-sm text-muted italic">
              Select a box to read what it is; double-click to open its full content.
            </span>
          </div>
        </template>

        <!-- ============ About: identity, coverage, access, references ============ -->
        <template v-else>
          <div class="blr-pane flex-1">
            <div class="mx-auto max-w-4xl space-y-10 p-6">
              <section class="space-y-3">
                <div class="flex items-center gap-3">
                  <img v-if="logoSrc" :src="logoSrc" alt="" class="size-9 rounded-md">
                  <div class="min-w-0">
                    <h2 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">
                      {{ identity.title }}
                    </h2>
                    <p class="text-sm text-muted">
                      {{ identity.summary }}
                    </p>
                  </div>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <UBadge v-if="identity.categoryLabel" color="primary" variant="subtle" size="sm">
                    {{ identity.categoryLabel }}
                  </UBadge>
                  <UBadge v-for="tag in identity.tags" :key="tag" color="neutral" variant="subtle" size="sm">
                    {{ tag }}
                  </UBadge>
                </div>
                <BlrProse :text="identity.description" />
                <section v-if="identity.intent" class="space-y-1.5">
                  <h4 class="blr-field">Intent</h4>
                  <BlrProse :text="identity.intent" />
                </section>
                <section v-if="identity.supportingContent" class="space-y-1.5">
                  <h4 class="blr-field">Supporting context</h4>
                  <BlrProse :text="identity.supportingContent" />
                </section>
                <dl class="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  <div class="flex items-baseline gap-2">
                    <dt class="blr-field">Generated</dt>
                    <dd class="blr-meta">
                      {{ identity.generatedAt }} · {{ identity.generator.name }} {{ identity.generator.version }}
                    </dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="blr-field">Schema</dt><dd class="blr-meta">{{ identity.schemaVersion }}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="blr-field">Reference profile</dt><dd class="blr-meta">{{ identity.referenceProfile }}</dd>
                  </div>
                  <div v-if="identity.license" class="flex items-baseline gap-2">
                    <dt class="blr-field">License</dt><dd class="blr-meta">{{ identity.license }}</dd>
                  </div>
                  <div v-if="identity.authors.length" class="flex items-baseline gap-2">
                    <dt class="blr-field">Authors</dt>
                    <dd class="flex flex-wrap gap-x-2 text-sm text-muted">
                      <template v-for="author in identity.authors" :key="author.name">
                        <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">{{ author.name }}</a>
                        <span v-else>{{ author.name }}</span>
                      </template>
                    </dd>
                  </div>
                </dl>
              </section>

              <section class="space-y-3">
                <h3 class="flex items-center gap-2 text-base font-semibold tracking-tight text-highlighted">
                  Coverage
                  <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">
                    {{ workspace.coverage.status }}
                  </UBadge>
                </h3>
                <BlrProse :text="workspace.coverage.rationale" />
                <div class="grid gap-4 sm:grid-cols-2">
                  <div v-for="section in coverageLists" :key="section.label" class="space-y-1.5">
                    <p class="blr-field">{{ section.label }}</p>
                    <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                      <li v-for="(item, index) in section.items" :key="index">
                        {{ item }}
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section class="space-y-3">
                <h3 class="text-base font-semibold tracking-tight text-highlighted">
                  What the model contains
                </h3>
                <template v-for="group in countGroups" :key="group.note">
                  <p v-if="group.note" class="blr-field">
                    {{ group.note }}
                  </p>
                  <div class="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                    <div v-for="[label, value] in group.items" :key="label" class="rounded-xl border border-default bg-default px-3 py-2.5">
                      <p class="font-mono text-lg text-highlighted tabular-nums">
                        {{ value }}
                      </p>
                      <p class="blr-field">
                        {{ label }}
                      </p>
                    </div>
                  </div>
                </template>
              </section>

              <section class="space-y-3">
                <h3 class="text-base font-semibold tracking-tight text-highlighted">
                  Access contexts — who enters, and what is available
                </h3>
                <div class="grid gap-4 lg:grid-cols-2">
                  <article v-for="context in accessContexts" :key="context.id" class="space-y-2.5 rounded-xl border border-default bg-default p-4">
                    <div class="flex items-center gap-2">
                      <BlrKind :kind="context.kind" :labelled="false" />
                      <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ context.title }}</span>
                      <UBadge v-if="accessModeOf(context)" color="neutral" variant="subtle" size="sm">
                        {{ accessModeOf(context) }}
                      </UBadge>
                      <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="ghost" aria-label="Open full content" @click="inspect(context)" />
                    </div>
                    <p class="text-sm leading-6 text-muted">
                      {{ firstSentence(context.lead, 200) }}
                    </p>
                    <BlrLinks :workspace="workspace" :ids="context.actorIds" kind="actor" label="Who enters" interactive @select="inspect" />
                    <ul v-if="context.entryPoints.length" class="space-y-0.5">
                      <li v-for="point in context.entryPoints" :key="`${point.interfaceId}-${point.path}`" class="flex items-baseline gap-2">
                        <UIcon name="i-lucide-corner-down-right" class="size-3 shrink-0 self-center text-dimmed" />
                        <span class="blr-meta truncate">{{ point.path }}</span>
                      </li>
                    </ul>
                    <div v-if="context.capabilityBoundary" class="space-y-1">
                      <p class="blr-field">Boundary</p>
                      <BlrProse :text="context.capabilityBoundary" />
                    </div>
                    <div class="space-y-1 border-t border-default pt-2">
                      <BlrLinks :workspace="workspace" :ids="context.capabilityIds" kind="capability" :max="6" interactive @select="inspect" />
                      <BlrLinks :workspace="workspace" :ids="context.screenIds" kind="screen" :max="6" interactive @select="inspect" />
                      <BlrLinks :workspace="workspace" :ids="context.journeyIds" kind="journey" label="Journeys completable here" :max="6" interactive @select="inspect" />
                    </div>
                  </article>
                </div>
              </section>

              <section v-if="workspace.actors.length" class="space-y-3">
                <h3 class="text-base font-semibold tracking-tight text-highlighted">
                  Actors
                </h3>
                <div class="grid gap-3 sm:grid-cols-2">
                  <article v-for="actor in workspace.actors" :key="actor.id" class="rounded-xl border border-default bg-default p-4">
                    <div class="flex items-center gap-2">
                      <BlrKind kind="actor" :labelled="false" />
                      <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ actor.title }}</span>
                      <UBadge color="neutral" variant="subtle" size="sm">
                        {{ actor.actorKind }} · {{ actor.relationship }}
                      </UBadge>
                      <UButton icon="i-lucide-book-open" size="xs" color="neutral" variant="ghost" aria-label="Open full content" @click="inspect(actor)" />
                    </div>
                    <p class="mt-1.5 text-sm leading-6 text-muted">
                      {{ firstSentence(actor.lead, 180) }}
                    </p>
                    <BlrLinks class="mt-2" :workspace="workspace" :ids="actor.journeyIds" kind="journey" label="Performs" :max="4" interactive @select="inspect" />
                  </article>
                </div>
              </section>

              <section v-if="referenceGroups.length" class="space-y-3">
                <h3 class="text-base font-semibold tracking-tight text-highlighted">
                  References <span class="blr-meta ms-1">{{ workspace.counts.references }}</span>
                </h3>
                <div v-for="group in referenceGroups" :key="group.ownerId" class="space-y-1.5">
                  <p class="flex items-center gap-1.5 text-sm text-muted">
                    <BlrKind :kind="group.ownerKind" :labelled="false" size="xs" />
                    {{ group.ownerTitle }}
                  </p>
                  <BlrRefs :references="group.references" label="" />
                </div>
              </section>
            </div>
          </div>
        </template>
      </main>
    </div>

    <!-- The shared inspector: every entity selection lands in it. -->
    <BlrInspector
      v-model:tab="inspectorTab"
      :workspace="workspace"
      :entity="inspected"
      @select="inspect"
      @close="inspected = null"
    />
  </div>
</template>

<style scoped>
/*
  The lab's categorical slots, mirrored from reportPalette.ts so the matrix
  marks resolve colour in CSS exactly like the flow surfaces do.
*/
.cg-root {
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
}

.dark .cg-root {
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

/* --- rail --- */
.cg-rail-item {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  width: 100%;
  padding: 0.45rem 1rem;
  border-inline-start: 2px solid transparent;
  text-align: start;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.cg-rail-item:hover {
  background: color-mix(in srgb, var(--ui-bg-elevated) 60%, transparent);
}

.cg-rail-item.is-active {
  border-inline-start-color: var(--ui-primary);
  background: color-mix(in srgb, var(--ui-bg-elevated) 85%, transparent);
}

/* --- matrix table --- */
/* The matrix takes the whole pane: the row-head column is fixed and every
   data column shares the remaining width, so column heads stay horizontal
   and readable instead of rotating to fit. */
.cg-table {
  --cg-grid: color-mix(in srgb, var(--ui-border) 60%, transparent);
  width: 100%;
  min-width: 44rem;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}

.cg-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: var(--ui-bg);
  border-bottom: 1px solid var(--ui-border-accented);
}

.cg-corner {
  position: sticky;
  left: 0;
  z-index: 4;
  width: 16rem;
  padding: 0.5rem 0.75rem;
  border-inline-end: 1px solid var(--ui-border-accented);
  text-align: start;
  vertical-align: bottom;
}

.cg-colhead {
  padding: 0.6rem 0.6rem;
  vertical-align: bottom;
}

.cg-colhead-btn {
  display: block;
  width: 100%;
  cursor: pointer;
  text-align: center;
}

.cg-colhead-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.3;
  color: var(--ui-text);
  text-wrap: balance;
  transition: color 0.15s ease;
}

.cg-colhead-sub {
  display: block;
  margin-top: 0.15rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cg-colhead.is-hot .cg-colhead-text,
.cg-colhead-btn:hover .cg-colhead-text {
  color: var(--ui-text-highlighted);
}

.cg-rowhead {
  position: sticky;
  left: 0;
  z-index: 2;
  padding: 0;
  background: var(--ui-bg);
  border-inline-end: 1px solid var(--ui-border-accented);
  border-bottom: 1px solid var(--cg-grid);
}

.cg-rowhead-btn {
  display: flex;
  gap: 0.55rem;
  align-items: center;
  width: 100%;
  padding: 0.4rem 0.75rem;
  border-inline-start: 3px solid var(--row-color, var(--ui-border));
  text-align: start;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.cg-table tbody tr:hover .cg-rowhead-btn,
.cg-rowhead-btn:hover {
  background: color-mix(in srgb, var(--ui-bg-elevated) 75%, transparent);
}

.cg-cell {
  height: 2.75rem;
  padding: 0;
  text-align: center;
  border-bottom: 1px solid var(--cg-grid);
  border-inline-end: 1px solid var(--cg-grid);
}

.cg-table tbody tr:hover .cg-cell,
.cg-cell.is-hot {
  background: color-mix(in srgb, var(--ui-text-dimmed) 8%, transparent);
}

.cg-cell.is-selected {
  box-shadow: inset 0 0 0 2px var(--ui-primary);
}

.cg-cell-btn {
  display: flex;
  gap: 3px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.cg-cell-btn:focus-visible {
  outline: 2px solid var(--ui-primary);
  outline-offset: -2px;
}

/* Marks: filled = direct (authored), ring = derived (computed). */
.cg-dot {
  flex-shrink: 0;
  width: 11px;
  height: 11px;
  border-radius: 9999px;
  background: var(--row-color, var(--ui-text-toned));
}

.cg-ring {
  flex-shrink: 0;
  width: 11px;
  height: 11px;
  border-radius: 9999px;
  border: 2.5px solid var(--row-color, var(--ui-text-toned));
  background: transparent;
}

/* --- journey comparison table --- */
.cg-jtable thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 0.5rem 0.75rem;
  background: var(--ui-bg);
  border-bottom: 1px solid var(--ui-border-accented);
  text-align: start;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--ui-text-muted);
}
</style>
