<script setup lang="ts">
/**
 * Meridian — the sectioned reference answer to the report brief.
 *
 * IA: a left section rail gives one section per Product question — Overview
 * (what is this Product?), Access (who enters, through which contexts?),
 * Screens (what visible surface exists? — the shared Screen map with a Journey
 * overlay), Journeys (what promises are kept? — cards, a comparison table, and
 * full journey detail with complete Scenario flows), Capabilities (what can it
 * durably do? — Domain groups plus two named matrices whose cells explain
 * themselves), and Rules (what must always hold? — direct attachments versus
 * derived reach). Selecting any entity anywhere docks a right-hand inspector
 * with two tabs: Detail (BlrEntityDetail, complete content) and Map
 * (BlrTopology, the contextual neighbourhood). Nothing here is scored or
 * graded; every number is a labelled, derivable count.
 */
import type {
  AnyEntityView,
  CapabilityView,
  DomainView,
  JourneyView,
  ReportEntityKind,
  ReportWorkspace,
  RuleView,
  WorkspaceCounts
} from '../utils/reportWorkspace'
import { REPORT_ENTITY_KINDS, resolveEntities } from '../utils/reportWorkspace'
import { buildScreenMap } from '../utils/flowGraph'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

/* Sections ---------------------------------------------------------- */

type SectionId = 'overview' | 'access' | 'screens' | 'journeys' | 'capabilities' | 'rules'

const SECTIONS: Array<{ id: SectionId, label: string, icon: string, question: string }> = [
  { id: 'overview', label: 'Overview', icon: 'i-lucide-compass', question: 'What is this Product?' },
  { id: 'access', label: 'Access', icon: 'i-lucide-door-open', question: 'Who enters the Product, and through which contexts?' },
  { id: 'screens', label: 'Screens', icon: 'i-lucide-monitor', question: 'What visible surface does the Product present?' },
  { id: 'journeys', label: 'Journeys', icon: 'i-lucide-route', question: 'What promises does the Product keep?' },
  { id: 'capabilities', label: 'Capabilities', icon: 'i-lucide-zap', question: 'What can the Product durably do?' },
  { id: 'rules', label: 'Rules', icon: 'i-lucide-scale', question: 'What must always hold true?' }
]

const section = ref<SectionId>('overview')
const paneRef = ref<HTMLElement | null>(null)
watch(section, () => {
  paneRef.value?.scrollTo({ top: 0 })
})

const current = computed(() => SECTIONS.find(item => item.id === section.value)!)

const sectionCounts = computed<Record<SectionId, number | null>>(() => {
  const c = props.workspace.counts
  return {
    overview: null,
    access: c.actors + c.interfaces + c.experiences,
    screens: c.screens,
    journeys: c.journeys,
    capabilities: c.capabilities,
    rules: c.rules
  }
})

/* Inspector: the docked right column every selection lands in -------- */

const inspected = ref<AnyEntityView | null>(null)
const inspectorTab = ref<'detail' | 'map'>('detail')

function inspect(entity: AnyEntityView) {
  inspected.value = entity
  inspectorTab.value = 'detail'
}

function openMap(entity: AnyEntityView) {
  inspected.value = entity
  inspectorTab.value = 'map'
}

function inspectById(entityId: string) {
  const entity = props.workspace.byId.get(entityId)
  if (entity) inspect(entity)
}

/* Overview ----------------------------------------------------------- */

const COUNT_KEY: Partial<Record<ReportEntityKind, keyof WorkspaceCounts>> = {
  actor: 'actors', interface: 'interfaces', experience: 'experiences', screen: 'screens', domain: 'domains',
  capability: 'capabilities', journey: 'journeys', scenario: 'scenarios', rule: 'rules'
}

const SECTION_OF: Partial<Record<ReportEntityKind, SectionId>> = {
  actor: 'access', interface: 'access', experience: 'access', screen: 'screens', domain: 'capabilities',
  capability: 'capabilities', journey: 'journeys', scenario: 'journeys', rule: 'rules'
}

function tileCount(kind: ReportEntityKind): number {
  const key = COUNT_KEY[kind]
  return key ? props.workspace.counts[key] : 0
}

function jumpToKind(kind: ReportEntityKind) {
  section.value = SECTION_OF[kind] ?? 'overview'
}

const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'neutral'> = { complete: 'success', partial: 'warning', draft: 'neutral' }

const allLimitations = computed(() =>
  [...new Set([...props.workspace.coverage.limitations, ...props.workspace.identity.limitations])])

/* Access ------------------------------------------------------------- */

const ACCESS_TONE: Record<string, 'success' | 'warning' | 'error'> = { public: 'success', authenticated: 'warning', restricted: 'error' }

const accessContexts = computed(() =>
  [...props.workspace.interfaces, ...props.workspace.experiences].map(entity => ({
    entity,
    accessMode: entity.kind === 'experience' ? entity.accessMode : null,
    within: entity.kind === 'experience'
      ? resolveEntities(props.workspace, entity.interfaceIds).map(item => item.title).join(', ')
      : '',
    boundary: firstSentence(entity.capabilityBoundary, 220),
    counts: { screens: entity.screenIds.length, journeys: entity.journeyIds.length, capabilities: entity.capabilityIds.length }
  })))

/* Screens: the shared map with a Journey overlay --------------------- */

const overlayJourneyId = ref<string | null>(null)

const overlayJourney = computed<JourneyView | null>(() => {
  const entity = overlayJourneyId.value ? props.workspace.byId.get(overlayJourneyId.value) : null
  return entity && entity.kind === 'journey' ? entity : null
})

function toggleOverlay(journeyId: string) {
  overlayJourneyId.value = overlayJourneyId.value === journeyId ? null : journeyId
}

const screenMap = computed(() => buildScreenMap(props.workspace, {
  emphasizeScreenIds: overlayJourney.value ? new Set(overlayJourney.value.screenIds) : null,
  selectedId: inspected.value?.id ?? null
}))

/* Journeys: cards, table, and full detail with Scenario flows -------- */

const journeyMode = ref<'cards' | 'table'>('cards')
const openJourneyId = ref<string | null>(null)

const openJourney = computed<JourneyView | null>(() => {
  const entity = openJourneyId.value ? props.workspace.byId.get(openJourneyId.value) : null
  return entity && entity.kind === 'journey' ? entity : null
})

const journeyScenarios = computed(() =>
  openJourney.value ? props.workspace.scenariosByJourney.get(openJourney.value.id) ?? [] : [])

const scenariosOf = (journeyId: string) => props.workspace.scenariosByJourney.get(journeyId) ?? []
const titlesOf = (ids: string[]) => resolveEntities(props.workspace, ids).map(entity => entity.title).join(', ')

interface JourneyColumn {
  key: string
  label: string
  numeric?: boolean
  value: (journey: JourneyView) => string | number
  hint?: (journey: JourneyView) => string
}

const journeyColumns: JourneyColumn[] = [
  { key: 'title', label: 'Journey', value: journey => journey.title },
  { key: 'actors', label: 'Actors', value: journey => titlesOf(journey.actorIds) },
  {
    key: 'contexts',
    label: 'Contexts',
    numeric: true,
    value: journey => journey.availability.length,
    hint: journey => journey.availability
      .map(pair => pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : pair.interfaceTitle)
      .join(', ')
  },
  { key: 'capabilities', label: 'Capabilities', numeric: true, value: journey => journey.capabilityIds.length, hint: journey => titlesOf(journey.capabilityIds) },
  { key: 'screens', label: 'Screens', numeric: true, value: journey => journey.screenIds.length, hint: journey => titlesOf(journey.screenIds) },
  { key: 'scenarios', label: 'Scenarios', numeric: true, value: journey => journey.scenarioIds.length, hint: journey => titlesOf(journey.scenarioIds) },
  { key: 'rules', label: 'Rules', numeric: true, value: journey => journey.ruleIds.length, hint: journey => titlesOf(journey.ruleIds) },
  { key: 'steps', label: 'Steps', numeric: true, value: journey => journey.stepCount }
]

const journeySort = ref<{ key: string, dir: 1 | -1 }>({ key: 'title', dir: 1 })

function sortBy(key: string) {
  journeySort.value = journeySort.value.key === key
    ? { key, dir: journeySort.value.dir === 1 ? -1 : 1 }
    : { key, dir: 1 }
}

const sortedJourneys = computed(() => {
  const column = journeyColumns.find(item => item.key === journeySort.value.key) ?? journeyColumns[0]!
  return [...props.workspace.journeys].sort((left, right) => {
    const a = column.value(left)
    const b = column.value(right)
    const compared = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))
    return compared * journeySort.value.dir
  })
})

/* Capabilities: Domain groups plus two named matrices ---------------- */

const domainGroups = computed<Array<{ key: string, domain: DomainView | null, capabilities: CapabilityView[] }>>(() => {
  const groups: Array<{ key: string, domain: DomainView | null, capabilities: CapabilityView[] }> = props.workspace.domains
    .map(domain => ({ key: domain.id, domain, capabilities: props.workspace.capabilitiesByDomain.get(domain.id) ?? [] }))
  const undomained = props.workspace.capabilitiesByDomain.get('') ?? []
  if (undomained.length) groups.push({ key: '', domain: null, capabilities: undomained })
  return groups
})

type MatrixId = 'journeys' | 'rules'

/** Direct means the relation is authored; domain means a Rule reaches the Capability through its Domain. */
function ruleTouch(capability: CapabilityView, rule: RuleView): 'direct' | 'domain' | null {
  if (rule.capabilityIds.includes(capability.id)) return 'direct'
  if (capability.domainId !== undefined && rule.domainIds.includes(capability.domainId)) return 'domain'
  return null
}

function cellTouch(matrix: MatrixId, capability: CapabilityView, column: AnyEntityView): 'direct' | 'domain' | null {
  if (matrix === 'journeys') return capability.journeyIds.includes(column.id) ? 'direct' : null
  return column.kind === 'rule' ? ruleTouch(capability, column) : null
}

const matrices = computed<Array<{ id: MatrixId, label: string, question: string, columns: AnyEntityView[], emptyNote: string, legend: boolean }>>(() => [
  {
    id: 'journeys',
    label: 'Matrix · Capabilities × Journeys',
    question: 'Which promises depend on each Capability?',
    columns: props.workspace.journeys,
    emptyNote: 'No Journeys to compare against.',
    legend: false
  },
  {
    id: 'rules',
    label: 'Matrix · Capabilities × Business rules',
    question: 'Which Rules constrain each Capability?',
    columns: props.workspace.rules,
    emptyNote: 'No Business Rules to compare against.',
    legend: true
  }
])

const matrixPick = ref<{ matrix: MatrixId, rowId: string, colId: string } | null>(null)

function pickCell(matrix: MatrixId, rowId: string, colId: string) {
  const picked = matrixPick.value
  matrixPick.value = picked && picked.matrix === matrix && picked.rowId === rowId && picked.colId === colId
    ? null
    : { matrix, rowId, colId }
}

function isPicked(matrix: MatrixId, rowId: string, colId: string): boolean {
  const picked = matrixPick.value
  return Boolean(picked && picked.matrix === matrix && picked.rowId === rowId && picked.colId === colId)
}

const matrixExplanation = computed(() => {
  const picked = matrixPick.value
  if (!picked) return null
  const capability = props.workspace.byId.get(picked.rowId)
  const other = props.workspace.byId.get(picked.colId)
  if (!capability || capability.kind !== 'capability' || !other) return null
  if (picked.matrix === 'journeys' && other.kind === 'journey') {
    const sharedScreens = other.screenIds.filter(id => capability.screenIds.includes(id))
    return {
      capability,
      other,
      text: `“${other.title}” lists “${capability.title}” among the Capabilities it uses`
        + `${sharedScreens.length ? `; ${sharedScreens.length} of the Journey's Screens expose it` : ''}.`
    }
  }
  if (picked.matrix === 'rules' && other.kind === 'rule') {
    return {
      capability,
      other,
      text: ruleTouch(capability, other) === 'direct'
        ? `“${other.title}” names “${capability.title}” directly — the constraint is authored on the Rule.`
        : `“${other.title}” constrains the Domain that contains “${capability.title}”, so the Capability inherits the constraint (derived).`
    }
  }
  return null
})

/* Rules: ordered by binding count, direct versus derived reach ------- */

const bindingCount = (rule: RuleView): number =>
  rule.domainIds.length + rule.capabilityIds.length + rule.journeyIds.length + rule.scenarioIds.length

const sortedRules = computed(() =>
  [...props.workspace.rules].sort((left, right) =>
    bindingCount(right) - bindingCount(left) || left.title.localeCompare(right.title)))

const activeRuleId = ref<string | null>(null)

const activeRule = computed<RuleView | null>(() => {
  const chosen = activeRuleId.value ? props.workspace.byId.get(activeRuleId.value) : null
  if (chosen && chosen.kind === 'rule') return chosen
  return sortedRules.value[0] ?? null
})

const ruleReach = computed(() => {
  const rule = activeRule.value
  if (!rule) return null
  const capabilities = props.workspace.capabilities
    .filter(capability => !rule.capabilityIds.includes(capability.id) && ruleTouch(capability, rule) === 'domain')
    .map(capability => capability.id)
  const viaScenario = props.workspace.scenarios
    .filter(scenario => rule.scenarioIds.includes(scenario.id))
    .map(scenario => scenario.journeyId)
  const viaCapability = props.workspace.journeys
    .filter(journey => journey.capabilityIds.some(id => rule.capabilityIds.includes(id)))
    .map(journey => journey.id)
  const journeys = [...new Set([...viaScenario, ...viaCapability])].filter(id => !rule.journeyIds.includes(id))
  const screens = props.workspace.screens
    .filter(screen => screen.capabilityIds.some(id => rule.capabilityIds.includes(id))
      || screen.scenarioIds.some(id => rule.scenarioIds.includes(id)))
    .map(screen => screen.id)
  return { capabilities, journeys, screens, empty: !capabilities.length && !journeys.length && !screens.length }
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex min-h-0 flex-1">
      <!-- Section rail -->
      <nav class="flex w-56 shrink-0 flex-col border-e border-default">
        <div class="flex items-center gap-2.5 border-b border-muted px-4 py-4">
          <img v-if="logoSrc" :src="logoSrc" alt="" class="size-7 shrink-0 rounded-md border border-muted bg-elevated object-contain p-0.5">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-highlighted">{{ workspace.identity.title }}</p>
            <p class="mer-label truncate">Product report</p>
          </div>
        </div>
        <ul class="blr-pane flex-1 space-y-0.5 p-2">
          <li v-for="item in SECTIONS" :key="item.id">
            <button
              type="button"
              class="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 transition"
              :class="section === item.id ? 'bg-elevated text-highlighted' : 'text-toned hover:bg-elevated/50 hover:text-highlighted'"
              @click="section = item.id"
            >
              <UIcon :name="item.icon" class="size-4 shrink-0" :class="section === item.id ? 'text-primary' : 'text-dimmed'" />
              <span class="min-w-0 flex-1 truncate text-start text-sm">{{ item.label }}</span>
              <span v-if="sectionCounts[item.id] !== null" class="font-mono text-[11px] text-dimmed tabular-nums">{{ sectionCounts[item.id] }}</span>
            </button>
          </li>
        </ul>
        <div class="border-t border-muted px-4 py-3">
          <p class="font-mono text-[10px] leading-relaxed text-dimmed">
            {{ workspace.identity.generator.name }} v{{ workspace.identity.generator.version }}<br>
            {{ workspace.identity.generatedAt }}
          </p>
        </div>
      </nav>

      <!-- Section pane -->
      <main ref="paneRef" class="blr-pane min-w-0 flex-1">
        <header class="space-y-1 border-b border-muted px-6 pt-6 pb-5">
          <p class="mer-label">{{ current.label }}</p>
          <h2 class="text-xl tracking-tight text-highlighted">{{ current.question }}</h2>
        </header>

        <!-- Overview -->
        <div v-if="section === 'overview'" class="space-y-8 px-6 py-6">
          <section class="max-w-3xl space-y-3">
            <div v-if="workspace.identity.categoryLabel || workspace.identity.tags.length" class="flex flex-wrap items-center gap-1.5">
              <UBadge v-if="workspace.identity.categoryLabel" color="primary" variant="subtle" size="sm">{{ workspace.identity.categoryLabel }}</UBadge>
              <UBadge v-for="tag in workspace.identity.tags" :key="tag" color="neutral" variant="outline" size="sm">{{ tag }}</UBadge>
            </div>
            <h3 class="text-2xl tracking-tight text-highlighted">{{ workspace.identity.title }}</h3>
            <p class="text-base leading-relaxed text-toned">{{ workspace.identity.summary }}</p>
            <BlrProse :text="workspace.identity.description" />
            <div v-if="workspace.identity.intent" class="space-y-1.5">
              <h4 class="mer-label">Intent</h4>
              <BlrProse :text="workspace.identity.intent" />
            </div>
            <div v-if="workspace.identity.supportingContent" class="space-y-1.5">
              <h4 class="mer-label">Supporting context</h4>
              <BlrProse :text="workspace.identity.supportingContent" />
            </div>
            <p class="text-xs text-dimmed">
              <template v-if="workspace.identity.authors.length">
                By
                <template v-for="(author, index) in workspace.identity.authors" :key="author.name">
                  <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">{{ author.name }}</a>
                  <span v-else>{{ author.name }}</span><span v-if="index < workspace.identity.authors.length - 1">, </span>
                </template>
                ·
              </template>
              schema {{ workspace.identity.schemaVersion }}
              · {{ workspace.identity.referenceProfile }} references<span v-if="workspace.identity.license"> · {{ workspace.identity.license }}</span>
            </p>
          </section>

          <section class="space-y-2.5">
            <h4 class="mer-label">What the model contains</h4>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              <button
                v-for="meta in REPORT_ENTITY_KINDS"
                :key="meta.kind"
                type="button"
                class="rounded-lg border border-default p-3 text-start transition hover:border-accented hover:bg-elevated/40"
                :title="`Open the ${SECTION_OF[meta.kind] ?? 'overview'} section`"
                @click="jumpToKind(meta.kind)"
              >
                <BlrKind :kind="meta.kind" :labelled="false" />
                <p class="mt-1 text-lg font-medium text-highlighted tabular-nums">{{ tileCount(meta.kind) }}</p>
                <p class="text-xs text-dimmed">{{ meta.plural }}</p>
              </button>
            </div>
            <p class="text-xs text-dimmed">
              Depth (derived): {{ workspace.counts.steps }} steps · {{ workspace.counts.decisionPoints }} decision points
              · {{ workspace.counts.branches }} branches · {{ workspace.counts.edgeCases }} edge cases
              · {{ workspace.counts.screenStates }} screen states · {{ workspace.counts.entryPoints }} entry points
              · {{ workspace.counts.availabilityPairs }} availability scopes.
            </p>
          </section>

          <section v-if="workspace.scenarioKinds.length" class="space-y-2">
            <h4 class="mer-label">Scenario kinds</h4>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="kind in workspace.scenarioKinds" :key="kind.id" class="rounded-full border border-default px-2.5 py-1 text-xs text-toned" :title="kind.description">
                {{ kind.name }} <span class="font-mono text-[10px] text-dimmed tabular-nums">{{ kind.count }}</span>
              </span>
            </div>
          </section>

          <section class="grid gap-4 lg:grid-cols-2">
            <div class="space-y-3 rounded-lg border border-default p-4">
              <div class="flex items-center gap-2">
                <h4 class="mer-label">Coverage</h4>
                <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">{{ workspace.coverage.status }}</UBadge>
              </div>
              <BlrProse v-if="workspace.coverage.rationale" :text="workspace.coverage.rationale" />
              <div v-if="workspace.coverage.method.length" class="space-y-1.5">
                <p class="mer-label">Method</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="item in workspace.coverage.method" :key="item" class="rounded bg-muted px-2 py-0.5 text-xs text-toned">{{ item }}</span>
                </div>
              </div>
              <div v-if="workspace.coverage.sourceAreas.length" class="space-y-1.5">
                <p class="mer-label">Source areas</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="item in workspace.coverage.sourceAreas" :key="item" class="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-toned">{{ item }}</span>
                </div>
              </div>
              <div v-if="workspace.coverage.unmapped.length" class="space-y-1.5">
                <p class="mer-label">Unmapped</p>
                <ul class="list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed">
                  <li v-for="item in workspace.coverage.unmapped" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
            <div class="space-y-3 rounded-lg border border-default p-4">
              <h4 class="mer-label">Limitations</h4>
              <ul v-if="allLimitations.length" class="list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed">
                <li v-for="item in allLimitations" :key="item">{{ item }}</li>
              </ul>
              <p v-else class="text-sm text-dimmed italic">No limitations recorded.</p>
              <BlrRefs :references="workspace.identity.references" label="Product references" />
              <p class="text-xs text-dimmed">{{ workspace.counts.references }} references across the whole model — each entity lists its own in the inspector.</p>
            </div>
          </section>
        </div>

        <!-- Access -->
        <div v-else-if="section === 'access'" class="space-y-8 px-6 py-6">
          <section class="space-y-3">
            <h3 class="mer-label">Actors · {{ workspace.actors.length }}</h3>
            <p v-if="!workspace.actors.length" class="text-sm text-dimmed italic">No Actors authored in this model.</p>
            <div class="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              <article v-for="actor in workspace.actors" :key="actor.id" class="rounded-lg border border-default p-3.5">
                <button type="button" class="flex w-full items-center gap-2 text-start" @click="inspect(actor)">
                  <BlrKind kind="actor" :labelled="false" />
                  <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ actor.title }}</span>
                  <UBadge color="neutral" variant="subtle" size="sm">{{ actor.actorKind }} · {{ actor.relationship }}</UBadge>
                </button>
                <p class="mt-1.5 text-xs leading-relaxed text-dimmed">{{ firstSentence(actor.lead, 180) }}</p>
                <div class="mt-2.5 space-y-1.5">
                  <BlrLinks :workspace="workspace" :ids="actor.interfaceIds" kind="interface" label="Enters" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="actor.experienceIds" kind="experience" label="Experiences" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="actor.journeyIds" kind="journey" label="Performs" interactive @select="inspect($event)" />
                </div>
              </article>
            </div>
          </section>

          <section class="space-y-3">
            <h3 class="mer-label">Access contexts · {{ accessContexts.length }}</h3>
            <p v-if="!workspace.experiences.length" class="text-xs text-dimmed">This model declares no Experiences — each Interface is a single access context.</p>
            <div class="grid gap-3 xl:grid-cols-2">
              <article v-for="context in accessContexts" :key="context.entity.id" class="flex flex-col rounded-lg border border-default">
                <header class="flex flex-wrap items-center gap-2 border-b border-muted px-3.5 py-2.5">
                  <BlrKind :kind="context.entity.kind" />
                  <button type="button" class="min-w-0 flex-1 truncate text-start text-sm font-medium text-highlighted hover:text-primary" @click="inspect(context.entity)">
                    {{ context.entity.title }}
                  </button>
                  <UBadge v-if="context.accessMode" :color="ACCESS_TONE[context.accessMode] || 'neutral'" variant="subtle" size="sm">{{ context.accessMode }}</UBadge>
                </header>
                <div class="space-y-2.5 px-3.5 py-3">
                  <p v-if="context.within" class="text-xs text-dimmed">Within {{ context.within }}</p>
                  <div>
                    <p class="mer-label">Capability boundary</p>
                    <p class="mt-1 text-xs leading-relaxed text-toned">{{ context.boundary }}</p>
                  </div>
                  <BlrAvail :pairs="[]" :entry-points="context.entity.entryPoints" label="Entry points" />
                  <BlrLinks :workspace="workspace" :ids="context.entity.actorIds" kind="actor" label="Who enters" interactive @select="inspect($event)" />
                </div>
                <footer class="mt-auto border-t border-muted px-3.5 py-2">
                  <p class="font-mono text-[10px] text-dimmed tabular-nums">
                    Available here (derived): {{ context.counts.screens }} screens · {{ context.counts.journeys }} journeys · {{ context.counts.capabilities }} capabilities
                  </p>
                </footer>
              </article>
            </div>
          </section>
        </div>

        <!-- Screens -->
        <div v-else-if="section === 'screens'" class="flex flex-col px-6 py-5">
          <p v-if="!workspace.counts.screens" class="pb-3 text-sm text-dimmed">No Screens are authored — the Interfaces below are not graphical surfaces.</p>
          <div v-if="workspace.journeys.length" class="flex flex-wrap items-center gap-1.5 pb-2">
            <span class="mer-label me-1">Journey overlay</span>
            <button
              v-for="journey in workspace.journeys"
              :key="journey.id"
              type="button"
              class="rounded-full border px-2.5 py-1 text-xs transition"
              :class="overlayJourneyId === journey.id ? 'border-primary bg-primary/10 text-highlighted' : 'border-default text-toned hover:bg-elevated/60'"
              @click="toggleOverlay(journey.id)"
            >
              {{ journey.title }}
            </button>
            <UButton v-if="overlayJourneyId" icon="i-lucide-x" color="neutral" variant="ghost" size="xs" label="Clear" @click="overlayJourneyId = null" />
          </div>
          <p v-if="overlayJourney" class="pb-3 text-xs text-dimmed">
            {{ overlayJourney.screenIds.length }} of {{ workspace.counts.screens }} Screens participate in “{{ overlayJourney.title }}” — the rest are faded, not removed.
          </p>
          <p v-else class="pb-3 text-xs text-dimmed">
            The complete visible surface: Interfaces are columns, Experiences are nested groups.
            Select a Screen to read its information, actions, states and Capabilities.
          </p>
          <div class="h-[68vh] min-h-[24rem] overflow-hidden rounded-lg border border-default">
            <BlrFlowCanvas :nodes="screenMap.nodes" @select="inspectById($event)" />
          </div>
        </div>

        <!-- Journeys -->
        <div v-else-if="section === 'journeys'">
          <!-- Journey detail -->
          <div v-if="openJourney" class="space-y-6 px-6 py-5">
            <div class="flex flex-wrap items-center gap-2">
              <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="xs" label="All journeys" @click="openJourneyId = null" />
              <span class="ms-auto flex items-center gap-1">
                <UButton icon="i-lucide-book-open" color="neutral" variant="outline" size="xs" label="Inspect" @click="inspect(openJourney)" />
                <UButton icon="i-lucide-waypoints" color="neutral" variant="outline" size="xs" label="Topology" @click="openMap(openJourney)" />
              </span>
            </div>
            <header class="max-w-3xl space-y-2">
              <BlrKind kind="journey" />
              <h3 class="text-2xl tracking-tight text-highlighted">{{ openJourney.title }}</h3>
              <BlrProse :text="openJourney.lead" size="base" />
            </header>
            <div class="grid gap-5 rounded-lg border border-default p-4 lg:grid-cols-2">
              <BlrAvail :pairs="openJourney.availability" :entry-points="openJourney.entryPoints" />
              <div class="space-y-1.5">
                <BlrLinks :workspace="workspace" :ids="openJourney.actorIds" kind="actor" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="openJourney.capabilityIds" kind="capability" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="openJourney.domainIds" kind="domain" label="Domains (derived)" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="openJourney.screenIds" kind="screen" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="openJourney.ruleIds" kind="rule" label="Constrained by" interactive @select="inspect($event)" />
              </div>
            </div>
            <section class="space-y-4">
              <h4 class="mer-label">Scenarios · {{ journeyScenarios.length }}</h4>
              <p v-if="!journeyScenarios.length" class="text-sm text-dimmed italic">No Scenarios authored for this Journey.</p>
              <article v-for="scenario in journeyScenarios" :key="scenario.id" class="rounded-lg border border-default">
                <header class="flex flex-wrap items-center gap-2 border-b border-muted px-4 py-2.5">
                  <BlrKind kind="scenario" :labelled="false" />
                  <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ scenario.title }}</span>
                  <UBadge color="neutral" variant="subtle" size="sm">{{ scenario.kindName }}</UBadge>
                  <UButton icon="i-lucide-book-open" color="neutral" variant="ghost" size="xs" label="Inspect" @click="inspect(scenario)" />
                </header>
                <div class="mer-flow px-4 py-4">
                  <div class="mer-flow-row">
                    <span class="mer-flow-rail"><span class="mer-flow-marker"><UIcon name="i-lucide-play" class="size-3" /></span></span>
                    <div class="min-w-0 flex-1 space-y-1">
                      <p class="mer-label">Trigger</p>
                      <BlrProse :text="scenario.trigger" />
                    </div>
                  </div>
                  <div v-for="(step, index) in scenario.steps" :key="index" class="mer-flow-row">
                    <span class="mer-flow-rail"><span class="mer-flow-marker tabular-nums">{{ index + 1 }}</span></span>
                    <p class="min-w-0 flex-1 pt-0.5 text-sm leading-relaxed text-toned">{{ step }}</p>
                  </div>
                  <div v-for="(point, index) in scenario.decisionPoints" :key="`decision-${index}`" class="mer-flow-row">
                    <span class="mer-flow-rail"><span class="mer-flow-marker"><UIcon name="i-lucide-split" class="size-3" /></span></span>
                    <div class="min-w-0 flex-1 rounded-lg border border-dashed border-default p-3">
                      <p class="mer-label">Decision</p>
                      <p class="mt-1 text-sm font-medium text-highlighted">{{ point.title }}</p>
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
                  <div class="mer-flow-row">
                    <span class="mer-flow-rail"><span class="mer-flow-marker"><UIcon name="i-lucide-flag" class="size-3" /></span></span>
                    <div class="min-w-0 flex-1 space-y-1">
                      <p class="mer-label">Outcome</p>
                      <BlrProse :text="scenario.outcome" />
                    </div>
                  </div>
                  <div v-if="scenario.edgeCases.length" class="mer-flow-row">
                    <span class="mer-flow-rail"><span class="mer-flow-marker"><UIcon name="i-lucide-triangle-alert" class="size-3" /></span></span>
                    <div class="min-w-0 flex-1 space-y-1">
                      <p class="mer-label">Edge cases · {{ scenario.edgeCases.length }}</p>
                      <ul class="list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed">
                        <li v-for="(item, index) in scenario.edgeCases" :key="index">{{ item }}</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <footer class="space-y-1.5 border-t border-muted px-4 py-2.5">
                  <BlrLinks :workspace="workspace" :ids="scenario.screenIds" kind="screen" label="On screens" interactive @select="inspect($event)" />
                  <BlrLinks :workspace="workspace" :ids="scenario.ruleIds" kind="rule" label="Constrained by" interactive @select="inspect($event)" />
                  <BlrAvail :pairs="scenario.availability" inherited-note="Applies in every context the Journey declares." />
                </footer>
              </article>
            </section>
          </div>

          <!-- Journey browser -->
          <template v-else>
            <div class="flex flex-wrap items-center justify-between gap-2 px-6 pt-5">
              <p class="text-xs text-dimmed">Each Journey is a promise the Product keeps; counts are derived from authored relations.</p>
              <div class="flex items-center gap-0.5 rounded-lg border border-default p-0.5">
                <UButton size="xs" color="neutral" :variant="journeyMode === 'cards' ? 'subtle' : 'ghost'" icon="i-lucide-layout-grid" label="Cards" @click="journeyMode = 'cards'" />
                <UButton size="xs" color="neutral" :variant="journeyMode === 'table' ? 'subtle' : 'ghost'" icon="i-lucide-table" label="Table" @click="journeyMode = 'table'" />
              </div>
            </div>
            <p v-if="!workspace.journeys.length" class="px-6 py-5 text-sm text-dimmed italic">No Journeys authored in this model.</p>

            <div v-else-if="journeyMode === 'cards'" class="grid gap-4 px-6 py-5 lg:grid-cols-2 2xl:grid-cols-3">
              <article v-for="journey in workspace.journeys" :key="journey.id" class="flex flex-col rounded-lg border border-default transition hover:border-accented">
                <div class="flex-1 space-y-2.5 px-4 pt-3.5 pb-3">
                  <div class="flex items-center gap-2">
                    <BlrKind kind="journey" :labelled="false" />
                    <span class="mer-label">{{ journey.scenarioIds.length }} scenarios</span>
                  </div>
                  <button type="button" class="text-start text-base font-medium tracking-tight text-highlighted hover:text-primary" @click="openJourneyId = journey.id">
                    {{ journey.title }}
                  </button>
                  <p class="text-sm leading-relaxed text-toned">{{ firstSentence(journey.lead, 220) }}</p>
                  <BlrLinks :workspace="workspace" :ids="journey.actorIds" kind="actor" interactive @select="inspect($event)" />
                  <BlrAvail :pairs="journey.availability" label="" />
                  <ul v-if="scenariosOf(journey.id).length" class="space-y-1 border-s border-muted ps-3">
                    <li v-for="scenario in scenariosOf(journey.id)" :key="scenario.id" class="flex items-baseline gap-2 text-xs">
                      <span class="shrink-0 font-mono text-[10px] text-dimmed">{{ scenario.kindName }}</span>
                      <span class="truncate text-toned">{{ scenario.title }}</span>
                    </li>
                  </ul>
                  <div class="space-y-1.5">
                    <BlrLinks :workspace="workspace" :ids="journey.screenIds" kind="screen" :max="4" interactive @select="inspect($event)" />
                    <BlrLinks :workspace="workspace" :ids="journey.capabilityIds" kind="capability" :max="4" interactive @select="inspect($event)" />
                    <BlrLinks :workspace="workspace" :ids="journey.ruleIds" kind="rule" :max="3" interactive @select="inspect($event)" />
                  </div>
                </div>
                <footer class="mt-auto flex items-center justify-between border-t border-muted px-4 py-2">
                  <span class="font-mono text-[10px] text-dimmed tabular-nums">{{ journey.stepCount }} authored steps</span>
                  <UButton size="xs" color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-right" label="Read journey" @click="openJourneyId = journey.id" />
                </footer>
              </article>
            </div>

            <div v-else class="px-6 py-5">
              <div class="overflow-x-auto rounded-lg border border-default">
                <table class="w-full min-w-[56rem] border-collapse text-sm">
                  <thead>
                    <tr class="border-b border-default bg-elevated/40">
                      <th v-for="column in journeyColumns" :key="column.key" class="px-3 py-2 text-start">
                        <button type="button" class="mer-label inline-flex items-center gap-1 hover:text-toned" @click="sortBy(column.key)">
                          {{ column.label }}
                          <UIcon v-if="journeySort.key === column.key" :name="journeySort.dir === 1 ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="size-3" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="journey in sortedJourneys"
                      :key="journey.id"
                      class="cursor-pointer border-b border-muted transition last:border-b-0 hover:bg-elevated/50"
                      @click="openJourneyId = journey.id"
                    >
                      <td
                        v-for="column in journeyColumns"
                        :key="column.key"
                        class="px-3 py-2.5 align-top"
                        :class="column.numeric ? 'font-mono text-xs tabular-nums text-toned' : 'text-toned'"
                        :title="column.hint ? column.hint(journey) : undefined"
                      >
                        <span v-if="column.key === 'title'" class="font-medium text-highlighted">{{ journey.title }}</span>
                        <template v-else>{{ column.value(journey) }}</template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="pt-2 text-xs text-dimmed">Hover a count for the names behind it; click a row to read the Journey in full.</p>
            </div>
          </template>
        </div>

        <!-- Capabilities -->
        <div v-else-if="section === 'capabilities'" class="space-y-9 px-6 py-6">
          <p v-if="!workspace.capabilities.length" class="text-sm text-dimmed italic">No Capabilities authored in this model.</p>
          <section v-for="group in domainGroups" :key="group.key" class="space-y-3">
            <header class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b border-muted pb-2">
              <button v-if="group.domain" type="button" class="inline-flex items-center gap-2 text-base font-medium text-highlighted hover:text-primary" @click="inspect(group.domain)">
                <BlrKind kind="domain" :labelled="false" />
                {{ group.domain.title }}
              </button>
              <span v-else class="text-base font-medium text-highlighted">No domain</span>
              <span class="min-w-0 flex-1 truncate text-xs text-dimmed">
                {{ group.domain ? firstSentence(group.domain.lead) : 'Capabilities not grouped under any Domain.' }}
              </span>
              <span class="mer-label shrink-0">{{ group.capabilities.length }} capabilities</span>
            </header>
            <div class="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              <button
                v-for="capability in group.capabilities"
                :key="capability.id"
                type="button"
                class="rounded-lg border border-default p-3.5 text-start transition hover:border-accented hover:bg-elevated/40"
                @click="inspect(capability)"
              >
                <div class="flex items-center gap-2">
                  <BlrKind kind="capability" :labelled="false" />
                  <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ capability.title }}</span>
                </div>
                <p class="mt-1.5 text-xs leading-relaxed text-dimmed">{{ firstSentence(capability.lead, 180) }}</p>
                <p class="mt-2.5 font-mono text-[10px] text-dimmed tabular-nums">
                  {{ capability.journeyIds.length }} journeys · {{ capability.screenIds.length }} screens
                  · {{ capability.ruleIds.length }} rules · {{ capability.availability.length }} contexts
                </p>
              </button>
            </div>
          </section>

          <template v-if="workspace.capabilities.length">
            <section v-for="matrix in matrices" :key="matrix.id" class="space-y-3">
              <header>
                <p class="mer-label">{{ matrix.label }}</p>
                <h3 class="text-lg tracking-tight text-highlighted">{{ matrix.question }}</h3>
              </header>
              <p v-if="!matrix.columns.length" class="text-sm text-dimmed italic">{{ matrix.emptyNote }}</p>
              <template v-else>
                <div class="overflow-x-auto rounded-lg border border-default p-3">
                  <table class="mer-matrix">
                    <thead>
                      <tr>
                        <th></th>
                        <th v-for="column in matrix.columns" :key="column.id">
                          <span class="mer-colhead" :title="column.title">{{ column.title }}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="capability in workspace.capabilities" :key="capability.id">
                        <th>
                          <button type="button" :title="capability.title" class="hover:text-primary" @click="inspect(capability)">{{ capability.title }}</button>
                        </th>
                        <td v-for="column in matrix.columns" :key="column.id">
                          <button
                            v-if="cellTouch(matrix.id, capability, column)"
                            type="button"
                            class="mer-dot"
                            :class="[
                              cellTouch(matrix.id, capability, column) === 'direct' ? 'mer-dot--filled' : 'mer-dot--via',
                              isPicked(matrix.id, capability.id, column.id) && 'mer-dot--picked'
                            ]"
                            :aria-label="`${column.title} — ${capability.title}`"
                            @click="pickCell(matrix.id, capability.id, column.id)"
                          />
                          <span v-else class="mer-dot-empty" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p v-if="matrix.legend" class="text-xs text-dimmed">
                  <span class="mer-dot mer-dot--filled mer-dot--legend" /> named directly on the Rule ·
                  <span class="mer-dot mer-dot--via mer-dot--legend" /> reached through the Capability's Domain (derived).
                </p>
                <div
                  v-if="matrixPick?.matrix === matrix.id && matrixExplanation"
                  class="flex flex-wrap items-center gap-2 rounded-lg border border-default bg-elevated/40 px-3.5 py-2.5"
                >
                  <UIcon name="i-lucide-corner-down-right" class="size-3.5 shrink-0 text-dimmed" />
                  <span class="min-w-0 flex-1 text-sm text-toned">{{ matrixExplanation.text }}</span>
                  <UButton size="xs" color="neutral" variant="outline" :label="matrixExplanation.capability.title" @click="inspect(matrixExplanation.capability)" />
                  <UButton size="xs" color="neutral" variant="outline" :label="matrixExplanation.other.title" @click="inspect(matrixExplanation.other)" />
                </div>
                <p v-else class="text-xs text-dimmed italic">Select a filled cell to read what the relationship means.</p>
              </template>
            </section>
          </template>
        </div>

        <!-- Rules -->
        <div v-else-if="section === 'rules'" class="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
          <div class="space-y-2.5">
            <p class="mer-label">Ordered by direct bindings — a count, not a score</p>
            <p v-if="!workspace.rules.length" class="text-sm text-dimmed italic">No Business Rules authored in this model.</p>
            <ul class="space-y-1.5">
              <li v-for="rule in sortedRules" :key="rule.id">
                <button
                  type="button"
                  class="w-full rounded-lg border p-3 text-start transition"
                  :class="activeRule?.id === rule.id ? 'border-primary bg-primary/5' : 'border-default hover:border-accented hover:bg-elevated/40'"
                  @click="activeRuleId = rule.id"
                >
                  <div class="flex items-center gap-2">
                    <BlrKind kind="rule" :labelled="false" />
                    <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ rule.title }}</span>
                    <span class="shrink-0 font-mono text-[10px] text-dimmed tabular-nums" :title="`${bindingCount(rule)} direct bindings`">{{ bindingCount(rule) }}</span>
                  </div>
                  <p class="mt-1 text-xs leading-relaxed text-dimmed">{{ firstSentence(rule.statement, 140) }}</p>
                </button>
              </li>
            </ul>
          </div>

          <div v-if="activeRule" class="space-y-5">
            <header class="space-y-2.5">
              <div class="flex flex-wrap items-center gap-2">
                <BlrKind kind="rule" />
                <span class="ms-auto flex items-center gap-1">
                  <UButton icon="i-lucide-book-open" color="neutral" variant="outline" size="xs" label="Inspect" @click="inspect(activeRule)" />
                  <UButton icon="i-lucide-waypoints" color="neutral" variant="outline" size="xs" label="Topology" @click="openMap(activeRule)" />
                </span>
              </div>
              <h3 class="text-xl tracking-tight text-highlighted">{{ activeRule.title }}</h3>
              <div class="rounded-lg border-s-2 border-primary bg-elevated/40 p-3">
                <BlrProse :text="activeRule.statement" />
              </div>
              <div v-if="activeRule.rationale" class="space-y-1">
                <p class="mer-label">Rationale</p>
                <BlrProse :text="activeRule.rationale" />
              </div>
            </header>

            <div class="grid gap-4 md:grid-cols-2">
              <section class="space-y-2.5 rounded-lg border border-default p-3.5">
                <p class="mer-label">Direct — authored on the Rule</p>
                <BlrLinks :workspace="workspace" :ids="activeRule.domainIds" kind="domain" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="activeRule.capabilityIds" kind="capability" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="activeRule.journeyIds" kind="journey" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="activeRule.scenarioIds" kind="scenario" interactive @select="inspect($event)" />
                <p v-if="!bindingCount(activeRule)" class="text-xs text-dimmed italic">This Rule names no entities directly.</p>
              </section>
              <section class="space-y-2.5 rounded-lg border border-dashed border-accented p-3.5">
                <p class="mer-label">Derived reach — computed, never authored</p>
                <BlrLinks :workspace="workspace" :ids="ruleReach?.capabilities ?? []" kind="capability" label="Capabilities via Domains" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="ruleReach?.journeys ?? []" kind="journey" label="Journeys via Capabilities and Scenarios" interactive @select="inspect($event)" />
                <BlrLinks :workspace="workspace" :ids="ruleReach?.screens ?? []" kind="screen" label="Screens via Capabilities and Scenarios" interactive @select="inspect($event)" />
                <p v-if="ruleReach?.empty" class="text-xs text-dimmed italic">No reach beyond the direct attachments.</p>
              </section>
            </div>

            <BlrAvail :pairs="activeRule.availability" label="Narrowed availability" inherited-note="Not narrowed — the Rule applies in every availability scope." />
          </div>
        </div>
      </main>

      <!-- Inspector: docked, closable, never an overlay -->
      <aside v-if="inspected" class="flex w-[24rem] shrink-0 flex-col border-s border-default xl:w-[27rem]">
        <div class="flex items-center gap-2 border-b border-default px-4 py-2.5">
          <BlrKind :kind="inspected.kind" :labelled="false" />
          <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ inspected.title }}</span>
          <div class="flex shrink-0 items-center gap-0.5">
            <UButton size="xs" color="neutral" :variant="inspectorTab === 'detail' ? 'subtle' : 'ghost'" icon="i-lucide-book-open" label="Detail" @click="inspectorTab = 'detail'" />
            <UButton size="xs" color="neutral" :variant="inspectorTab === 'map' ? 'subtle' : 'ghost'" icon="i-lucide-waypoints" label="Map" @click="inspectorTab = 'map'" />
            <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" aria-label="Close inspector" @click="inspected = null" />
          </div>
        </div>
        <div v-if="inspectorTab === 'detail'" class="blr-pane flex-1 px-4 py-4">
          <BlrEntityDetail :workspace="workspace" :entity="inspected" @select="inspect($event)" />
        </div>
        <div v-else class="min-h-0 flex-1">
          <BlrTopology :workspace="workspace" :focus-id="inspected.id" direction="TB" @inspect="inspect($event)" />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.mer-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--ui-text-dimmed);
  text-transform: uppercase;
}

/* Scenario flow: one quiet rail, a marker per beat, no diagram noise. */
.mer-flow { display: flex; flex-direction: column; }
.mer-flow-row { display: flex; gap: 0.875rem; padding-bottom: 1rem; }
.mer-flow-row:last-child { padding-bottom: 0; }
.mer-flow-rail { position: relative; display: flex; width: 1.5rem; flex-shrink: 0; flex-direction: column; align-items: center; }

.mer-flow-row:not(:last-child) .mer-flow-rail::after {
  content: '';
  position: absolute;
  top: 1.625rem;
  bottom: -1rem;
  width: 1px;
  background: var(--ui-border);
}

.mer-flow-marker {
  z-index: 1;
  display: flex;
  height: 1.5rem;
  width: 1.5rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ui-border-accented);
  border-radius: 9999px;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-dimmed);
  font-family: var(--font-mono);
  font-size: 10px;
}

/* Matrices: row heads truncate, column heads run vertical, cells stay square. */
.mer-matrix { border-collapse: collapse; }
.mer-matrix thead th { padding: 0 0.2rem 0.5rem; vertical-align: bottom; }
.mer-matrix td { min-width: 1.75rem; padding: 0.15rem 0.2rem; text-align: center; vertical-align: middle; }
.mer-matrix tbody tr:hover { background: color-mix(in srgb, var(--ui-bg-elevated) 55%, transparent); }

.mer-matrix tbody th {
  max-width: 15rem;
  padding: 0.15rem 0.75rem 0.15rem 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ui-text-toned);
  text-align: end;
}

.mer-matrix tbody th button {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mer-colhead {
  display: inline-block;
  max-height: 8.5rem;
  overflow: hidden;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--ui-text-toned);
  text-overflow: ellipsis;
  white-space: nowrap;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.mer-dot { display: inline-block; height: 1rem; width: 1rem; border-radius: 9999px; }
.mer-dot--filled { background: var(--ui-primary); opacity: 0.8; }
.mer-dot--via { border: 1.5px solid var(--ui-primary); background: transparent; opacity: 0.65; }
button.mer-dot:hover { opacity: 1; }
.mer-dot--picked { opacity: 1; outline: 2px solid var(--ui-primary); outline-offset: 2px; }
.mer-dot--legend { height: 0.7rem; width: 0.7rem; vertical-align: middle; }
.mer-dot-empty { display: inline-block; height: 0.3rem; width: 0.3rem; border-radius: 9999px; background: var(--ui-border-accented); opacity: 0.6; }
</style>
