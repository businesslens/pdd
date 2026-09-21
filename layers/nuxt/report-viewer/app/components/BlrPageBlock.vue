<script setup lang="ts">
/**
 * One block of a page, rendered by id.
 *
 * The page owns arrangement; this switchboard keeps each authored or derived
 * reading in one implementation.
 */
import type { AnyResourceView, ReportWorkspace, InterfaceView } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, counterpartsOf } from '../utils/reportWorkspace'
import { resourceFacts } from '../utils/resourceFacts'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading } from '../utils/topologyState'
import { resourceReviewKey, reviewResource } from '../utils/resourceReview'
import type { PageBlockId } from '../utils/pageSections'
import { interfaceProjection } from '../utils/topologyProjections'
import type { ComparisonSide } from '../utils/resourceComparison'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
  id: PageBlockId
  /** Draw a heading above the block; layouts that head their own suppress it. */
  heading?: boolean
}>()

const emit = defineEmits<{
  open: [resource: AnyResourceView]
}>()

const reading = defineModel<TopologyReading>('reading', { default: defaultTopologyReading })
function openKey(key: string) {
  const resource = props.workspace.byKey.get(key)
  if (resource) emit('open', resource)
}
const review = inject(resourceReviewKey, computed(() => null))
const beforeResource = computed(() => reviewResource(review.value, 'before', props.resource.key))
const afterResource = computed(() => reviewResource(review.value, 'after', props.resource.key))
const oldFacts = computed(() => beforeResource.value && review.value?.before ? resourceFacts(review.value.before.workspace, beforeResource.value) : [])
const meta = computed(() => ENTITY_KIND_META[props.resource.kind])
const contexts = computed(() => props.resource.kind === 'capability' ? props.resource.contexts : [])
const entryPoints = computed(() => props.resource.kind === 'journey' ? props.resource.entryPoints : [])
const counterparts = computed(() => counterpartsOf(props.workspace, props.resource))
const facts = computed(() => resourceFacts(props.workspace, props.resource).filter(fact => fact.value))
// Complex sections reuse their ordinary renderer for previous values. Entity
// facts and Scenario steps have their own finer-grained annotations.
function blockValue(side: ComparisonSide | null | undefined) {
  const resource = side?.workspace.byKey.get(props.resource.key)
  if (!resource || !side) return undefined
  if (props.id === 'detail' && resource.kind !== 'entity') {
    const value: Record<string, unknown> = { intent: resource.intent }
    if ('capabilityBoundary' in resource) value.capabilityBoundary = resource.capabilityBoundary
    if (resource.kind === 'screen') Object.assign(value, { entities: resource.entityIds, information: resource.information, actions: resource.actions, states: resource.states })
    if (resource.kind === 'rule') Object.assign(value, { statement: resource.statement, rationale: resource.rationale, appliesTo: resource.appliesTo, permits: resource.permits })
    if (resource.kind === 'capability') value.effects = resource.entityEffects
    if (resource.kind === 'journey') Object.assign(value, { successCriterion: resource.successCriterion, leavesBehind: resource.leavesBehind })
    return Object.values(value).some(item => Array.isArray(item) ? item.length : !!item) ? value : undefined
  }
  if (props.id === 'contexts') {
    const items = resource.kind === 'capability' ? resource.contexts : resource.kind === 'journey' ? resource.entryPoints : []
    return items.length ? items : undefined
  }
  if (props.id === 'delivery' && resource.kind === 'interface') return interfaceProjection(side.workspace, true).find(branch => branch.id === resource.key)
  if (props.id === 'screens' && resource.kind === 'experience') {
    const items = side.workspace.screens.filter(screen => screen.contexts.some(context => context.experienceId === resource.id || (resource.interfaceIds.includes(context.interfaceId) && !context.experienceId)))
    return items.length ? items.map(screen => ({ key: screen.key, title: screen.title, contexts: screen.contexts })) : undefined
  }
  if (props.id === 'counterparts') {
    const items = counterpartsOf(side.workspace, resource)
    return items.length ? items.map(item => ({ key: item.key, title: item.title })) : undefined
  }
  return undefined
}
const beforeBlock = computed(() => blockValue(review.value?.before))
const afterBlock = computed(() => blockValue(review.value?.after))
const blockLabels: Partial<Record<PageBlockId, string>> = { detail: 'Details', contexts: 'Contexts', delivery: 'Delivery', screens: 'Screens', counterparts: 'Also on' }
const blockLabel = computed(() => blockLabels[props.id] ?? props.id)
const removedBlock = computed(() => beforeBlock.value !== undefined && afterBlock.value === undefined && !!beforeResource.value)
function openPrevious(resource: AnyResourceView) { if (review.value?.before) review.value.inspect(resource.key, review.value.before.state) }
</script>

<template>
  <BlrReviewValue :before="beforeBlock" :after="afterBlock" :label="blockLabel">
  <template v-if="removedBlock && review?.before && beforeResource">
    <BlrReviewSnapshot :side="review.before"><BlrPageBlock :workspace="review.before.workspace" :resource="beforeResource" :id="id" :heading="heading" @open="openPrevious" /></BlrReviewSnapshot>
  </template>
  <template v-else>
  <BlrReviewValue v-if="id === 'lead' && (resource.lead || beforeResource?.lead)" :before="beforeResource?.lead" :after="afterResource?.lead" long label="Description">
    <BlrProse :text="resource.lead || beforeResource?.lead || ''" size="base" class="max-w-3xl" />
  </BlrReviewValue>

  <dl v-else-if="id === 'facts' && facts.length" class="flex flex-wrap gap-x-8 gap-y-3 max-[359px]:gap-x-4">
    <div v-for="fact in facts" :key="fact.label" class="min-w-0">
      <dt class="flex items-center gap-1.5 text-xs text-dimmed">
        <BlrReferenceIcon v-if="fact.term === 'reference'" class="size-3.5" />
        <BlrTerm v-if="fact.term" :slug="fact.term" :text="fact.label" />
        <template v-else>{{ fact.label }}</template>
      </dt>
      <dd class="mt-0.5 text-sm font-medium text-highlighted"><BlrReviewValue :before="oldFacts.find(old => old.label === fact.label)?.value" :after="fact.value" :label="fact.label">{{ fact.value }}</BlrReviewValue></dd>
    </div>
  </dl>

  <BlrContexts
    v-else-if="id === 'contexts' && (contexts.length || entryPoints.length)"
    :workspace="workspace"
    :contexts="contexts"
    :entry-points="entryPoints"
    @select="emit('open', $event)"
  />

  <BlrResourceBody
    v-else-if="id === 'detail'"
    :workspace="workspace"
    :resource="resource"
    @select="emit('open', $event)"
  />

  <div v-else-if="id === 'counterparts' && counterparts.length" class="space-y-2">
    <p v-if="heading" class="blr-block-heading">
      Also on
      <span class="ms-2 font-normal text-dimmed">
        the same {{ meta.label.toLowerCase() }} on another Interface
      </span>
    </p>
    <BlrResourceCard
      v-for="counterpart in counterparts"
      :key="counterpart.key"
      :workspace="workspace"
      :resource="counterpart"
      @open="emit('open', $event)"
    />
  </div>

  <BlrInterfaceDelivery v-else-if="id === 'delivery' && resource.kind === 'interface'" v-model:reading="reading" :workspace="workspace" :resource="resource as InterfaceView" @open="openKey" />

  <BlrExperienceContents v-else-if="id === 'screens' && resource.kind === 'experience'" :workspace="workspace" :resource="resource" @open="openKey" />

  <div v-else-if="id === 'connections'" data-resource-connections class="space-y-2.5">
    <p v-if="heading" class="blr-block-heading">Connections</p>
    <BlrConnections :workspace="workspace" :resource="resource" @select="emit('open', $event)" />
  </div>

  <div v-else-if="id === 'supporting' && (resource.supportingContent || beforeResource?.supportingContent)" class="space-y-2">
    <p v-if="heading" class="blr-block-heading">Supporting context</p>
    <BlrReviewValue :before="beforeResource?.supportingContent" :after="afterResource?.supportingContent" long label="Supporting context"><BlrProse :text="resource.supportingContent || beforeResource?.supportingContent || ''" class="max-w-3xl" /></BlrReviewValue>
  </div>

  <BlrRefs v-else-if="id === 'references'" :references="review ? afterResource?.references ?? [] : resource.references" :previous="review ? beforeResource?.references ?? [] : undefined" :scope="JSON.stringify([workspace.identity.id, resource.key])" :label="heading ? 'References' : ''" data-resource-references />
  </template>
  <template #before>
    <BlrReviewSnapshot v-if="review?.before && beforeResource" :side="review.before"><BlrPageBlock :workspace="review.before.workspace" :resource="beforeResource" :id="id" :heading="heading" @open="openPrevious" /></BlrReviewSnapshot>
  </template>
  </BlrReviewValue>
</template>

<style scoped>
.blr-block-heading {
  font-size: var(--text-sm);
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--ui-text-highlighted);
}
</style>
