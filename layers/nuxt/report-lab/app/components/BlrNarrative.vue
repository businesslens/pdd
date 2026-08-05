<script setup lang="ts">
/**
 * Narrative — one scrolling story from access to constraints.
 *
 * IA: a numbered, chapter-based briefing that reads front to back and prints
 * as a document. 1 The Product (identity, quiet figures, coverage) · 2 Who and
 * where (Actors and access contexts, compared) · 3 The visible surface (the
 * shared Screen map, then each Interface's Screens) · 4 The promises (every
 * Journey with every Scenario told in full, closed by the comparison table) ·
 * 5 Durable abilities (Capabilities by Domain plus two named matrices) · 6 The
 * constraints (each Business Rule's statement, direct attachments vs derived
 * reach, with an on-demand impact map) · 7 Colophon (references, access
 * scopes, generator). A slim scrollspy rail navigates; entity mentions are
 * chips that either disclose a preview inline or jump to the entity's home
 * section — the page itself is the only scroll surface.
 */
import type {
  AnyEntityView, AvailabilityPair, CapabilityView, DomainView, JourneyView,
  ReferenceGroup, ReportWorkspace, ScenarioView, ScreenView
} from '../utils/reportWorkspace'
import { REPORT_ENTITY_KINDS, resolveEntities } from '../utils/reportWorkspace'
import { buildScreenMap } from '../utils/flowGraph'

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

const CHAPTERS = [
  { id: 'product', title: 'The Product', question: 'What is this Product, and how complete is this account of it?' },
  { id: 'access', title: 'Who and where', question: 'Who uses the Product, and through which doors do they enter?' },
  { id: 'surface', title: 'The visible surface', question: 'What does the Product show, and where does each Screen live?' },
  { id: 'promises', title: 'The promises', question: 'What does the Product promise, and how does each promise play out?' },
  { id: 'abilities', title: 'Durable abilities', question: 'What can the Product durably do, and where is each ability reachable?' },
  { id: 'constraints', title: 'The constraints', question: 'What must always hold, and how far does each rule reach?' },
  { id: 'colophon', title: 'Colophon', question: 'Where did this report come from, and what does it cite?' }
] as const

/* ---------------------------------------------------------------- rail --- */

const activeChapter = ref<string>('product')
let observer: IntersectionObserver | null = null
const intersecting = new Set<string>()

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const id = (entry.target as HTMLElement).dataset.chapter
      if (!id) continue
      if (entry.isIntersecting) intersecting.add(id)
      else intersecting.delete(id)
    }
    const first = CHAPTERS.find(chapter => intersecting.has(chapter.id))
    if (first) activeChapter.value = first.id
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 })
  for (const chapter of CHAPTERS) {
    const element = document.getElementById(`nar-chapter-${chapter.id}`)
    if (element) observer.observe(element)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (flashTimer) clearTimeout(flashTimer)
})

function scrollToChapter(id: string) {
  document.getElementById(`nar-chapter-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/* ---------------------------------------------- jump-to-entity anchors --- */

const flashId = ref<string | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | null = null

/** Every entity has one home section in the story; mentions jump to it. */
function jumpToEntity(entity: AnyEntityView) {
  const element = document.getElementById(`nar-${entity.id}`)
  if (!element) return
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  flashId.value = entity.id
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flashId.value = null }, 1800)
}

function jumpToOwner(group: ReferenceGroup) {
  if (group.ownerKind === 'product') return scrollToChapter('product')
  const entity = props.workspace.byId.get(group.ownerId)
  if (entity) jumpToEntity(entity)
}

/* --------------------------------------------------- inline disclosure --- */

const openKeys = ref<Set<string>>(new Set())
const isOpen = (key: string) => openKeys.value.has(key)
function toggle(key: string) {
  const next = new Set(openKeys.value)
  if (!next.delete(key)) next.add(key)
  openKeys.value = next
}
const chipKey = (scope: string, ownerId: string, id: string) => `${scope}:${ownerId}:${id}`

const resolveIds = (ids: string[]) => resolveEntities(props.workspace, ids)
const titlesOf = (ids: string[]) => resolveIds(ids).map(entity => entity.title).join(', ')
const pairLabel = (pair: AvailabilityPair) =>
  pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : `${pair.interfaceTitle} (direct)`
const isExternal = (target: string) => /^https?:\/\//i.test(target)

/* ------------------------------------------------------ chapter 1 data --- */

const COVERAGE_TONE = { complete: 'success', partial: 'warning', draft: 'neutral' } as const

const figures = computed(() => {
  const counts = props.workspace.counts
  const byKind: Record<string, number> = {
    actor: counts.actors, interface: counts.interfaces, experience: counts.experiences,
    screen: counts.screens, domain: counts.domains, capability: counts.capabilities,
    journey: counts.journeys, scenario: counts.scenarios, rule: counts.rules
  }
  return REPORT_ENTITY_KINDS.map(meta => ({ meta, value: byKind[meta.kind] ?? 0 }))
})

const depthSentence = computed(() => {
  const c = props.workspace.counts
  return `${c.steps} authored steps, ${c.decisionPoints} decision points branching ${c.branches} ways, `
    + `${c.edgeCases} edge cases, ${c.screenStates} screen states, ${c.entryPoints} entry points, `
    + `${c.availabilityPairs} access scopes and ${c.references} references.`
})

/* ------------------------------------------------------ chapter 2 data --- */

interface AccessRow {
  key: string, entity: AnyEntityView, context: string, type: 'Interface' | 'Experience', access: string,
  actors: string, screens: number, capabilities: number, journeys: number, entryPoints: number
}

const accessRows = computed<AccessRow[]>(() => {
  const rows: AccessRow[] = []
  for (const item of props.workspace.interfaces) {
    rows.push({
      key: item.id, entity: item, context: item.title, type: 'Interface', access: '—',
      actors: titlesOf(item.actorIds), screens: item.screenIds.length,
      capabilities: item.capabilityIds.length, journeys: item.journeyIds.length, entryPoints: item.entryPoints.length
    })
    for (const experience of props.workspace.experiences.filter(entry => entry.interfaceIds.includes(item.id))) {
      rows.push({
        key: `${item.id}:${experience.id}`, entity: experience,
        context: `${item.title} › ${experience.title}`, type: 'Experience', access: experience.accessMode,
        actors: titlesOf(experience.actorIds), screens: experience.screenIds.length,
        capabilities: experience.capabilityIds.length, journeys: experience.journeyIds.length,
        entryPoints: experience.entryPoints.length
      })
    }
  }
  return rows
})

/* ------------------------------------------------------ chapter 3 data --- */

const surfaceSelectedId = ref<string | null>(null)
const screenMap = computed(() => buildScreenMap(props.workspace, { selectedId: surfaceSelectedId.value }))
const surfaceSelected = computed(() =>
  (surfaceSelectedId.value && props.workspace.byId.get(surfaceSelectedId.value)) || null)

function onMapSelect(entityId: string) {
  surfaceSelectedId.value = entityId === surfaceSelectedId.value ? null : entityId
}
function onMapFocus(entityId: string) {
  const entity = props.workspace.byId.get(entityId)
  if (entity) jumpToEntity(entity)
}

/** Screens listed under each Interface; the anchor lives on first mention. */
const surfaceSections = computed(() => {
  const seen = new Set<string>()
  return props.workspace.interfaces.map(productInterface => ({
    productInterface,
    screens: productInterface.screenIds
      .map(id => props.workspace.byId.get(id))
      .filter((entity): entity is ScreenView => entity?.kind === 'screen')
      .map((screen) => {
        const anchor = !seen.has(screen.id)
        seen.add(screen.id)
        return { screen, anchor }
      })
  }))
})

/* ------------------------------------------------------ chapter 4 data --- */

const journeyChapters = computed(() => props.workspace.journeys.map(journey => ({
  journey,
  scenarios: props.workspace.scenariosByJourney.get(journey.id) ?? []
})))

const journeyChipIds = (journey: JourneyView) => [...journey.capabilityIds, ...journey.screenIds, ...journey.ruleIds]
const scenarioChipIds = (scenario: ScenarioView) => [...scenario.screenIds, ...scenario.ruleIds]

const journeyRows = computed(() => props.workspace.journeys.map(journey => ({
  journey,
  actors: titlesOf(journey.actorIds),
  access: journey.availability.map(pairLabel).join('; '),
  capabilities: journey.capabilityIds.length,
  screens: journey.screenIds.length,
  scenarios: journey.scenarioIds.length,
  rules: journey.ruleIds.length,
  steps: journey.stepCount
})))

/* ------------------------------------------------------ chapter 5 data --- */

const domainSections = computed(() => {
  const sections: Array<{ key: string, title: string, domain: DomainView | null, capabilities: CapabilityView[] }>
    = props.workspace.domains.map(domain => ({
      key: domain.id, title: domain.title, domain,
      capabilities: props.workspace.capabilitiesByDomain.get(domain.id) ?? []
    }))
  const undomained = props.workspace.capabilitiesByDomain.get('') ?? []
  if (undomained.length) sections.push({ key: '__none', title: 'Outside any Domain', domain: null, capabilities: undomained })
  return sections
})

const promiseMatrix = computed(() => props.workspace.capabilities.map(capability => ({
  capability,
  cells: props.workspace.journeys.map(journey => ({ journey, hit: capability.journeyIds.includes(journey.id) }))
})))

const reachMatrix = computed(() => props.workspace.capabilities.map(capability => ({
  capability,
  cells: props.workspace.pairs.map(pair => ({ pair, hit: capability.availability.some(item => item.key === pair.key) }))
})))

const matrixNote = ref<{ id: string, text: string } | null>(null)

function explainPromiseCell(capability: CapabilityView, journey: JourneyView, hit: boolean) {
  const id = `promises:${capability.id}:${journey.id}`
  const text = hit
    ? `“${journey.title}” lists “${capability.title}” among its supporting Capabilities, so that promise depends on this ability.`
    : `“${journey.title}” does not declare “${capability.title}” as a supporting Capability.`
  matrixNote.value = matrixNote.value?.id === id ? null : { id, text }
}

function explainReachCell(capability: CapabilityView, pair: AvailabilityPair, hit: boolean) {
  const id = `reach:${capability.id}:${pair.key}`
  const text = hit
    ? `“${capability.title}” is declared available in ${pairLabel(pair)}.`
    : `“${capability.title}” declares no availability in ${pairLabel(pair)}.`
  matrixNote.value = matrixNote.value?.id === id ? null : { id, text }
}

/* ------------------------------------------------------ chapter 6 data --- */

const ruleReach = computed(() => props.workspace.rules.map((rule) => {
  const directCapabilities = new Set(rule.capabilityIds)
  const directJourneys = new Set(rule.journeyIds)
  const directScenarios = new Set(rule.scenarioIds)
  const directDomains = new Set(rule.domainIds)

  const derivedCapabilities = new Set<string>()
  for (const domainId of rule.domainIds) {
    const domain = props.workspace.byId.get(domainId)
    if (domain?.kind === 'domain') {
      for (const id of domain.capabilityIds) if (!directCapabilities.has(id)) derivedCapabilities.add(id)
    }
  }
  const derivedDomains = new Set<string>()
  const derivedJourneys = new Set<string>()
  for (const capabilityId of [...directCapabilities, ...derivedCapabilities]) {
    const capability = props.workspace.byId.get(capabilityId)
    if (capability?.kind !== 'capability') continue
    if (capability.domainId && !directDomains.has(capability.domainId)) derivedDomains.add(capability.domainId)
    for (const id of capability.journeyIds) if (!directJourneys.has(id)) derivedJourneys.add(id)
  }
  for (const scenarioId of directScenarios) {
    const scenario = props.workspace.byId.get(scenarioId)
    if (scenario?.kind === 'scenario' && !directJourneys.has(scenario.journeyId)) derivedJourneys.add(scenario.journeyId)
  }
  const derivedScenarios = new Set<string>()
  for (const journeyId of directJourneys) {
    const journey = props.workspace.byId.get(journeyId)
    if (journey?.kind === 'journey') {
      for (const id of journey.scenarioIds) if (!directScenarios.has(id)) derivedScenarios.add(id)
    }
  }
  return {
    rule,
    direct: resolveIds([...rule.domainIds, ...rule.capabilityIds, ...rule.journeyIds, ...rule.scenarioIds]),
    derived: resolveIds([...derivedDomains, ...derivedCapabilities, ...derivedJourneys, ...derivedScenarios])
  }
}))

/* ------------------------------------------------------ chapter 7 data --- */

const pairUsage = computed(() => props.workspace.pairs.map(pair => ({
  pair,
  screens: props.workspace.screens.filter(item => item.availability.some(entry => entry.key === pair.key)).length,
  capabilities: props.workspace.capabilities.filter(item => item.availability.some(entry => entry.key === pair.key)).length,
  journeys: props.workspace.journeys.filter(item => item.availability.some(entry => entry.key === pair.key)).length,
  scenarios: props.workspace.scenarios.filter(item => item.availability.some(entry => entry.key === pair.key)).length,
  rules: props.workspace.rules.filter(item => item.availability.some(entry => entry.key === pair.key)).length
})))
</script>

<template>
  <div class="pb-24">
    <!-- Chapter rail: horizontal and sticky-top below xl. -->
    <nav class="blr-no-print sticky top-[var(--blr-chrome)] z-30 -mb-px border-b border-default bg-default/90 backdrop-blur xl:hidden" aria-label="Chapters">
      <div class="flex gap-1 overflow-x-auto py-2">
        <button v-for="(chapter, index) in CHAPTERS" :key="chapter.id" type="button" class="flex shrink-0 items-baseline gap-1.5 px-2.5 py-1 text-sm transition" :class="activeChapter === chapter.id ? 'font-medium text-highlighted' : 'text-muted hover:text-highlighted'" :aria-current="activeChapter === chapter.id ? 'true' : undefined" @click="scrollToChapter(chapter.id)">
          <span class="blr-meta">{{ index + 1 }}</span>{{ chapter.title }}
        </button>
      </div>
    </nav>

    <div class="xl:grid xl:grid-cols-[minmax(0,1fr)_11rem] xl:gap-12">
      <article class="mx-auto w-full min-w-0 max-w-4xl space-y-20 pt-8">
        <!-- ============================================= 1 · The Product -->
        <section id="nar-chapter-product" data-chapter="product" class="nar-chapter space-y-8">
          <header class="space-y-2 border-t-2 border-accented pt-6">
            <p class="blr-eyebrow">Chapter 1 · {{ CHAPTERS[0].title }}</p>
            <h2 class="text-3xl font-semibold tracking-[-0.035em] text-highlighted">{{ CHAPTERS[0].question }}</h2>
          </header>

          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <img v-if="logoSrc" :src="logoSrc" alt="" class="mt-1 size-12 shrink-0 rounded-lg object-contain">
              <div class="min-w-0 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge color="neutral" variant="soft" size="sm"><span class="blr-meta">{{ workspace.identity.id }}</span></UBadge>
                  <UBadge v-if="workspace.identity.categoryLabel" color="primary" variant="subtle" size="sm">{{ workspace.identity.categoryLabel }}</UBadge>
                </div>
                <h1 class="text-4xl font-semibold tracking-[-0.035em] text-highlighted">{{ workspace.identity.title }}</h1>
                <p class="text-lg leading-8 text-default">{{ workspace.identity.summary }}</p>
              </div>
            </div>
            <BlrProse :text="workspace.identity.description" size="base" />
            <div v-if="workspace.identity.intent" class="space-y-1.5">
              <p class="blr-field">Intent</p>
              <BlrProse :text="workspace.identity.intent" />
            </div>
          </div>

          <!-- A quiet row of figures, not dashboard tiles. -->
          <div class="space-y-2">
            <div class="flex flex-wrap items-baseline gap-x-7 gap-y-3 border-y py-4 blr-hairline">
              <div v-for="figure in figures" :key="figure.meta.kind" class="flex items-baseline gap-2">
                <span class="font-mono text-lg text-highlighted tabular-nums">{{ figure.value }}</span>
                <span class="blr-field inline-flex items-center gap-1"><BlrKind :kind="figure.meta.kind" :labelled="false" size="xs" />{{ figure.meta.plural }}</span>
              </div>
            </div>
            <p class="text-sm text-dimmed">Depth, derived from the authored model: {{ depthSentence }}</p>
          </div>

          <div class="space-y-3 rounded-xl border border-default bg-default p-4 sm:p-5">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base font-semibold tracking-tight text-highlighted">Coverage</h3>
              <UBadge :color="COVERAGE_TONE[workspace.coverage.status]" variant="subtle" size="sm">{{ workspace.coverage.status }}</UBadge>
            </div>
            <BlrProse :text="workspace.coverage.rationale" />
            <div v-if="workspace.coverage.method.length" class="space-y-1.5">
              <p class="blr-field">Method</p>
              <div class="flex flex-wrap gap-1.5">
                <UBadge v-for="item in workspace.coverage.method" :key="item" color="neutral" variant="soft" size="sm">{{ item }}</UBadge>
              </div>
            </div>
            <div v-if="workspace.coverage.sourceAreas.length" class="space-y-1.5">
              <p class="blr-field">Source areas</p>
              <div class="flex flex-wrap gap-1.5">
                <UBadge v-for="item in workspace.coverage.sourceAreas" :key="item" color="neutral" variant="soft" size="sm" class="font-mono">{{ item }}</UBadge>
              </div>
            </div>
            <div v-if="workspace.coverage.unmapped.length" class="space-y-1.5">
              <p class="blr-field">Not yet mapped</p>
              <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed"><li v-for="(item, index) in workspace.coverage.unmapped" :key="index">{{ item }}</li></ul>
            </div>
            <div v-if="workspace.coverage.limitations.length || workspace.identity.limitations.length" class="space-y-1.5">
              <p class="blr-field">Known limitations</p>
              <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                <li v-for="(item, index) in workspace.coverage.limitations" :key="`c-${index}`">{{ item }}</li>
                <li v-for="(item, index) in workspace.identity.limitations" :key="`i-${index}`">{{ item }}</li>
              </ul>
            </div>
          </div>

          <div class="space-y-3">
            <div v-if="workspace.identity.tags.length" class="flex flex-wrap items-baseline gap-1.5">
              <span class="blr-field">Tags</span>
              <UBadge v-for="tag in workspace.identity.tags" :key="tag" color="neutral" variant="outline" size="sm">{{ tag }}</UBadge>
            </div>
            <p v-if="workspace.identity.authors.length" class="text-sm text-muted">
              <span class="blr-field me-2">Authors</span>
              <template v-for="(author, index) in workspace.identity.authors" :key="author.name">
                <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">{{ author.name }}</a>
                <span v-else>{{ author.name }}</span><span v-if="index < workspace.identity.authors.length - 1">, </span>
              </template>
              <span v-if="workspace.identity.license" class="text-dimmed"> · {{ workspace.identity.license }}</span>
            </p>
            <div v-if="workspace.identity.supportingContent" class="space-y-1.5">
              <p class="blr-field">Supporting context</p>
              <BlrProse :text="workspace.identity.supportingContent" />
            </div>
            <BlrRefs :references="workspace.identity.references" label="Product references" />
          </div>
        </section>

        <!-- ============================================ 2 · Who and where -->
        <section id="nar-chapter-access" data-chapter="access" class="nar-chapter space-y-8">
          <header class="space-y-2 border-t-2 border-accented pt-6">
            <p class="blr-eyebrow">Chapter 2 · {{ CHAPTERS[1].title }}</p>
            <h2 class="text-3xl font-semibold tracking-[-0.035em] text-highlighted">{{ CHAPTERS[1].question }}</h2>
          </header>

          <div class="space-y-5">
            <h3 class="text-lg font-semibold tracking-tight text-highlighted"><span class="blr-meta me-2">2.1</span>The people and systems involved</h3>
            <div v-for="actor in workspace.actors" :id="`nar-${actor.id}`" :key="actor.id" class="nar-anchor nar-block space-y-2.5" :class="flashId === actor.id && 'nar-flash'">
              <div class="flex flex-wrap items-center gap-2">
                <BlrKind kind="actor" :labelled="false" />
                <h4 class="text-base font-semibold tracking-tight text-highlighted">{{ actor.title }}</h4>
                <UBadge color="neutral" variant="subtle" size="sm">{{ actor.actorKind }} · {{ actor.relationship }}</UBadge>
              </div>
              <BlrProse :text="actor.lead" />
              <div v-if="actor.intent" class="space-y-1"><p class="blr-field">Intent</p><BlrProse :text="actor.intent" /></div>
              <div class="space-y-1">
                <BlrLinks :workspace="workspace" :ids="actor.interfaceIds" kind="interface" label="Enters through" interactive @select="jumpToEntity" />
                <BlrLinks :workspace="workspace" :ids="actor.experienceIds" kind="experience" label="Within" interactive @select="jumpToEntity" />
                <BlrLinks :workspace="workspace" :ids="actor.journeyIds" kind="journey" label="Performs" interactive @select="jumpToEntity" />
              </div>
              <BlrProse v-if="actor.supportingContent" :text="actor.supportingContent" class="text-muted" />
              <BlrRefs :references="actor.references" />
            </div>
            <p v-if="!workspace.actors.length" class="text-sm text-muted italic">The model names no Actors.</p>
          </div>

          <div class="space-y-5">
            <h3 class="text-lg font-semibold tracking-tight text-highlighted"><span class="blr-meta me-2">2.2</span>The doors: Interfaces<template v-if="workspace.experiences.length"> and their Experiences</template></h3>
            <div v-for="item in workspace.interfaces" :id="`nar-${item.id}`" :key="item.id" class="nar-anchor nar-block space-y-2.5" :class="flashId === item.id && 'nar-flash'">
              <div class="flex flex-wrap items-center gap-2">
                <BlrKind kind="interface" :labelled="false" /><h4 class="text-base font-semibold tracking-tight text-highlighted">{{ item.title }}</h4>
              </div>
              <BlrProse :text="item.lead" />
              <BlrAvail :pairs="[]" :entry-points="item.entryPoints" label="Entry points" />
              <div class="space-y-1"><p class="blr-field">Capability boundary</p><BlrProse :text="item.capabilityBoundary" /></div>
              <div class="space-y-1">
                <BlrLinks :workspace="workspace" :ids="item.actorIds" kind="actor" label="Who enters" interactive @select="jumpToEntity" />
                <BlrLinks :workspace="workspace" :ids="item.experienceIds" kind="experience" label="Experiences within" interactive @select="jumpToEntity" />
              </div>
              <p class="text-sm text-dimmed">Derived from declared availability: {{ item.screenIds.length }} Screens, {{ item.capabilityIds.length }} Capabilities and {{ item.journeyIds.length }} Journeys reachable through this Interface.</p>
              <BlrRefs :references="item.references" />
            </div>

            <div v-for="item in workspace.experiences" :id="`nar-${item.id}`" :key="item.id" class="nar-anchor nar-block ms-4 space-y-2.5 border-s-2 border-muted ps-4" :class="flashId === item.id && 'nar-flash'">
              <div class="flex flex-wrap items-center gap-2">
                <BlrKind kind="experience" :labelled="false" />
                <h4 class="text-base font-semibold tracking-tight text-highlighted">{{ item.title }}</h4>
                <UBadge :color="item.accessMode === 'public' ? 'success' : item.accessMode === 'authenticated' ? 'warning' : 'error'" variant="subtle" size="sm">{{ item.accessMode }}</UBadge>
              </div>
              <BlrProse :text="item.lead" />
              <BlrAvail :pairs="[]" :entry-points="item.entryPoints" label="Entry points" />
              <div class="space-y-1"><p class="blr-field">Capability boundary</p><BlrProse :text="item.capabilityBoundary" /></div>
              <div class="space-y-1">
                <BlrLinks :workspace="workspace" :ids="item.interfaceIds" kind="interface" label="Inside" interactive @select="jumpToEntity" />
                <BlrLinks :workspace="workspace" :ids="item.actorIds" kind="actor" label="Who enters" interactive @select="jumpToEntity" />
              </div>
              <p class="text-sm text-dimmed">Derived from declared availability: {{ item.screenIds.length }} Screens, {{ item.capabilityIds.length }} Capabilities and {{ item.journeyIds.length }} Journeys scoped to this Experience.</p>
              <BlrRefs :references="item.references" />
            </div>
            <p v-if="!workspace.experiences.length" class="text-sm text-muted italic">No Interface declares Experiences — every access context is the Interface itself.</p>
          </div>

          <figure class="space-y-2">
            <figcaption class="text-sm leading-6 text-muted">How the access contexts compare — every count is derived from declared availability.</figcaption>
            <div class="overflow-x-auto">
              <table class="nar-table">
                <thead>
                  <tr>
                    <th>Context</th><th>Type</th><th>Access</th><th>Actors</th><th class="text-end">Screens</th>
                    <th class="text-end">Capabilities</th><th class="text-end">Journeys</th><th class="text-end">Entry points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in accessRows" :key="row.key">
                    <td><button type="button" class="nar-cell-link" @click="jumpToEntity(row.entity)">{{ row.context }}</button></td>
                    <td class="text-dimmed">{{ row.type }}</td><td class="text-dimmed">{{ row.access }}</td><td class="text-muted">{{ row.actors || '—' }}</td>
                    <td class="text-end tabular-nums">{{ row.screens }}</td><td class="text-end tabular-nums">{{ row.capabilities }}</td>
                    <td class="text-end tabular-nums">{{ row.journeys }}</td><td class="text-end tabular-nums">{{ row.entryPoints }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </figure>
        </section>

        <!-- ======================================= 3 · The visible surface -->
        <section id="nar-chapter-surface" data-chapter="surface" class="nar-chapter space-y-8">
          <header class="space-y-2 border-t-2 border-accented pt-6">
            <p class="blr-eyebrow">Chapter 3 · {{ CHAPTERS[2].title }}</p>
            <h2 class="text-3xl font-semibold tracking-[-0.035em] text-highlighted">{{ CHAPTERS[2].question }}</h2>
          </header>

          <template v-if="workspace.screens.length">
            <figure class="space-y-2">
              <div class="h-[26rem] overflow-hidden rounded-xl border border-default bg-elevated/30">
                <BlrFlowCanvas :nodes="screenMap.nodes" :fit-padding="0.12" @select="onMapSelect" @focus="onMapFocus" @clear="surfaceSelectedId = null" />
              </div>
              <figcaption class="text-sm leading-6 text-muted">
                The visible surface as containment: Interfaces are columns, Experiences are the groups inside them, and
                each Screen sits where its declared availability places it.
                <span class="blr-no-print">Click a box to read it here; double-click to jump to its section.</span>
              </figcaption>
            </figure>
            <div v-if="surfaceSelected" class="nar-disclosure space-y-3">
              <BlrEntityDetail :workspace="workspace" :entity="surfaceSelected" depth="brief" @select="jumpToEntity" />
              <UButton icon="i-lucide-corner-right-down" color="neutral" variant="ghost" size="xs" label="Read in place" class="blr-no-print" @click="jumpToEntity(surfaceSelected)" />
            </div>
          </template>
          <p v-else class="text-sm leading-6 text-muted">The model declares no Screens: none of its Interfaces is a graphical surface, so this Product has no visible surface to map. Its behaviour is told entirely through the promises in the next chapter.</p>

          <div v-for="(section, index) in surfaceSections" :key="section.productInterface.id" class="space-y-4">
            <h3 class="text-lg font-semibold tracking-tight text-highlighted"><span class="blr-meta me-2">3.{{ index + 1 }}</span>Screens of {{ section.productInterface.title }}</h3>
            <template v-if="section.screens.length">
              <div v-for="entry in section.screens" :id="entry.anchor ? `nar-${entry.screen.id}` : undefined" :key="entry.screen.id" class="nar-anchor nar-block space-y-2.5" :class="flashId === entry.screen.id && entry.anchor && 'nar-flash'">
                <div class="flex flex-wrap items-center gap-2">
                  <BlrKind kind="screen" :labelled="false" />
                  <h4 class="text-base font-semibold tracking-tight text-highlighted">{{ entry.screen.title }}</h4>
                  <UButton class="ms-auto blr-no-print" color="neutral" variant="ghost" size="xs" :icon="isOpen(chipKey('screen', section.productInterface.id, entry.screen.id)) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" :label="isOpen(chipKey('screen', section.productInterface.id, entry.screen.id)) ? 'Hide full detail' : 'Full detail'" @click="toggle(chipKey('screen', section.productInterface.id, entry.screen.id))" />
                </div>
                <BlrProse :text="entry.screen.lead" />
                <p class="text-sm text-dimmed">Presents {{ entry.screen.information.length }} information items · {{ entry.screen.actions.length }} actions · {{ entry.screen.states.length }} states<template v-if="entry.screen.capabilityIds.length"> · exposes {{ titlesOf(entry.screen.capabilityIds) }}</template></p>
                <BlrAvail :pairs="entry.screen.availability" />
                <div v-if="isOpen(chipKey('screen', section.productInterface.id, entry.screen.id))" class="nar-disclosure">
                  <BlrEntityDetail :workspace="workspace" :entity="entry.screen" depth="full" @select="jumpToEntity" />
                </div>
              </div>
            </template>
            <p v-else class="text-sm leading-6 text-muted italic">“{{ section.productInterface.title }}” declares no Screens — it is not a graphical surface, and that is a fact about its interaction contract, not a gap in the model.</p>
          </div>
        </section>

        <!-- ============================================== 4 · The promises -->
        <section id="nar-chapter-promises" data-chapter="promises" class="nar-chapter space-y-10">
          <header class="space-y-2 border-t-2 border-accented pt-6">
            <p class="blr-eyebrow">Chapter 4 · {{ CHAPTERS[3].title }}</p>
            <h2 class="text-3xl font-semibold tracking-[-0.035em] text-highlighted">{{ CHAPTERS[3].question }}</h2>
          </header>

          <div v-if="workspace.scenarioKinds.length" class="flex flex-wrap items-baseline gap-1.5">
            <span class="blr-field">Scenario kinds</span>
            <UTooltip v-for="kind in workspace.scenarioKinds" :key="kind.id" :text="kind.description || kind.name">
              <UBadge color="neutral" variant="outline" size="md">
                {{ kind.name }}
                <span class="blr-meta">{{ kind.count }}</span>
              </UBadge>
            </UTooltip>
          </div>

          <section v-for="(entry, journeyIndex) in journeyChapters" :id="`nar-${entry.journey.id}`" :key="entry.journey.id" class="nar-anchor space-y-6" :class="flashId === entry.journey.id && 'nar-flash'">
            <!-- The journey header is this design's "card": the promise itself. -->
            <header class="space-y-3 border-t pt-6 blr-hairline">
              <p class="blr-meta">4.{{ journeyIndex + 1 }} · Journey</p>
              <h3 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">{{ entry.journey.title }}</h3>
              <BlrProse :text="entry.journey.lead" size="base" />
              <div v-if="entry.journey.intent" class="space-y-1"><p class="blr-field">Intent</p><BlrProse :text="entry.journey.intent" /></div>
              <BlrLinks :workspace="workspace" :ids="entry.journey.actorIds" kind="actor" label="Performed by" interactive @select="jumpToEntity" />
              <BlrAvail :pairs="entry.journey.availability" :entry-points="entry.journey.entryPoints" />
              <p class="text-sm text-dimmed">{{ entry.scenarios.length }} scenarios · {{ entry.journey.stepCount }} authored steps<template v-if="entry.journey.domainIds.length"> · touches {{ titlesOf(entry.journey.domainIds) }} (derived)</template></p>
              <div class="space-y-2">
                <p class="blr-field">Capabilities, Screens and Rules woven through it — tap any to preview</p>
                <div class="flex flex-wrap gap-1.5">
                  <UButton
                    v-for="chip in resolveIds(journeyChipIds(entry.journey))"
                    :key="chip.id"
                    size="xs"
                    :color="isOpen(chipKey('j', entry.journey.id, chip.id)) ? 'primary' : 'neutral'"
                    :variant="isOpen(chipKey('j', entry.journey.id, chip.id)) ? 'soft' : 'outline'"
                    class="rounded-full"
                    :trailing-icon="isOpen(chipKey('j', entry.journey.id, chip.id)) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                    @click="toggle(chipKey('j', entry.journey.id, chip.id))"
                  >
                    <span class="inline-flex items-center gap-1.5"><BlrKind :kind="chip.kind" :labelled="false" size="xs" />{{ chip.title }}</span>
                  </UButton>
                </div>
                <template v-for="chip in resolveIds(journeyChipIds(entry.journey))" :key="`d-${chip.id}`">
                  <div v-if="isOpen(chipKey('j', entry.journey.id, chip.id))" class="nar-disclosure space-y-2">
                    <BlrEntityDetail :workspace="workspace" :entity="chip" depth="brief" @select="jumpToEntity" />
                    <UButton icon="i-lucide-corner-right-down" color="neutral" variant="ghost" size="xs" label="Read in place" class="blr-no-print" @click="jumpToEntity(chip)" />
                  </div>
                </template>
              </div>
              <UButton class="blr-no-print" color="neutral" variant="outline" size="xs" :icon="isOpen(`map:${entry.journey.id}`) ? 'i-lucide-chevron-up' : 'i-lucide-git-fork'" :label="isOpen(`map:${entry.journey.id}`) ? 'Hide journey map' : 'Show journey map'" @click="toggle(`map:${entry.journey.id}`)" />
              <div v-if="isOpen(`map:${entry.journey.id}`)" class="h-[26rem] overflow-hidden rounded-xl border border-default">
                <BlrTopology :workspace="workspace" :focus-id="entry.journey.id" @inspect="jumpToEntity" />
              </div>
            </header>

            <!-- Every scenario, told in full: the journey detail is the chapter body. -->
            <div v-for="(scenario, scenarioIndex) in entry.scenarios" :id="`nar-${scenario.id}`" :key="scenario.id" class="nar-anchor nar-scenario space-y-3" :class="flashId === scenario.id && 'nar-flash'">
              <div class="flex flex-wrap items-center gap-2">
                <p class="blr-meta">4.{{ journeyIndex + 1 }}.{{ scenarioIndex + 1 }}</p>
                <h4 class="text-base font-semibold tracking-tight text-highlighted">{{ scenario.title }}</h4>
                <UBadge color="neutral" variant="subtle" size="sm">{{ scenario.kindName }}</UBadge>
              </div>
              <div class="space-y-1"><p class="blr-field">When</p><BlrProse :text="scenario.trigger" /></div>
              <div class="space-y-1">
                <p class="blr-field">Steps · {{ scenario.steps.length }}</p>
                <ol class="list-decimal space-y-1.5 ps-6 text-sm leading-6 text-default marker:font-mono marker:text-xs marker:text-dimmed">
                  <li v-for="(step, stepIndex) in scenario.steps" :key="stepIndex">{{ step }}</li>
                </ol>
              </div>
              <div v-for="(point, pointIndex) in scenario.decisionPoints" :key="pointIndex" class="ms-6 space-y-2 border-s-2 border-muted ps-4">
                <p class="inline-flex items-center gap-1.5 text-sm font-medium text-highlighted">
                  <UIcon name="i-lucide-git-branch" class="size-3.5 text-dimmed" />{{ point.title }}
                </p>
                <BlrProse :text="point.question" class="text-muted" />
                <ul class="space-y-1.5">
                  <li v-for="(branch, branchIndex) in point.branches" :key="branchIndex" class="flex flex-wrap items-baseline gap-2 text-sm">
                    <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-default">{{ branch.condition }}</span>
                    <UIcon name="i-lucide-arrow-right" class="size-3.5 self-center text-dimmed" />
                    <span class="text-muted">{{ branch.outcome }}</span>
                  </li>
                </ul>
              </div>
              <div class="space-y-1"><p class="blr-field">Outcome</p><BlrProse :text="scenario.outcome" /></div>
              <aside v-if="scenario.edgeCases.length" class="nar-margin-note">
                <p class="blr-field">Edge cases · {{ scenario.edgeCases.length }}</p>
                <ul class="mt-1 space-y-1 text-sm leading-6 text-muted">
                  <li v-for="(edge, edgeIndex) in scenario.edgeCases" :key="edgeIndex">{{ edge }}</li>
                </ul>
              </aside>
              <BlrAvail v-if="scenario.availability.length" :pairs="scenario.availability" label="Narrowed to" />
              <div v-if="scenarioChipIds(scenario).length" class="space-y-2">
                <div class="flex flex-wrap gap-1.5">
                  <UButton
                    v-for="chip in resolveIds(scenarioChipIds(scenario))"
                    :key="chip.id"
                    size="xs"
                    :color="isOpen(chipKey('s', scenario.id, chip.id)) ? 'primary' : 'neutral'"
                    :variant="isOpen(chipKey('s', scenario.id, chip.id)) ? 'soft' : 'outline'"
                    class="rounded-full"
                    :trailing-icon="isOpen(chipKey('s', scenario.id, chip.id)) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                    @click="toggle(chipKey('s', scenario.id, chip.id))"
                  >
                    <span class="inline-flex items-center gap-1.5"><BlrKind :kind="chip.kind" :labelled="false" size="xs" />{{ chip.title }}</span>
                  </UButton>
                </div>
                <template v-for="chip in resolveIds(scenarioChipIds(scenario))" :key="`d-${chip.id}`">
                  <div v-if="isOpen(chipKey('s', scenario.id, chip.id))" class="nar-disclosure space-y-2">
                    <BlrEntityDetail :workspace="workspace" :entity="chip" depth="brief" @select="jumpToEntity" />
                    <UButton icon="i-lucide-corner-right-down" color="neutral" variant="ghost" size="xs" label="Read in place" class="blr-no-print" @click="jumpToEntity(chip)" />
                  </div>
                </template>
              </div>
              <BlrProse v-if="scenario.supportingContent" :text="scenario.supportingContent" class="text-muted" />
              <BlrRefs :references="scenario.references" />
            </div>
            <p v-if="!entry.scenarios.length" class="text-sm text-muted italic">This Journey has no authored Scenarios yet — the promise is declared but not cased out.</p>
            <div v-if="entry.journey.supportingContent" class="space-y-1">
              <p class="blr-field">Supporting context</p>
              <BlrProse :text="entry.journey.supportingContent" />
            </div>
            <BlrRefs :references="entry.journey.references" />
          </section>

          <figure class="space-y-2">
            <figcaption class="text-sm leading-6 text-muted">The promises compared — counts are derived from the authored model, never a ranking.</figcaption>
            <div class="overflow-x-auto">
              <table class="nar-table">
                <thead>
                  <tr>
                    <th>Journey</th><th>Actors</th><th>Available in</th><th class="text-end">Capabilities</th>
                    <th class="text-end">Screens</th><th class="text-end">Scenarios</th><th class="text-end">Rules</th><th class="text-end">Authored steps</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in journeyRows" :key="row.journey.id">
                    <td><button type="button" class="nar-cell-link" @click="jumpToEntity(row.journey)">{{ row.journey.title }}</button></td>
                    <td class="text-muted">{{ row.actors || '—' }}</td><td class="text-dimmed">{{ row.access || '—' }}</td>
                    <td class="text-end tabular-nums">{{ row.capabilities }}</td><td class="text-end tabular-nums">{{ row.screens }}</td>
                    <td class="text-end tabular-nums">{{ row.scenarios }}</td><td class="text-end tabular-nums">{{ row.rules }}</td><td class="text-end tabular-nums">{{ row.steps }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </figure>
        </section>

        <!-- ========================================== 5 · Durable abilities -->
        <section id="nar-chapter-abilities" data-chapter="abilities" class="nar-chapter space-y-8">
          <header class="space-y-2 border-t-2 border-accented pt-6">
            <p class="blr-eyebrow">Chapter 5 · {{ CHAPTERS[4].title }}</p>
            <h2 class="text-3xl font-semibold tracking-[-0.035em] text-highlighted">{{ CHAPTERS[4].question }}</h2>
          </header>

          <div v-for="(section, sectionIndex) in domainSections" :key="section.key" class="space-y-4">
            <div :id="section.domain ? `nar-${section.domain.id}` : undefined" class="nar-anchor space-y-2" :class="section.domain && flashId === section.domain.id && 'nar-flash'">
              <h3 class="text-lg font-semibold tracking-tight text-highlighted"><span class="blr-meta me-2">5.{{ sectionIndex + 1 }}</span>{{ section.title }}</h3>
              <template v-if="section.domain">
                <BlrProse :text="section.domain.lead" />
                <p class="text-sm text-dimmed">Derived reach: {{ section.domain.journeyIds.length }} Journeys, {{ section.domain.screenIds.length }} Screens and {{ section.domain.ruleIds.length }} Rules touch this Domain through its Capabilities.</p>
                <BlrRefs :references="section.domain.references" />
              </template>
              <p v-else class="text-sm text-muted italic">These Capabilities belong to no Domain — the model declares them free-standing.</p>
            </div>
            <div v-for="capability in section.capabilities" :id="`nar-${capability.id}`" :key="capability.id" class="nar-anchor nar-block space-y-2.5" :class="flashId === capability.id && 'nar-flash'">
              <div class="flex flex-wrap items-center gap-2">
                <BlrKind kind="capability" :labelled="false" /><h4 class="text-base font-semibold tracking-tight text-highlighted">{{ capability.title }}</h4>
              </div>
              <BlrProse :text="capability.lead" />
              <div v-if="capability.intent" class="space-y-1"><p class="blr-field">Intent</p><BlrProse :text="capability.intent" /></div>
              <div class="space-y-1">
                <BlrLinks :workspace="workspace" :ids="capability.journeyIds" kind="journey" label="Used by (derived)" interactive @select="jumpToEntity" />
                <BlrLinks :workspace="workspace" :ids="capability.screenIds" kind="screen" label="Exposed on (derived)" interactive @select="jumpToEntity" />
                <BlrLinks :workspace="workspace" :ids="capability.ruleIds" kind="rule" label="Constrained by (derived)" interactive @select="jumpToEntity" />
              </div>
              <BlrAvail :pairs="capability.availability" label="Reachable in" />
              <BlrProse v-if="capability.supportingContent" :text="capability.supportingContent" class="text-muted" />
              <BlrRefs :references="capability.references" />
            </div>
          </div>
          <p v-if="!workspace.capabilities.length" class="text-sm text-muted italic">The model declares no Capabilities.</p>

          <template v-if="workspace.capabilities.length">
            <figure v-if="workspace.journeys.length" class="space-y-2">
              <figcaption class="text-sm leading-6 text-muted">
                <span class="font-medium text-default">Matrix — Which Product promises depend on each Capability?</span>
                A mark means the Journey declares the Capability as supporting it.
                <span class="blr-no-print">Click any cell for the exact relationship.</span>
              </figcaption>
              <div class="overflow-x-auto">
                <table class="nar-table nar-matrix">
                  <thead>
                    <tr>
                      <th>Capability</th>
                      <th v-for="journey in workspace.journeys" :key="journey.id" class="nar-th-col"><span>{{ journey.title }}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in promiseMatrix" :key="row.capability.id">
                      <th class="text-start font-normal"><button type="button" class="nar-cell-link" @click="jumpToEntity(row.capability)">{{ row.capability.title }}</button></th>
                      <td v-for="cell in row.cells" :key="cell.journey.id" class="text-center">
                        <button type="button" class="nar-cell" :title="`${row.capability.title} × ${cell.journey.title}`" :class="matrixNote?.id === `promises:${row.capability.id}:${cell.journey.id}` && 'nar-cell--active'" @click="explainPromiseCell(row.capability, cell.journey, cell.hit)">
                          <span v-if="cell.hit" class="nar-dot" /><span v-else class="text-dimmed">·</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-if="matrixNote && matrixNote.id.startsWith('promises:')" class="nar-matrix-note">{{ matrixNote.text }}</p>
            </figure>

            <figure v-if="workspace.pairs.length" class="space-y-2">
              <figcaption class="text-sm leading-6 text-muted">
                <span class="font-medium text-default">Matrix — Where can each Capability be reached?</span>
                A mark means the Capability declares availability in that access scope.
                <span class="blr-no-print">Click any cell for the exact relationship.</span>
              </figcaption>
              <div class="overflow-x-auto">
                <table class="nar-table nar-matrix">
                  <thead>
                    <tr>
                      <th>Capability</th>
                      <th v-for="pair in workspace.pairs" :key="pair.key" class="nar-th-col"><span>{{ pairLabel(pair) }}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in reachMatrix" :key="row.capability.id">
                      <th class="text-start font-normal"><button type="button" class="nar-cell-link" @click="jumpToEntity(row.capability)">{{ row.capability.title }}</button></th>
                      <td v-for="cell in row.cells" :key="cell.pair.key" class="text-center">
                        <button type="button" class="nar-cell" :title="`${row.capability.title} × ${pairLabel(cell.pair)}`" :class="matrixNote?.id === `reach:${row.capability.id}:${cell.pair.key}` && 'nar-cell--active'" @click="explainReachCell(row.capability, cell.pair, cell.hit)">
                          <span v-if="cell.hit" class="nar-dot" /><span v-else class="text-dimmed">·</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-if="matrixNote && matrixNote.id.startsWith('reach:')" class="nar-matrix-note">{{ matrixNote.text }}</p>
            </figure>
          </template>
        </section>

        <!-- ============================================ 6 · The constraints -->
        <section id="nar-chapter-constraints" data-chapter="constraints" class="nar-chapter space-y-10">
          <header class="space-y-2 border-t-2 border-accented pt-6">
            <p class="blr-eyebrow">Chapter 6 · {{ CHAPTERS[5].title }}</p>
            <h2 class="text-3xl font-semibold tracking-[-0.035em] text-highlighted">{{ CHAPTERS[5].question }}</h2>
          </header>

          <div v-for="(reach, ruleIndex) in ruleReach" :id="`nar-${reach.rule.id}`" :key="reach.rule.id" class="nar-anchor space-y-4" :class="flashId === reach.rule.id && 'nar-flash'">
            <p class="blr-meta">6.{{ ruleIndex + 1 }} · Business rule</p>
            <h3 class="text-xl font-semibold tracking-tight text-highlighted">{{ reach.rule.title }}</h3>
            <div class="nar-pullquote"><BlrProse :text="reach.rule.statement" size="base" /></div>
            <div v-if="reach.rule.rationale" class="space-y-1"><p class="blr-field">Rationale</p><BlrProse :text="reach.rule.rationale" /></div>
            <div v-if="reach.rule.intent" class="space-y-1"><p class="blr-field">Intent</p><BlrProse :text="reach.rule.intent" /></div>
            <div class="space-y-2">
              <p class="blr-field">Directly attached — authored on the rule</p>
              <div class="flex flex-wrap gap-1.5">
                <UButton v-for="entity in reach.direct" :key="entity.id" size="xs" color="neutral" variant="outline" class="rounded-full" @click="jumpToEntity(entity)">
                  <span class="inline-flex items-center gap-1.5"><BlrKind :kind="entity.kind" :labelled="false" size="xs" />{{ entity.title }}</span>
                </UButton>
                <span v-if="!reach.direct.length" class="text-sm text-muted italic">Nothing directly attached.</span>
              </div>
            </div>
            <div class="space-y-2">
              <p class="blr-field">Derived reach — computed from the model, not authored</p>
              <div class="flex flex-wrap gap-1.5">
                <UButton v-for="entity in reach.derived" :key="entity.id" size="xs" color="neutral" variant="ghost" class="rounded-full border border-dashed border-accented text-muted" @click="jumpToEntity(entity)">
                  <span class="inline-flex items-center gap-1.5"><BlrKind :kind="entity.kind" :labelled="false" size="xs" />{{ entity.title }}</span>
                </UButton>
                <span v-if="!reach.derived.length" class="text-sm text-muted italic">No reach beyond its direct attachments.</span>
              </div>
            </div>
            <BlrAvail :pairs="reach.rule.availability" label="Scoped to" inherited-note="Not narrowed — the rule holds across every declared access scope." />
            <UButton class="blr-no-print" color="neutral" variant="outline" size="xs" :icon="isOpen(`map:${reach.rule.id}`) ? 'i-lucide-chevron-up' : 'i-lucide-radar'" :label="isOpen(`map:${reach.rule.id}`) ? 'Hide impact map' : 'Show impact map'" @click="toggle(`map:${reach.rule.id}`)" />
            <div v-if="isOpen(`map:${reach.rule.id}`)" class="h-[24rem] overflow-hidden rounded-xl border border-default">
              <BlrTopology :workspace="workspace" :focus-id="reach.rule.id" @inspect="jumpToEntity" />
            </div>
            <BlrProse v-if="reach.rule.supportingContent" :text="reach.rule.supportingContent" class="text-muted" />
            <BlrRefs :references="reach.rule.references" />
          </div>
          <p v-if="!workspace.rules.length" class="text-sm text-muted italic">The model declares no Business Rules.</p>
        </section>

        <!-- ================================================== 7 · Colophon -->
        <section id="nar-chapter-colophon" data-chapter="colophon" class="nar-chapter space-y-8">
          <header class="space-y-2 border-t-2 border-accented pt-6">
            <p class="blr-eyebrow">Chapter 7 · {{ CHAPTERS[6].title }}</p>
            <h2 class="text-3xl font-semibold tracking-[-0.035em] text-highlighted">{{ CHAPTERS[6].question }}</h2>
          </header>

          <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />

          <figure v-if="workspace.references.length" class="space-y-2">
            <figcaption class="text-sm leading-6 text-muted">Every reference in the model, with the entity that cites it.</figcaption>
            <div class="overflow-x-auto">
              <table class="nar-table">
                <thead><tr><th>Cited by</th><th>Reference</th><th>Kind</th><th>Role</th></tr></thead>
                <tbody>
                  <tr v-for="(group, index) in workspace.references" :key="index">
                    <td>
                      <button type="button" class="nar-cell-link inline-flex items-center gap-1.5" @click="jumpToOwner(group)">
                        <BlrKind :kind="group.ownerKind" :labelled="false" size="xs" />{{ group.ownerTitle }}
                      </button>
                    </td>
                    <td class="max-w-72">
                      <a v-if="isExternal(group.reference.target)" :href="group.reference.target" target="_blank" rel="noopener noreferrer" class="block truncate font-mono text-xs text-primary underline underline-offset-2">{{ group.reference.title || group.reference.target }}</a>
                      <span v-else class="blr-meta block truncate" :title="group.reference.target">{{ group.reference.title || group.reference.target }}</span>
                    </td>
                    <td class="text-dimmed">{{ group.reference.kind }}</td><td class="text-dimmed">{{ group.reference.role }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </figure>

          <figure v-if="workspace.pairs.length" class="space-y-2">
            <figcaption class="text-sm leading-6 text-muted">Every declared access scope, with the entities that declare it directly (derived counts; Scenarios with no scope of their own inherit their Journey's and are not counted here).</figcaption>
            <div class="overflow-x-auto">
              <table class="nar-table">
                <thead>
                  <tr>
                    <th>Interface</th><th>Experience</th><th class="text-end">Screens</th><th class="text-end">Capabilities</th>
                    <th class="text-end">Journeys</th><th class="text-end">Scenarios</th><th class="text-end">Rules</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="usage in pairUsage" :key="usage.pair.key">
                    <td class="text-muted">{{ usage.pair.interfaceTitle }}</td><td class="text-dimmed">{{ usage.pair.experienceTitle || '— direct' }}</td>
                    <td class="text-end tabular-nums">{{ usage.screens }}</td><td class="text-end tabular-nums">{{ usage.capabilities }}</td>
                    <td class="text-end tabular-nums">{{ usage.journeys }}</td><td class="text-end tabular-nums">{{ usage.scenarios }}</td><td class="text-end tabular-nums">{{ usage.rules }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </figure>

          <p class="blr-meta border-t pt-4 leading-relaxed blr-hairline">Generated by {{ workspace.identity.generator.name }} v{{ workspace.identity.generator.version }} · {{ workspace.identity.generatedAt }} · schema {{ workspace.identity.schemaVersion }} · {{ workspace.identity.referenceProfile }} reference profile<template v-if="workspace.identity.license"> · {{ workspace.identity.license }}</template></p>
        </section>
      </article>

      <!-- Chapter rail: slim, sticky, scrollspy-highlighted on xl. -->
      <nav class="blr-no-print hidden xl:block" aria-label="Chapters">
        <ol class="sticky top-[calc(var(--blr-chrome)+1.5rem)] space-y-1 border-s border-default ps-3 pt-8">
          <li v-for="(chapter, index) in CHAPTERS" :key="chapter.id">
            <button type="button" class="flex w-full items-baseline gap-2 py-1 text-start text-sm transition" :class="activeChapter === chapter.id ? 'font-medium text-highlighted' : 'text-muted hover:text-highlighted'" :aria-current="activeChapter === chapter.id ? 'true' : undefined" @click="scrollToChapter(chapter.id)">
              <span class="blr-meta">{{ index + 1 }}</span>{{ chapter.title }}
            </button>
          </li>
        </ol>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.nar-chapter,
.nar-anchor { scroll-margin-top: calc(var(--blr-chrome) + 4.75rem); }

@media (min-width: 1280px) {
  .nar-chapter,
  .nar-anchor { scroll-margin-top: calc(var(--blr-chrome) + 1.5rem); }
}

/* Document blocks: hairline separations, quiet asides, one pull-quote style. */
.nar-block { border-bottom: 1px solid var(--ui-border-muted); padding-bottom: 1.25rem; }
.nar-scenario { border-inline-start: 2px solid var(--ui-border-muted); padding-inline-start: 1.25rem; }
.nar-margin-note { border-inline-start: 2px dashed var(--ui-border-accented); padding-block: 0.25rem; padding-inline-start: 1rem; }
.nar-pullquote { border-inline-start: 3px solid var(--ui-primary); padding-block: 0.25rem; padding-inline-start: 1.25rem; }
.nar-pullquote :deep(p) { font-size: var(--text-lg); line-height: 1.7; color: var(--ui-text-highlighted); }
.nar-disclosure { border: 1px solid var(--ui-border); border-inline-start: 2px solid var(--ui-border-accented); border-radius: 0.625rem; background: color-mix(in srgb, var(--ui-bg-elevated) 45%, transparent); padding: 1rem; }

/* Printed tables: hairline rows, quiet sentence-case headings, generous air. */
.nar-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
.nar-table thead th { border-bottom: 1px solid var(--ui-border-accented); padding: 0.375rem 0.625rem; font-size: var(--text-xs); font-weight: 500; text-align: start; color: var(--ui-text-muted); vertical-align: bottom; }
.nar-table tbody td,
.nar-table tbody th { border-bottom: 1px solid var(--ui-border-muted); padding: 0.5rem 0.625rem; vertical-align: top; }
.nar-cell-link { text-align: start; color: var(--ui-text-highlighted); text-decoration-line: underline; text-decoration-color: color-mix(in srgb, var(--ui-text-dimmed) 45%, transparent); text-underline-offset: 3px; }
.nar-cell-link:hover { text-decoration-color: var(--ui-primary); }

/* Matrices: rotated column heads, dot marks, cell-click explanation. */
.nar-matrix thead th.nar-th-col { height: 9.5rem; padding: 0.375rem 0.25rem; text-align: center; }
.nar-matrix thead th.nar-th-col > span { display: inline-block; max-height: 8.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; writing-mode: vertical-rl; transform: rotate(180deg); }
.nar-cell { display: inline-flex; align-items: center; justify-content: center; width: 1.75rem; height: 1.75rem; border-radius: 0.375rem; }
.nar-cell:hover { background: var(--ui-bg-elevated); }
.nar-cell--active { outline: 1.5px solid var(--ui-primary); outline-offset: -1.5px; }
.nar-dot { width: 0.5rem; height: 0.5rem; border-radius: 999px; background: var(--ui-primary); }
.nar-matrix-note { border-inline-start: 2px solid var(--ui-primary); padding-inline-start: 0.75rem; font-size: var(--text-sm); line-height: 1.6; color: var(--ui-text-default); }

/* Jump-target highlight: one quiet pulse, then gone. */
.nar-flash { animation: nar-flash 1.8s ease-out; border-radius: 0.5rem; }

@keyframes nar-flash {
  0% { background: color-mix(in srgb, var(--ui-primary) 12%, transparent); box-shadow: 0 0 0 6px color-mix(in srgb, var(--ui-primary) 12%, transparent); }
  100% { background: transparent; box-shadow: none; }
}

/* Print: each chapter starts a page; nothing readable is split mid-block. */
@media print {
  .nar-chapter:not(:first-of-type) { break-before: page; }

  .nar-block,
  .nar-scenario,
  .nar-disclosure,
  figure { break-inside: avoid; }
}
</style>
