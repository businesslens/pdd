<script setup lang="ts">
/**
 * Canvas — scene-based topology workbench.
 *
 * The most graph-forward design the brief allows, and never one universal
 * graph: the canvas always renders a deliberately scoped *scene*. A left rail
 * lists the scenes — the Overture (identity above an access-only graph), the
 * Surface (the shared Screen map), then one scene per Journey, Domain and
 * Rule. The centre draws the scene: BlrFlowCanvas for the two built graphs,
 * BlrTopology for entity neighbourhoods. The shared inspector slideover shows
 * the complete authored content of whatever is selected, anywhere. A bottom
 * drawer carries the non-graph views in full: the Journey browser
 * (cards ⇄ table ⇄ full detail), the Capability map with two named matrices,
 * and the access-context comparison.
 */
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type {
  AnyEntityView,
  CapabilityView,
  JourneyView,
  ReportEntityKind,
  ReportWorkspace,
  RuleView,
  ScenarioView
} from '../utils/reportWorkspace'
import { ENTITY_KIND_META, REPORT_ENTITY_KINDS, resolveEntities } from '../utils/reportWorkspace'
import { buildNeighbourhood, buildScreenMap, layoutFlow } from '../utils/flowGraph'
import { firstSentence } from '../utils/reportMarkdown'

const UButton = resolveComponent('UButton')

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

interface SceneEntry {
  id: string
  title: string
  chip: string
  kind?: ReportEntityKind
  icon?: string
}

interface SceneGroup {
  label: string
  scenes: SceneEntry[]
}

const SCENE_QUESTIONS: Record<string, string> = {
  overture: 'What is this Product, and who reaches it through what?',
  surface: 'Which Screens exist in each Interface and Experience?',
  journey: 'What directly supports this Journey, and which Rules constrain it?',
  domain: 'What can this part of the Product durably do?',
  rule: 'Where is this Rule enforced, and how far does it reach?'
}

const sceneId = ref('overture')
const sceneQuery = ref('')

const sceneGroups = computed<SceneGroup[]>(() => {
  const workspace = props.workspace
  const directCount = (rule: RuleView) =>
    rule.domainIds.length + rule.capabilityIds.length + rule.journeyIds.length + rule.scenarioIds.length
  return [
    {
      label: 'Overture',
      scenes: [{ id: 'overture', title: 'Product overview', icon: 'i-lucide-panel-top', chip: `${workspace.counts.actors} actors` }]
    },
    {
      label: 'Surface',
      scenes: [{ id: 'surface', title: 'Screen map', icon: 'i-lucide-map', chip: `${workspace.counts.screens} screens` }]
    },
    {
      label: 'Journeys',
      scenes: workspace.journeys.map(journey => ({
        id: journey.id,
        kind: 'journey' as const,
        title: journey.title,
        chip: `${journey.scenarioIds.length} scenarios`
      }))
    },
    {
      label: 'Domains',
      scenes: workspace.domains.map(domain => ({
        id: domain.id,
        kind: 'domain' as const,
        title: domain.title,
        chip: `${domain.capabilityIds.length} capabilities`
      }))
    },
    {
      label: 'Rules',
      scenes: workspace.rules.map(rule => ({
        id: rule.id,
        kind: 'rule' as const,
        title: rule.title,
        chip: `${directCount(rule)} direct`
      }))
    }
  ]
})

const filteredGroups = computed(() => {
  const query = sceneQuery.value.trim().toLowerCase()
  if (!query) return sceneGroups.value.filter(group => group.scenes.length)
  return sceneGroups.value
    .map(group => ({ ...group, scenes: group.scenes.filter(scene => scene.title.toLowerCase().includes(query)) }))
    .filter(group => group.scenes.length)
})

interface ActiveScene {
  id: string
  title: string
  question: string
  kind?: ReportEntityKind
  icon?: string
  /** When set, the canvas renders BlrTopology focused on this entity. */
  topologyFocus?: string
}

const activeScene = computed<ActiveScene>(() => {
  const id = sceneId.value
  if (id === 'surface') {
    return { id, title: 'Screen map', icon: 'i-lucide-map', question: SCENE_QUESTIONS.surface! }
  }
  if (id.startsWith('focus:')) {
    const entity = props.workspace.byId.get(id.slice('focus:'.length))
    if (entity) {
      return {
        id,
        title: entity.title,
        kind: entity.kind,
        question: `What is directly connected to this ${ENTITY_KIND_META[entity.kind].label}?`,
        topologyFocus: entity.id
      }
    }
  }
  const entity = props.workspace.byId.get(id)
  if (entity && (entity.kind === 'journey' || entity.kind === 'domain' || entity.kind === 'rule')) {
    return { id, title: entity.title, kind: entity.kind, question: SCENE_QUESTIONS[entity.kind]!, topologyFocus: entity.id }
  }
  return { id: 'overture', title: 'Product overview', icon: 'i-lucide-panel-top', question: SCENE_QUESTIONS.overture! }
})

/* ------------------------------------------------------------------ */
/* Inspector: the shared slideover every selection lands in            */
/* ------------------------------------------------------------------ */

const inspected = ref<AnyEntityView | null>(null)
const inspectorTab = ref<'detail' | 'map'>('detail')

function inspect(entityId: string) {
  const entity = props.workspace.byId.get(entityId)
  if (!entity) return
  inspected.value = entity
  inspectorTab.value = 'detail'
}

function inspectEntity(entity: AnyEntityView) {
  inspect(entity.id)
}

function onTopologySelect(entity: AnyEntityView | null) {
  if (entity) inspect(entity.id)
}

/** Journeys, Domains and Rules own a scene; anything else becomes a topology focus. */
function openSceneFor(entityId: string) {
  const entity = props.workspace.byId.get(entityId)
  if (!entity) return
  sceneId.value = entity.kind === 'journey' || entity.kind === 'domain' || entity.kind === 'rule'
    ? entity.id
    : `focus:${entity.id}`
}

/* ------------------------------------------------------------------ */
/* Built graphs: Overture and Surface                                  */
/* ------------------------------------------------------------------ */

const OVERTURE_KINDS: ReadonlySet<ReportEntityKind> = new Set(['actor', 'interface', 'experience'])

const overtureGraph = computed(() => {
  const workspace = props.workspace
  const roots = (workspace.actors.length ? workspace.actors : workspace.interfaces).map(entity => entity.id)
  return layoutFlow(
    buildNeighbourhood(workspace, roots, { kinds: OVERTURE_KINDS, selectedId: inspected.value?.id ?? null }),
    { direction: 'LR' }
  )
})

const surfaceJourneyId = ref('')
const surfaceEmphasis = computed<ReadonlySet<string> | null>(() => {
  const journey = surfaceJourneyId.value ? props.workspace.byId.get(surfaceJourneyId.value) : null
  return journey?.kind === 'journey' ? new Set(journey.screenIds) : null
})
const surfaceGraph = computed(() => buildScreenMap(props.workspace, {
  emphasizeScreenIds: surfaceEmphasis.value,
  selectedId: inspected.value?.id ?? null
}))

const overlayItems = computed(() => [
  { label: 'Whole landscape', value: '' },
  ...props.workspace.journeys.map(journey => ({ label: journey.title, value: journey.id }))
])

/* ------------------------------------------------------------------ */
/* Rule impact: direct vs derived                                      */
/* ------------------------------------------------------------------ */

interface RuleReach {
  entity: AnyEntityView
  via: string
}

const ruleImpact = computed(() => {
  const focusId = activeScene.value.topologyFocus
  const entity = focusId ? props.workspace.byId.get(focusId) : null
  if (!entity || entity.kind !== 'rule') return null
  const rule: RuleView = entity
  const directIds = [...rule.domainIds, ...rule.capabilityIds, ...rule.journeyIds, ...rule.scenarioIds]
  const directSet = new Set(directIds)
  const derived = new Map<string, RuleReach>()
  const reach = (id: string, via: string) => {
    if (directSet.has(id) || derived.has(id)) return
    const target = props.workspace.byId.get(id)
    if (target) derived.set(id, { entity: target, via })
  }
  for (const capabilityId of rule.capabilityIds) {
    const capability = props.workspace.byId.get(capabilityId)
    if (capability?.kind !== 'capability') continue
    if (capability.domainId) reach(capability.domainId, `holds “${capability.title}”`)
    for (const journeyId of capability.journeyIds) reach(journeyId, `uses “${capability.title}”`)
    for (const screenId of capability.screenIds) reach(screenId, `exposes “${capability.title}”`)
  }
  for (const scenarioId of rule.scenarioIds) {
    const scenario = props.workspace.byId.get(scenarioId)
    if (scenario?.kind === 'scenario' && scenario.scenarioType === 'journey') {
      reach(scenario.journeyId, `contains “${scenario.title}”`)
    }
  }
  for (const domainId of rule.domainIds) {
    const domain = props.workspace.byId.get(domainId)
    if (domain?.kind !== 'domain') continue
    for (const capabilityId of domain.capabilityIds) reach(capabilityId, `in “${domain.title}”`)
  }
  return { rule, direct: resolveEntities(props.workspace, directIds), derived: [...derived.values()] }
})

/* ------------------------------------------------------------------ */
/* Bottom drawer                                                       */
/* ------------------------------------------------------------------ */

const DRAWER_TABS = [
  { id: 'journeys', label: 'Journeys', icon: 'i-lucide-route', question: 'What does the Product promise, end to end?' },
  { id: 'capabilities', label: 'Capabilities', icon: 'i-lucide-grid-3x3', question: 'What can the Product do, and where does it matter?' },
  { id: 'access', label: 'Access', icon: 'i-lucide-door-open', question: 'Who enters where, and what is available there?' }
] as const
type DrawerTabId = (typeof DRAWER_TABS)[number]['id']

const drawerTab = ref<DrawerTabId | null>(null)
const drawerMeta = computed(() => DRAWER_TABS.find(tab => tab.id === drawerTab.value) ?? null)

function toggleDrawer(id: DrawerTabId) {
  drawerTab.value = drawerTab.value === id ? null : id
}

/* Journey browser */

const journeyMode = ref<'cards' | 'table'>('cards')
const journeyDetailId = ref<string | null>(null)
const journeyDetail = computed(() => {
  const entity = journeyDetailId.value ? props.workspace.byId.get(journeyDetailId.value) : null
  return entity?.kind === 'journey' ? entity : null
})
const journeyDetailScenarios = computed<ScenarioView[]>(() =>
  journeyDetail.value ? props.workspace.scenariosByJourney.get(journeyDetail.value.id) ?? [] : []
)

function titlesOf(ids: string[]): string {
  return resolveEntities(props.workspace, ids).map(entity => entity.title).join(', ')
}

function availabilityText(pairs: Array<{ interfaceTitle: string, experienceTitle: string }>): string {
  return pairs
    .map(pair => pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : pair.interfaceTitle)
    .join(', ')
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
    cell: ({ row }) => h('span', { class: 'text-muted' }, titlesOf(row.original.actorIds) || '—')
  },
  {
    id: 'availability',
    accessorFn: journey => availabilityText(journey.availability),
    header: sortableHeader('Availability'),
    cell: ({ row }) => h('span', { class: 'text-muted' }, availabilityText(row.original.availability) || '—')
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

/* Capability map and matrices */

interface DomainGroup {
  id: string
  title: string
  lead: string
  capabilities: CapabilityView[]
}

const domainGroups = computed<DomainGroup[]>(() => {
  const groups: DomainGroup[] = props.workspace.domains.map(domain => ({
    id: domain.id,
    title: domain.title,
    lead: domain.lead,
    capabilities: props.workspace.capabilitiesByDomain.get(domain.id) ?? []
  }))
  const undomained = props.workspace.capabilitiesByDomain.get('') ?? []
  if (undomained.length) {
    groups.push({ id: '', title: 'No Domain', lead: 'Capabilities the model does not group under any Domain.', capabilities: undomained })
  }
  return groups
})

interface MatrixDef {
  id: 'journeys' | 'screens'
  title: string
  question: string
  columns: AnyEntityView[]
  emptyNote: string
}

const matrices = computed<MatrixDef[]>(() => [
  {
    id: 'journeys',
    title: 'Capabilities × Journeys',
    question: 'Which Product promises depend on each Capability?',
    columns: props.workspace.journeys,
    emptyNote: 'No Journeys authored yet — nothing depends on the Capabilities.'
  },
  {
    id: 'screens',
    title: 'Capabilities × Screens',
    question: 'Where is each Capability exposed on the visible surface?',
    columns: props.workspace.screens,
    emptyNote: 'No Screens in this model — the Capabilities are reached without a graphical surface.'
  }
])

function matrixRelated(matrixId: 'journeys' | 'screens', capability: CapabilityView, columnId: string): boolean {
  return (matrixId === 'journeys' ? capability.journeyIds : capability.screenIds).includes(columnId)
}

const matrixCell = ref<{ matrix: 'journeys' | 'screens', capabilityId: string, columnId: string } | null>(null)

function pickCell(matrixId: 'journeys' | 'screens', capabilityId: string, columnId: string) {
  const current = matrixCell.value
  matrixCell.value = current && current.matrix === matrixId && current.capabilityId === capabilityId && current.columnId === columnId
    ? null
    : { matrix: matrixId, capabilityId, columnId }
}

const matrixExplanation = computed(() => {
  const cell = matrixCell.value
  if (!cell) return null
  const capability = props.workspace.byId.get(cell.capabilityId)
  const column = props.workspace.byId.get(cell.columnId)
  if (capability?.kind !== 'capability' || !column) return null
  const related = matrixRelated(cell.matrix, capability, column.id)
  const text = cell.matrix === 'journeys'
    ? related
      ? `“${column.title}” lists “${capability.title}” among the Capabilities it uses — this promise depends on it.`
      : `“${column.title}” declares no use of “${capability.title}” — there is no authored dependency between them.`
    : related
      ? `“${column.title}” exposes “${capability.title}” — this Screen is a place the Capability is reachable.`
      : `“${column.title}” does not expose “${capability.title}”.`
  return { capability, column, related, text, matrix: cell.matrix }
})

/* ------------------------------------------------------------------ */
/* Overture facts                                                      */
/* ------------------------------------------------------------------ */

const COVERAGE_TONE = { complete: 'success', partial: 'warning', draft: 'neutral' } as const
const ACCESS_TONE = { public: 'success', authenticated: 'warning', restricted: 'error' } as const

const kindCounts = computed(() => {
  const counts = props.workspace.counts
  const values: Record<string, number> = {
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
  return REPORT_ENTITY_KINDS.map(meta => ({ kind: meta.kind, count: values[meta.kind] ?? 0 }))
})

const depthCounts = computed(() => {
  const counts = props.workspace.counts
  return [
    { label: 'steps', value: counts.steps },
    { label: 'decision points', value: counts.decisionPoints },
    { label: 'branches', value: counts.branches },
    { label: 'edge cases', value: counts.edgeCases },
    { label: 'screen states', value: counts.screenStates },
    { label: 'entry points', value: counts.entryPoints },
    { label: 'availability scopes', value: counts.availabilityPairs },
    { label: 'references', value: counts.references }
  ]
})

watch(() => props.workspace, () => {
  sceneId.value = 'overture'
  inspected.value = null
  journeyDetailId.value = null
  matrixCell.value = null
  surfaceJourneyId.value = ''
})
</script>

<template>
  <div class="blr-canvas flex h-full min-h-0 flex-col">
    <div class="flex min-h-0 flex-1">
      <!-- Scene rail -->
      <aside class="flex w-60 shrink-0 flex-col border-e border-default">
        <div class="shrink-0 border-b border-default p-2.5">
          <UInput
            v-model="sceneQuery"
            icon="i-lucide-search"
            size="sm"
            variant="outline"
            placeholder="Filter scenes"
            class="w-full"
          />
        </div>
        <nav class="blr-pane flex-1 space-y-4 p-2.5" aria-label="Scenes">
          <div v-for="group in filteredGroups" :key="group.label">
            <p class="blr-field px-2 pb-1">{{ group.label }}</p>
            <ul class="space-y-0.5">
              <li v-for="scene in group.scenes" :key="scene.id">
                <button
                  type="button"
                  class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start transition"
                  :class="scene.id === sceneId ? 'bg-elevated' : 'hover:bg-elevated/50'"
                  @click="sceneId = scene.id"
                >
                  <BlrKind v-if="scene.kind" :kind="scene.kind" :labelled="false" size="xs" />
                  <UIcon v-else :name="scene.icon!" class="size-4 shrink-0 text-dimmed" />
                  <span class="min-w-0 flex-1 truncate text-sm" :class="scene.id === sceneId ? 'font-medium text-highlighted' : 'text-default'">{{ scene.title }}</span>
                  <span class="blr-meta shrink-0">{{ scene.chip }}</span>
                </button>
              </li>
            </ul>
          </div>
          <p v-if="!filteredGroups.length" class="px-2 text-sm text-muted italic">No scene matches “{{ sceneQuery }}”.</p>
        </nav>
      </aside>

      <!-- Centre: toolbar, scene canvas, drawer -->
      <div class="relative flex min-w-0 flex-1 flex-col">
        <div class="flex min-h-11 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-default px-4 py-1.5">
          <BlrKind v-if="activeScene.kind" :kind="activeScene.kind" :labelled="false" />
          <UIcon v-else-if="activeScene.icon" :name="activeScene.icon" class="size-4 shrink-0 text-dimmed" />
          <span class="truncate text-sm font-semibold tracking-tight text-highlighted">{{ activeScene.title }}</span>
          <span class="hidden min-w-0 truncate text-sm text-muted md:inline">{{ activeScene.question }}</span>
          <label v-if="sceneId === 'surface' && workspace.journeys.length" class="ms-auto flex items-center gap-1.5">
            <span class="blr-field">Journey overlay</span>
            <USelect v-model="surfaceJourneyId" :items="overlayItems" size="xs" class="w-44" />
          </label>
        </div>

        <!-- Rule scenes: statement plus direct vs derived impact -->
        <div v-if="ruleImpact" class="max-h-52 shrink-0 space-y-2.5 overflow-y-auto border-b border-default px-4 py-3">
          <p class="text-sm leading-6 text-default">
            <span class="font-medium text-highlighted">Statement.</span>
            {{ firstSentence(ruleImpact.rule.statement, 240) }}
          </p>
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="blr-field me-1">Direct</span>
            <button
              v-for="entity in ruleImpact.direct"
              :key="entity.id"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border border-default bg-default px-2.5 py-1 text-xs text-default transition hover:border-accented"
              @click="inspect(entity.id)"
            >
              <BlrKind :kind="entity.kind" :labelled="false" size="xs" />{{ entity.title }}
            </button>
            <span v-if="!ruleImpact.direct.length" class="text-sm text-muted italic">Attached to nothing directly.</span>
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="blr-field me-1">Derived</span>
            <button
              v-for="item in ruleImpact.derived"
              :key="item.entity.id"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border border-dashed border-default px-2.5 py-1 text-xs text-muted transition hover:border-accented"
              :title="`Derived: ${item.via}`"
              @click="inspect(item.entity.id)"
            >
              <BlrKind :kind="item.entity.kind" :labelled="false" size="xs" />{{ item.entity.title }}
            </button>
            <span v-if="!ruleImpact.derived.length" class="text-sm text-muted italic">Reaches nothing beyond its direct attachments.</span>
            <span class="text-xs text-dimmed">— reached through authored relations, not authored on the Rule</span>
          </div>
        </div>

        <!-- Scene canvas -->
        <div class="min-h-0 flex-1">
          <BlrFlowCanvas v-if="activeScene.id === 'surface'" :nodes="surfaceGraph.nodes" :fit-padding="0.1" @select="inspect" @focus="openSceneFor" />
          <BlrTopology
            v-else-if="activeScene.topologyFocus"
            :key="activeScene.topologyFocus"
            :workspace="workspace"
            :focus-id="activeScene.topologyFocus"
            @select="onTopologySelect"
            @inspect="inspectEntity"
          />
          <div v-else class="blr-pane h-full">
            <div class="mx-auto max-w-4xl space-y-5 px-5 py-6">
              <header class="space-y-4 rounded-xl border border-default bg-default p-4 sm:p-5">
                <div class="flex flex-wrap items-center gap-3">
                  <img v-if="logoSrc" :src="logoSrc" alt="" class="size-9 rounded-lg border border-default bg-default object-contain p-1">
                  <div class="min-w-0 flex-1">
                    <p class="blr-eyebrow">
                      Product report<template v-if="workspace.identity.categoryLabel"> · {{ workspace.identity.categoryLabel }}</template>
                    </p>
                    <h2 class="truncate text-2xl font-semibold tracking-[-0.03em] text-highlighted">{{ workspace.identity.title }}</h2>
                  </div>
                  <UBadge :color="COVERAGE_TONE[workspace.coverage.status]" variant="subtle" size="sm">{{ workspace.coverage.status }}</UBadge>
                </div>
                <p class="text-base leading-7 text-default">{{ workspace.identity.summary }}</p>
                <BlrProse :text="workspace.identity.description" />
                <div v-if="workspace.identity.intent" class="space-y-1.5">
                  <h4 class="blr-field">Intent</h4>
                  <BlrProse :text="workspace.identity.intent" />
                </div>
                <div v-if="workspace.identity.tags.length || workspace.identity.authors.length || workspace.identity.license" class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <UBadge v-for="tag in workspace.identity.tags" :key="tag" color="neutral" variant="outline" size="sm">{{ tag }}</UBadge>
                  <span v-for="author in workspace.identity.authors" :key="author.name" class="inline-flex items-center gap-1 text-sm text-dimmed">
                    <UIcon name="i-lucide-pen-line" class="size-3" />
                    <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">{{ author.name }}</a>
                    <template v-else>{{ author.name }}</template>
                  </span>
                  <span v-if="workspace.identity.license" class="blr-meta">{{ workspace.identity.license }}</span>
                </div>
              </header>

              <section class="space-y-2">
                <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 class="text-base font-semibold tracking-tight text-highlighted">Who reaches the Product, through what</h3>
                  <span class="text-sm text-muted">Actors, Interfaces and Experiences only — open a scene for the rest.</span>
                </header>
                <div class="h-[24rem] overflow-hidden rounded-xl border border-default">
                  <BlrFlowCanvas :nodes="overtureGraph.nodes" :edges="overtureGraph.edges" @select="inspect" @focus="openSceneFor" />
                </div>
                <p class="text-sm text-dimmed">Click a box to inspect it; double-click to open it as a scene.</p>
                <p v-if="!workspace.experiences.length" class="text-sm text-muted">This model declares no Experiences — every entry is direct Interface access.</p>
              </section>

              <section class="space-y-3 rounded-xl border border-default bg-default p-4 sm:p-5">
                <header class="flex items-center gap-2">
                  <h3 class="text-base font-semibold tracking-tight text-highlighted">Coverage</h3>
                  <UBadge :color="COVERAGE_TONE[workspace.coverage.status]" variant="subtle" size="sm">{{ workspace.coverage.status }}</UBadge>
                </header>
                <BlrProse v-if="workspace.coverage.rationale" :text="workspace.coverage.rationale" />
                <div class="grid gap-4 sm:grid-cols-2">
                  <div v-if="workspace.coverage.method.length" class="space-y-1.5">
                    <h4 class="blr-field">Method</h4>
                    <div class="flex flex-wrap gap-1.5">
                      <UBadge v-for="item in workspace.coverage.method" :key="item" color="neutral" variant="soft" size="sm">{{ item }}</UBadge>
                    </div>
                  </div>
                  <div v-if="workspace.coverage.sourceAreas.length" class="space-y-1.5">
                    <h4 class="blr-field">Source areas</h4>
                    <div class="flex flex-wrap gap-1.5">
                      <UBadge v-for="area in workspace.coverage.sourceAreas" :key="area" color="neutral" variant="soft" size="sm" class="font-mono">{{ area }}</UBadge>
                    </div>
                  </div>
                  <div v-if="workspace.coverage.unmapped.length" class="space-y-1.5">
                    <h4 class="blr-field">Unmapped</h4>
                    <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                      <li v-for="(item, index) in workspace.coverage.unmapped" :key="index">{{ item }}</li>
                    </ul>
                  </div>
                  <div v-if="workspace.coverage.limitations.length || workspace.identity.limitations.length" class="space-y-1.5">
                    <h4 class="blr-field">Limitations</h4>
                    <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                      <li v-for="(item, index) in workspace.coverage.limitations" :key="`coverage-${index}`">{{ item }}</li>
                      <li v-for="(item, index) in workspace.identity.limitations" :key="`report-${index}`">{{ item }}</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section class="space-y-3 rounded-xl border border-default bg-default p-4 sm:p-5">
                <h3 class="text-base font-semibold tracking-tight text-highlighted">What the model contains</h3>
                <div class="flex flex-wrap gap-x-4 gap-y-2">
                  <BlrKind v-for="item in kindCounts" :key="item.kind" :kind="item.kind" :count="item.count" />
                </div>
                <div class="space-y-1.5 border-t border-default pt-3">
                  <h4 class="blr-field">Depth — derived from authored content</h4>
                  <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span v-for="item in depthCounts" :key="item.label" class="inline-flex items-baseline gap-1">
                      <span class="font-mono text-default tabular-nums">{{ item.value }}</span>
                      <span class="text-muted">{{ item.label }}</span>
                    </span>
                  </div>
                </div>
                <div v-if="workspace.scenarioKinds.length" class="space-y-1.5 border-t border-default pt-3">
                  <h4 class="blr-field">Scenario kinds</h4>
                  <div class="flex flex-wrap gap-1.5">
                    <UBadge v-for="kind in workspace.scenarioKinds" :key="kind.id" color="neutral" variant="outline" size="md" :title="kind.description">
                      {{ kind.name }}
                      <span class="blr-meta">{{ kind.count }}</span>
                    </UBadge>
                  </div>
                </div>
              </section>

              <section class="space-y-3 rounded-xl border border-default bg-default p-4 sm:p-5">
                <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />
                <p v-if="!workspace.identity.references.length" class="text-sm text-muted italic">No references attached at the Product level; entity references appear in the inspector.</p>
                <div v-if="workspace.identity.supportingContent" class="space-y-1.5 border-t border-default pt-3">
                  <h4 class="blr-field">Supporting context</h4>
                  <BlrProse :text="workspace.identity.supportingContent" />
                </div>
                <p class="blr-meta border-t border-default pt-3">
                  {{ workspace.identity.generator.name }} v{{ workspace.identity.generator.version }}
                  · schema {{ workspace.identity.schemaVersion }}
                  · generated {{ workspace.identity.generatedAt }}
                  · {{ workspace.identity.referenceProfile }} references
                </p>
              </section>
            </div>
          </div>
        </div>

        <!-- Drawer tab strip -->
        <div class="flex h-10 shrink-0 items-center gap-1 border-t border-default px-2">
          <UButton
            v-for="tab in DRAWER_TABS"
            :key="tab.id"
            :icon="tab.icon"
            :label="tab.label"
            size="xs"
            color="neutral"
            :variant="drawerTab === tab.id ? 'subtle' : 'ghost'"
            @click="toggleDrawer(tab.id)"
          />
          <span class="blr-meta ms-auto hidden truncate sm:inline">{{ workspace.identity.title }}</span>
        </div>

        <!-- Drawer -->
        <section v-if="drawerMeta" class="blr-drawer absolute inset-x-0 bottom-10 z-30 flex h-[min(34rem,80%)] min-h-0 flex-col border-t border-default bg-default">
          <header class="flex min-h-11 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-default px-4 py-1.5">
            <UIcon :name="drawerMeta.icon" class="size-4 shrink-0 text-dimmed" />
            <span class="text-sm font-semibold tracking-tight text-highlighted">{{ drawerMeta.label }}</span>
            <span class="hidden text-sm text-muted sm:inline">{{ drawerMeta.question }}</span>
            <span class="ms-auto flex items-center gap-2">
              <UTabs
                v-if="drawerTab === 'journeys' && !journeyDetail"
                v-model="journeyMode"
                :items="[
                  { value: 'cards', label: 'Cards', icon: 'i-lucide-layout-grid' },
                  { value: 'table', label: 'Table', icon: 'i-lucide-table' }
                ]"
                :content="false"
                color="neutral"
                size="xs"
              />
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" aria-label="Close drawer" @click="drawerTab = null" />
            </span>
          </header>
          <div class="blr-pane flex-1 px-4 py-4">
            <template v-if="drawerTab === 'journeys'">
              <!-- Full journey detail -->
              <div v-if="journeyDetail" class="space-y-5">
                <div class="flex flex-wrap items-center gap-2">
                  <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="xs" label="All journeys" @click="journeyDetailId = null" />
                  <span class="ms-auto flex items-center gap-1">
                    <UButton icon="i-lucide-waypoints" color="neutral" variant="outline" size="xs" label="Open as scene" @click="openSceneFor(journeyDetail.id); drawerTab = null" />
                    <UButton icon="i-lucide-book-open" color="neutral" variant="outline" size="xs" label="Inspect" @click="inspect(journeyDetail.id)" />
                  </span>
                </div>
                <header class="max-w-3xl space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <BlrKind kind="journey" :labelled="false" />
                    <h3 class="text-xl font-semibold tracking-tight text-highlighted">{{ journeyDetail.title }}</h3>
                    <UBadge color="neutral" variant="subtle" size="sm">{{ journeyDetail.scenarioIds.length }} scenarios</UBadge>
                  </div>
                  <BlrProse :text="journeyDetail.lead" />
                  <div v-if="journeyDetail.intent" class="space-y-1.5">
                    <h4 class="blr-field">Intent</h4>
                    <BlrProse :text="journeyDetail.intent" />
                  </div>
                </header>
                <BlrAvail :pairs="journeyDetail.availability" :entry-points="journeyDetail.entryPoints" />
                <div class="space-y-1.5">
                  <BlrLinks :workspace="workspace" :ids="journeyDetail.actorIds" kind="actor" interactive @select="inspectEntity" />
                  <BlrLinks :workspace="workspace" :ids="journeyDetail.capabilityIds" kind="capability" interactive @select="inspectEntity" />
                  <BlrLinks :workspace="workspace" :ids="journeyDetail.domainIds" kind="domain" label="Domains (derived)" interactive @select="inspectEntity" />
                  <BlrLinks :workspace="workspace" :ids="journeyDetail.screenIds" kind="screen" interactive @select="inspectEntity" />
                  <BlrLinks :workspace="workspace" :ids="journeyDetail.ruleIds" kind="rule" label="Constrained by" interactive @select="inspectEntity" />
                </div>
                <section class="space-y-3">
                  <h4 class="text-base font-semibold tracking-tight text-highlighted">Scenarios <span class="blr-meta ms-1">{{ journeyDetailScenarios.length }}</span></h4>
                  <div v-for="scenario in journeyDetailScenarios" :key="scenario.id" class="rounded-xl border border-default bg-default p-4">
                    <BlrEntityDetail :workspace="workspace" :entity="scenario" @select="inspectEntity" />
                  </div>
                  <p v-if="!journeyDetailScenarios.length" class="text-sm text-muted italic">No Scenarios authored for this Journey.</p>
                </section>
              </div>

              <!-- Card view -->
              <div v-else-if="journeyMode === 'cards'" class="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                <button
                  v-for="journey in workspace.journeys"
                  :key="journey.id"
                  type="button"
                  class="space-y-2.5 rounded-xl border border-default bg-default p-4 text-start transition hover:border-accented"
                  @click="journeyDetailId = journey.id"
                >
                  <div class="flex items-start gap-2">
                    <BlrKind kind="journey" :labelled="false" />
                    <span class="min-w-0 flex-1 text-base font-semibold tracking-tight text-highlighted">{{ journey.title }}</span>
                    <span class="blr-meta shrink-0">{{ journey.scenarioIds.length }} scenarios</span>
                  </div>
                  <p class="text-sm leading-6 text-muted">{{ firstSentence(journey.lead, 180) }}</p>
                  <BlrAvail :pairs="journey.availability" label="" />
                  <div class="space-y-1">
                    <BlrLinks :workspace="workspace" :ids="journey.actorIds" kind="actor" :max="3" />
                    <BlrLinks :workspace="workspace" :ids="journey.scenarioIds" kind="scenario" :max="4" />
                    <BlrLinks :workspace="workspace" :ids="journey.screenIds" kind="screen" :max="3" />
                    <BlrLinks :workspace="workspace" :ids="journey.capabilityIds" kind="capability" :max="3" />
                    <BlrLinks :workspace="workspace" :ids="journey.ruleIds" kind="rule" :max="3" />
                  </div>
                </button>
                <p v-if="!workspace.journeys.length" class="text-sm text-muted italic">No Journeys authored in this model.</p>
              </div>

              <!-- Table view -->
              <div v-else>
                <UTable
                  :data="workspace.journeys"
                  :columns="journeyColumns"
                  class="rounded-xl border border-default bg-default"
                  :ui="{ tr: 'cursor-pointer' }"
                  :on-select="(_event: Event, row: any) => { journeyDetailId = row.original.id }"
                />
                <p class="pt-2 text-sm text-muted">
                  Counts are derived from authored relations — hover one for the names behind it.
                  Steps total the authored steps across each Journey's Scenarios; click a row for the full Journey.
                </p>
              </div>
            </template>

            <template v-else-if="drawerTab === 'capabilities'">
              <div class="space-y-8">
                <!-- Capability map grouped by Domain -->
                <section class="space-y-4">
                  <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 class="text-base font-semibold tracking-tight text-highlighted">Capability map</h3>
                    <span class="text-sm text-muted">Grouped by Domain — counts derived from authored relations.</span>
                  </header>
                  <div v-for="group in domainGroups" :key="group.id || 'undomained'" class="space-y-2">
                    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <BlrKind kind="domain" :labelled="false" size="xs" />
                      <button v-if="group.id" type="button" class="text-base font-semibold tracking-tight text-highlighted hover:text-primary" @click="inspect(group.id)">{{ group.title }}</button>
                      <span v-else class="text-base font-semibold tracking-tight text-highlighted">{{ group.title }}</span>
                      <span class="min-w-0 flex-1 truncate text-sm text-muted">{{ firstSentence(group.lead) }}</span>
                    </div>
                    <div v-if="group.capabilities.length" class="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                      <button
                        v-for="capability in group.capabilities"
                        :key="capability.id"
                        type="button"
                        class="rounded-xl border border-default bg-default p-4 text-start transition hover:border-accented"
                        @click="inspect(capability.id)"
                      >
                        <div class="flex items-center gap-2">
                          <BlrKind kind="capability" :labelled="false" size="xs" />
                          <span class="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-highlighted">{{ capability.title }}</span>
                        </div>
                        <p class="mt-1.5 text-sm leading-6 text-muted">{{ firstSentence(capability.lead, 140) }}</p>
                        <p class="blr-meta mt-2.5">
                          {{ capability.journeyIds.length }} journeys · {{ capability.screenIds.length }} screens
                          · {{ capability.ruleIds.length }} rules · {{ capability.availability.length }} scopes
                        </p>
                      </button>
                    </div>
                    <p v-else class="text-sm text-muted italic">No Capabilities in this Domain yet.</p>
                  </div>
                  <p v-if="!workspace.capabilities.length" class="text-sm text-muted italic">No Capabilities authored in this model.</p>
                </section>

                <!-- Named matrices -->
                <section v-for="matrix in matrices" :key="matrix.id" class="space-y-2.5">
                  <header>
                    <p class="blr-field">{{ matrix.title }} — authored relations</p>
                    <h3 class="mt-0.5 text-base font-semibold tracking-tight text-highlighted">{{ matrix.question }}</h3>
                  </header>
                  <div v-if="matrix.columns.length && workspace.capabilities.length" class="max-h-96 overflow-auto rounded-xl border border-default">
                    <table class="blr-matrix text-xs">
                      <thead>
                        <tr>
                          <th class="blr-matrix__origin blr-field px-3 py-2 text-start">Capability</th>
                          <th v-for="column in matrix.columns" :key="column.id" class="blr-matrix__col px-1 pt-3 pb-2 align-bottom">
                            <span class="text-xs font-medium text-muted" :title="column.title">{{ column.title }}</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-for="group in domainGroups" :key="group.id || 'undomained'">
                          <template v-if="group.capabilities.length">
                            <tr>
                              <td class="blr-matrix__group blr-field px-3 py-1" :colspan="matrix.columns.length + 1">{{ group.title }}</td>
                            </tr>
                            <tr v-for="capability in group.capabilities" :key="capability.id">
                              <th scope="row" class="blr-matrix__row px-3 py-1.5 text-start text-xs font-medium text-default">{{ capability.title }}</th>
                              <td v-for="column in matrix.columns" :key="column.id" class="p-0 text-center">
                                <button
                                  type="button"
                                  class="blr-matrix__cell"
                                  :class="{
                                    'blr-matrix__cell--picked': matrixCell?.matrix === matrix.id
                                      && matrixCell?.capabilityId === capability.id
                                      && matrixCell?.columnId === column.id
                                  }"
                                  :title="`${capability.title} × ${column.title}`"
                                  @click="pickCell(matrix.id, capability.id, column.id)"
                                >
                                  <span v-if="matrixRelated(matrix.id, capability, column.id)" class="blr-matrix__dot" />
                                </button>
                              </td>
                            </tr>
                          </template>
                        </template>
                      </tbody>
                    </table>
                  </div>
                  <p v-else class="text-sm text-muted italic">{{ matrix.emptyNote }}</p>
                  <div v-if="matrixExplanation && matrixExplanation.matrix === matrix.id" class="flex flex-wrap items-center gap-2 rounded-xl border border-default bg-default px-4 py-3">
                    <UIcon :name="matrixExplanation.related ? 'i-lucide-link-2' : 'i-lucide-unlink-2'" class="size-3.5 shrink-0 text-dimmed" />
                    <span class="min-w-0 flex-1 text-sm text-default">{{ matrixExplanation.text }}</span>
                    <span class="flex shrink-0 gap-1">
                      <UButton size="xs" color="neutral" variant="outline" :label="matrixExplanation.capability.title" @click="inspect(matrixExplanation.capability.id)" />
                      <UButton size="xs" color="neutral" variant="outline" :label="matrixExplanation.column.title" @click="inspect(matrixExplanation.column.id)" />
                    </span>
                  </div>
                  <p v-else-if="matrix.columns.length && workspace.capabilities.length" class="text-sm text-muted italic">Select a cell to read what the relationship means.</p>
                </section>
              </div>
            </template>

            <template v-else>
              <div class="space-y-6">
                <section class="space-y-3">
                  <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 class="text-base font-semibold tracking-tight text-highlighted">Interfaces</h3>
                    <span class="text-sm text-muted">The delivery surfaces the Product is entered through.</span>
                  </header>
                  <div class="grid gap-3 lg:grid-cols-2">
                    <article v-for="item in workspace.interfaces" :key="item.id" class="space-y-2.5 rounded-xl border border-default bg-default p-4">
                      <div class="flex items-start gap-2">
                        <BlrKind kind="interface" :labelled="false" />
                        <span class="min-w-0 flex-1 text-base font-semibold tracking-tight text-highlighted">{{ item.title }}</span>
                        <UButton icon="i-lucide-book-open" color="neutral" variant="ghost" size="xs" title="Open in the inspector" @click="inspect(item.id)" />
                      </div>
                      <p class="text-sm leading-6 text-muted">{{ firstSentence(item.lead, 200) }}</p>
                      <ul v-if="item.entryPoints.length" class="space-y-0.5">
                        <li v-for="point in item.entryPoints" :key="`${point.interfaceId}-${point.path}`" class="blr-meta flex items-center gap-1.5">
                          <UIcon name="i-lucide-corner-down-right" class="size-3 shrink-0" />{{ point.path }}
                        </li>
                      </ul>
                      <div v-if="item.capabilityBoundary">
                        <p class="blr-field">Capability boundary</p>
                        <p class="mt-1 text-sm leading-6 text-default">{{ firstSentence(item.capabilityBoundary, 160) }}</p>
                      </div>
                      <div class="space-y-1.5 border-t border-default pt-2.5">
                        <BlrLinks :workspace="workspace" :ids="item.actorIds" kind="actor" label="Who enters" interactive @select="inspectEntity" />
                        <BlrLinks :workspace="workspace" :ids="item.experienceIds" kind="experience" interactive @select="inspectEntity" />
                        <BlrLinks :workspace="workspace" :ids="item.screenIds" kind="screen" :max="5" interactive @select="inspectEntity" />
                        <p v-if="!item.screenIds.length" class="text-sm text-muted italic">No Screens — not a graphical surface.</p>
                        <BlrLinks :workspace="workspace" :ids="item.capabilityIds" kind="capability" label="Capabilities available" :max="5" interactive @select="inspectEntity" />
                        <BlrLinks :workspace="workspace" :ids="item.journeyIds" kind="journey" label="Journeys completable" :max="5" interactive @select="inspectEntity" />
                      </div>
                    </article>
                  </div>
                </section>

                <section v-if="workspace.experiences.length" class="space-y-3">
                  <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 class="text-base font-semibold tracking-tight text-highlighted">Experiences</h3>
                    <span class="text-sm text-muted">Access boundaries inside an Interface.</span>
                  </header>
                  <div class="grid gap-3 lg:grid-cols-2">
                    <article v-for="item in workspace.experiences" :key="item.id" class="space-y-2.5 rounded-xl border border-default bg-default p-4">
                      <div class="flex items-start gap-2">
                        <BlrKind kind="experience" :labelled="false" />
                        <span class="min-w-0 flex-1 text-base font-semibold tracking-tight text-highlighted">{{ item.title }}</span>
                        <UBadge :color="ACCESS_TONE[item.accessMode]" variant="subtle" size="sm">{{ item.accessMode }}</UBadge>
                        <UButton icon="i-lucide-book-open" color="neutral" variant="ghost" size="xs" title="Open in the inspector" @click="inspect(item.id)" />
                      </div>
                      <p class="text-sm leading-6 text-muted">{{ firstSentence(item.lead, 200) }}</p>
                      <ul v-if="item.entryPoints.length" class="space-y-0.5">
                        <li v-for="point in item.entryPoints" :key="`${point.interfaceId}-${point.path}`" class="blr-meta flex items-center gap-1.5">
                          <UIcon name="i-lucide-corner-down-right" class="size-3 shrink-0" />{{ point.path }}
                        </li>
                      </ul>
                      <div v-if="item.capabilityBoundary">
                        <p class="blr-field">Capability boundary</p>
                        <p class="mt-1 text-sm leading-6 text-default">{{ firstSentence(item.capabilityBoundary, 160) }}</p>
                      </div>
                      <div class="space-y-1.5 border-t border-default pt-2.5">
                        <BlrLinks :workspace="workspace" :ids="item.actorIds" kind="actor" label="Who enters" interactive @select="inspectEntity" />
                        <BlrLinks :workspace="workspace" :ids="item.interfaceIds" kind="interface" label="Within" interactive @select="inspectEntity" />
                        <BlrLinks :workspace="workspace" :ids="item.screenIds" kind="screen" :max="5" interactive @select="inspectEntity" />
                        <BlrLinks :workspace="workspace" :ids="item.capabilityIds" kind="capability" label="Capabilities available" :max="5" interactive @select="inspectEntity" />
                        <BlrLinks :workspace="workspace" :ids="item.journeyIds" kind="journey" label="Journeys completable" :max="5" interactive @select="inspectEntity" />
                      </div>
                    </article>
                  </div>
                </section>
                <p v-else class="text-sm text-muted italic">This model declares no Experiences — availability is always direct Interface availability, and that is a valid shape.</p>
              </div>
            </template>
          </div>
        </section>
      </div>

      <!-- Inspector: the shared slideover every selection lands in -->
      <BlrInspector
        v-model:tab="inspectorTab"
        :workspace="workspace"
        :entity="inspected"
        @select="inspectEntity"
        @close="inspected = null"
      />
    </div>
  </div>
</template>

<style scoped>
.blr-canvas {
  background: var(--ui-bg);
}

/* Matrix: one scrollable frame, sticky header row and sticky row heads. */
.blr-matrix {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
}

.blr-matrix th,
.blr-matrix td {
  border: 1px solid var(--ui-border-muted);
}

.blr-matrix thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--ui-bg-elevated);
}

.blr-matrix__origin,
.blr-matrix__row {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--ui-bg);
}

.blr-matrix thead .blr-matrix__origin {
  z-index: 3;
  background: var(--ui-bg-elevated);
}

.blr-matrix__col span {
  display: inline-block;
  max-height: 8.5rem;
  overflow: hidden;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.blr-matrix__group {
  background: color-mix(in srgb, var(--ui-bg-elevated) 60%, var(--ui-bg));
}

.blr-matrix__row {
  max-width: 16rem;
}

.blr-matrix__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 2.1rem;
  height: 2rem;
  cursor: pointer;
}

.blr-matrix__cell:hover {
  background: color-mix(in srgb, var(--ui-primary) 10%, transparent);
}

.blr-matrix__cell--picked {
  outline: 2px solid var(--ui-primary);
  outline-offset: -2px;
}

.blr-matrix__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 9999px;
  background: var(--ui-primary);
}

/* The drawer floats over the lower canvas like a tool panel. */
.blr-drawer {
  box-shadow: 0 -18px 44px -20px color-mix(in srgb, var(--ui-text) 35%, transparent);
}
</style>
