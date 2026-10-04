<script setup lang="ts">
/** Rows nests outgoing changes under their starting States; Graph inspects the same lifecycle. */
import type { AnyResourceView, EntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { resolveResource } from '../utils/reportWorkspace'
import { buildEntityLifecycle, groupEntityLifecycle, lifecycleArcCondition, lifecycleArcEdgeId, lifecycleArcLabel, lifecycleArcTitle, lifecycleChangeAddress, lifecycleConditionNote, lifecycleStateCondition } from '../utils/entityLifecycle'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: EntityView
  /** A change asked for by address (`lifecycle/<change>`), shown once in the drawing on screen. */
  change?: string
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView], ready: [], 'update:change': [address: string] }>()
const lifecycle = computed(() => buildEntityLifecycle(props.workspace, props.resource))
const scrollKey = computed(() => JSON.stringify([props.workspace.identity.id, 'lifecycle', props.resource.key]))
const { element: rowsPane, save, restore } = useBlrTopologyScroll(scrollKey)
interface LifecycleReading {
  drawing: 'rows' | 'graph'
  selected: string | null
  closedGroups: string[]
  expandedChanges: string[]
  expandedProvenance: string[]
}
const reading = ref<LifecycleReading>({ drawing: 'graph', selected: null, closedGroups: [], expandedChanges: [], expandedProvenance: [] })
const storedKeys = (value: unknown): string[] => Array.isArray(value) ? value.filter((key): key is string => typeof key === 'string') : []
const storageKey = computed(() => `blr:lifecycle:${import.meta.client ? location.pathname : ''}:${scrollKey.value}`)
watch(storageKey, () => {
  reading.value = { drawing: 'graph', selected: null, closedGroups: [], expandedChanges: [], expandedProvenance: [] }
  if (!import.meta.client) return
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey.value) ?? 'null')
    if (saved) reading.value = {
      drawing: saved.drawing === 'rows' ? 'rows' : 'graph',
      selected: typeof saved.selected === 'string' ? saved.selected : null,
      closedGroups: storedKeys(saved.closedGroups), expandedChanges: storedKeys(saved.expandedChanges), expandedProvenance: storedKeys(saved.expandedProvenance)
    }
  } catch { /* Optional persistence. */ }
}, { immediate: true })
watch(reading, value => {
  if (import.meta.client) try { sessionStorage.setItem(storageKey.value, JSON.stringify(value)) } catch { /* Reading works without storage. */ }
}, { deep: true })

const drawnEdgeIds = computed(() => new Set(lifecycle.value.edges.map(edge => edge.id)))
const arcs = computed(() => props.resource.arcs.map((arc, index) => {
  const label = lifecycleArcLabel(props.workspace, props.resource, index)
  return { ...arc, id: lifecycleArcEdgeId(props.resource.id, arc), title: lifecycleArcTitle(arc),
    /* A row sits under the State it leaves, so its phrase names only where it goes — unless it stays. */
    rowMention: { effect: arc.effect, from: arc.to && arc.to === arc.from ? arc.from : '', to: arc.to },
    capabilities: label.capabilities,
    /* "Only under …" where some choice of alternatives leaves nothing making it. */
    condition: (() => { const condition = lifecycleArcCondition(props.workspace, props.resource, arc); return condition.conditional ? lifecycleConditionNote([condition]) : '' })(),
    drawn: drawnEdgeIds.value.has(lifecycleArcEdgeId(props.resource.id, arc)) }
}))
const groups = computed(() => groupEntityLifecycle(props.resource, arcs.value))
const stateCondition = (name: string) => lifecycleStateCondition(props.workspace, props.resource, name)
const unplaced = computed(() => arcs.value.filter(arc => !arc.drawn))
const prohibitions = computed(() => props.resource.prohibitions.map(prohibition => ({
  ...prohibition,
  id: `blr-forbidden:${props.resource.id}:${prohibition.ruleId}:${prohibition.from}:${prohibition.to}`,
  ruleTitle: resolveResource(props.workspace, 'rule', prohibition.ruleId)?.title ?? prohibition.ruleId,
  operation: prohibition.effect === 'reads' ? 'read it'
    : prohibition.effect === 'creates' ? `create it${prohibition.to ? ` as ${prohibition.to}` : ''}`
      : prohibition.effect === 'removes' ? `remove it${prohibition.from ? ` from ${prohibition.from}` : ''}`
        : prohibition.from || prohibition.to ? `move it${prohibition.from ? ` from ${prohibition.from}` : ''}${prohibition.to ? ` to ${prohibition.to}` : ''}` : 'change it'
})))
const selectedArc = computed(() => arcs.value.find(arc => arc.id === reading.value.selected))
const selectedState = computed(() => props.resource.states.find(state => `blr-state:${props.resource.id}:${state.name}` === reading.value.selected))
const selectedProhibition = computed(() => prohibitions.value.find(item => item.id === reading.value.selected))
const stateArcs = computed(() => selectedState.value ? arcs.value.filter(arc => arc.from === selectedState.value!.name || arc.to === selectedState.value!.name) : [])
const showInspector = computed(() => reading.value.drawing === 'graph' && Boolean(selectedState.value || selectedProhibition.value || selectedArc.value))
const inspectorHeading = useTemplateRef('inspectorHeading')
const inspectorPane = useTemplateRef('inspectorPane')
let returnFocus: HTMLElement | null = null

/* The part of a change the reader reached for from its graph label: its Capability, or — from a Forbidden mark — the Rule forbidding it. */
const highlight = ref<'capability' | 'rule' | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | undefined
function inspect(key: string, badge?: string) {
  if (!inspectorPane.value?.contains(document.activeElement)) returnFocus = document.activeElement as HTMLElement | null
  reading.value.selected = key
  clearTimeout(highlightTimer)
  highlight.value = badge === 'capability' ? 'capability' : badge === 'mark' ? 'rule' : null
  void nextTick(() => {
    const pane = inspectorPane.value
    pane?.scrollTo(0, 0)
    inspectorHeading.value?.focus({ preventScroll: true })
    pane?.scrollIntoView({ block: 'nearest' })
    const part = highlight.value && pane?.querySelector(`[data-change-part="${highlight.value}"]`)
    if (!part) { highlight.value = null; return }
    part.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    highlightTimer = setTimeout(() => { highlight.value = null }, 1600)
  })
}
onBeforeUnmount(() => clearTimeout(highlightTimer))
function closeInspector() {
  reading.value.selected = null
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
}
function setGroupOpen(key: string, open: boolean) {
  save()
  reading.value.closedGroups = open ? reading.value.closedGroups.filter(id => id !== key) : [...new Set([...reading.value.closedGroups, key])]
}
function toggleChange(id: string) {
  const open = !reading.value.expandedChanges.includes(id)
  reading.value.expandedChanges = open ? [...reading.value.expandedChanges, id] : reading.value.expandedChanges.filter(key => key !== id)
  reading.value.selected = open ? id : reading.value.expandedChanges.at(-1) ?? null
}
function setProvenanceOpen(key: string, open: boolean) {
  reading.value.expandedProvenance = open ? [...new Set([...reading.value.expandedProvenance, key])] : reading.value.expandedProvenance.filter(id => id !== key)
}
function toggleAll(open: boolean) {
  save()
  reading.value.closedGroups = open ? [] : groups.value.map(group => group.key)
  reading.value.expandedChanges = open ? arcs.value.map(arc => arc.id) : []
  reading.value.expandedProvenance = open ? groups.value.filter(group => group.state).map(group => group.key) : []
  if (!open) reading.value.selected = null
}
async function revealSelection() {
  const selected = reading.value.selected
  const group = groups.value.find(group => group.key === selected || group.arcs.some(arc => arc.id === selected))
  if (!group) return
  setGroupOpen(group.key, true)
  if (selectedArc.value && !reading.value.expandedChanges.includes(selectedArc.value.id)) reading.value.expandedChanges.push(selectedArc.value.id)
  await nextTick()
  const row = [...rowsPane.value?.querySelectorAll<HTMLElement>('[data-occurrence-id], [data-group-id]') ?? []]
    .find(item => item.dataset.occurrenceId === selected || item.dataset.groupId === selected)
  row?.scrollIntoView({ block: 'nearest' })
}
function draw(drawing: 'rows' | 'graph') {
  save()
  reading.value.drawing = drawing
  if (drawing === 'rows') void restore().then(revealSelection)
}
function openRule(id: string) {
  const resource = resolveResource(props.workspace, 'rule', id)
  if (resource) emit('open', resource)
}
watch(() => props.workspace, () => { save(); void restore() }, { flush: 'pre' })
onMounted(() => { if (reading.value.drawing === 'rows') emit('ready') })

/* A change asked for from another reading — a Capability's move — is shown in
   whichever drawing is on screen, then the address is let go: the reading
   keeps the selection from there, as it does for one chosen here. */
watch(() => props.change, (address) => {
  if (!address) return
  const arc = arcs.value.find(item => lifecycleChangeAddress(item) === address)
  emit('update:change', '')
  if (!arc) return
  if (reading.value.drawing === 'graph') { inspect(arc.id); return }
  const group = groups.value.find(item => item.arcs.some(other => other.id === arc.id))
  if (group) reading.value.closedGroups = reading.value.closedGroups.filter(key => key !== group.key)
  if (!reading.value.expandedChanges.includes(arc.id)) reading.value.expandedChanges = [...reading.value.expandedChanges, arc.id]
  reading.value.selected = arc.id
  void nextTick(() => rowsPane.value?.querySelector(`[data-occurrence-id="${CSS.escape(arc.id)}"]`)?.scrollIntoView({ block: 'nearest' }))
}, { immediate: true })
</script>

<template>
  <div class="blr-lifecycle flex h-full min-h-0 flex-col gap-3" data-lifecycle>
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <p class="text-sm text-muted">{{ resource.states.length }} {{ resource.states.length === 1 ? 'state' : 'states' }} · {{ arcs.length }} {{ arcs.length === 1 ? 'change' : 'changes' }}</p>
      <div class="flex items-center gap-2">
        <UFieldGroup v-if="reading.drawing === 'rows'" size="sm" aria-label="Lifecycle expansion">
          <UTooltip text="Expand all"><UButton icon="i-lucide-maximize-2" color="neutral" variant="outline" aria-label="Expand all" @click="toggleAll(true)" /></UTooltip>
          <UTooltip text="Collapse all"><UButton icon="i-lucide-minimize-2" color="neutral" variant="outline" aria-label="Collapse all" @click="toggleAll(false)" /></UTooltip>
        </UFieldGroup>
        <UFieldGroup size="sm" aria-label="Lifecycle drawing">
          <UTooltip text="Rows"><UButton icon="i-lucide-rows-3" :color="reading.drawing === 'rows' ? 'primary' : 'neutral'" :variant="reading.drawing === 'rows' ? 'soft' : 'outline'" :aria-pressed="reading.drawing === 'rows'" aria-label="Draw as rows" @click="draw('rows')" /></UTooltip>
          <UTooltip text="Graph"><UButton icon="i-lucide-waypoints" :color="reading.drawing === 'graph' ? 'primary' : 'neutral'" :variant="reading.drawing === 'graph' ? 'soft' : 'outline'" :aria-pressed="reading.drawing === 'graph'" aria-label="Draw as graph" @click="draw('graph')" /></UTooltip>
        </UFieldGroup>
      </div>
    </div>

    <div class="blr-lifecycle-workspace min-h-0 flex-1" :class="showInspector && 'has-inspector'">
      <div class="flex min-h-0 min-w-0 flex-col gap-2">
        <template v-if="reading.drawing === 'graph'">
          <BlrDiagram :diagram="lifecycle" :viewport-key="scrollKey" :selected="reading.selected" class="blr-lifecycle-diagram min-h-0 flex-1" :title="`${resource.title} lifecycle`" @inspect="inspect" @ready="emit('ready')" />
          <div v-if="unplaced.length" class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-default p-2" data-lifecycle-unplaced>
            <span class="text-xs text-muted">Changes without specified states · {{ unplaced.length }}</span>
            <UButton v-for="arc in unplaced" :key="arc.id" :label="arc.title" :aria-pressed="reading.selected === arc.id" color="neutral" variant="outline" size="sm" @click="inspect(arc.id)" />
          </div>
          <p v-if="!lifecycle.edges.length" class="text-xs text-muted">No movement between states is described in the model.</p>
        </template>
        <div v-else ref="rowsPane" class="min-h-0 flex-1 overflow-auto" data-lifecycle-rows @scroll.passive="save">
          <div class="space-y-3">
            <UCollapsible v-for="group in groups" :key="group.key" :open="!reading.closedGroups.includes(group.key)"
              class="overflow-hidden rounded-xl border border-default bg-elevated/20" :data-group-id="group.key" :data-state="group.state?.name" data-lifecycle-group
              @update:open="setGroupOpen(group.key, $event)">
              <template #default="{ open }">
                <UButton color="neutral" variant="ghost" size="sm" block data-group-header
                  class="w-full justify-start rounded-none px-3 py-2 text-start"
                  :aria-label="`${open ? 'Collapse' : 'Expand'} ${group.title}, ${group.arcs.length} ${group.arcs.length === 1 ? 'change' : 'changes'}`">
                  <BlrEntityState v-if="group.state" :name="group.state.name" />
                  <template v-else>
                    <UIcon name="i-lucide-minus" class="size-3.5 shrink-0 text-dimmed" />
                    <span class="min-w-0 text-sm font-semibold tracking-tight text-highlighted">{{ group.title }}</span>
                  </template>
                  <span class="blr-meta ms-auto">{{ group.arcs.length }}</span>
                  <UIcon name="i-lucide-chevron-down" class="size-3.5 shrink-0 text-dimmed transition-transform" :class="open && 'rotate-180'" />
                </UButton>
              </template>
              <template #content>
                <div class="space-y-2 border-t border-muted p-2">
                  <div class="space-y-2 px-2 py-1">
                    <BlrProse v-if="group.state?.content" :text="group.state.content" />
                    <p v-else-if="group.explanation" class="text-sm text-muted">{{ group.explanation }}</p>
                    <p v-if="group.state && !group.state.reached" class="text-xs text-muted">No Scenario leaves it in this state.</p>
                    <p v-if="group.state && stateCondition(group.state.name)" class="flex items-center gap-1 text-xs text-muted" data-state-condition><UIcon name="i-lucide-split" class="size-3 shrink-0" />Reached {{ stateCondition(group.state.name)!.replace(/^Only/, 'only') }}</p>
                    <details v-if="group.state && (group.state.capabilityScenarioIds.length || group.state.journeyScenarioIds.length)" class="text-sm"
                      :open="reading.expandedProvenance.includes(group.key)" @toggle="setProvenanceOpen(group.key, ($event.target as HTMLDetailsElement).open)">
                      <summary class="cursor-pointer text-xs text-muted">Scenarios that leave it here · {{ group.state.capabilityScenarioIds.length + group.state.journeyScenarioIds.length }}</summary>
                      <div class="mt-2 space-y-2">
                        <BlrLinks :workspace="workspace" :ids="group.state.capabilityScenarioIds" kind="capability-scenario" interactive @select="emit('open', $event)" />
                        <BlrLinks :workspace="workspace" :ids="group.state.journeyScenarioIds" kind="journey-scenario" interactive @select="emit('open', $event)" />
                      </div>
                    </details>
                  </div>
                  <ul v-if="group.arcs.length" class="space-y-2">
                    <li v-for="arc in group.arcs" :key="arc.id" :data-occurrence-id="arc.id" data-lifecycle-change
                      class="overflow-hidden rounded-[0.625rem] border border-default bg-default" :class="{ 'border-dashed': arc.forbiddenByRuleIds.length > 0 || arc.condition }">
                      <button type="button" class="blr-resource-row group flex w-full items-start gap-3 rounded-[0.625rem] px-4 py-3 text-start transition hover:bg-elevated/40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                        :aria-label="`${reading.expandedChanges.includes(arc.id) ? 'Collapse' : 'Expand'} ${arc.title}`" :aria-expanded="reading.expandedChanges.includes(arc.id)" @click="toggleChange(arc.id)">
                        <span class="min-w-0 flex-1">
                          <span class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                            <BlrEntityEffect :mention="arc.rowMention" />
                            <span v-if="arc.forbiddenByRuleIds.length" class="text-xs text-primary">forbidden by Rule</span>
                            <span v-if="arc.condition" class="inline-flex items-center gap-1 text-xs text-muted" data-change-condition><UIcon name="i-lucide-split" class="size-3 shrink-0" />{{ arc.condition }}</span>
                          </span>
                          <!-- The Capabilities making it, as the graph's badge and the details' chips draw them; the row itself is the control. -->
                          <span v-if="!reading.expandedChanges.includes(arc.id) && arc.capabilities.length" class="mt-2 flex flex-wrap gap-1.5">
                            <span v-for="title in arc.capabilities" :key="title" class="blr-chip"><BlrKind kind="capability" :labelled="false" size="xs" class="shrink-0" /><span class="min-w-0 truncate">{{ title }}</span></span>
                          </span>
                        </span>
                        <UIcon name="i-lucide-chevron-down" class="mt-0.5 size-3.5 shrink-0 text-dimmed transition-transform" :class="reading.expandedChanges.includes(arc.id) && 'rotate-180'" />
                      </button>
                      <BlrLifecycleChangeDetails v-if="reading.expandedChanges.includes(arc.id)" :workspace="workspace" :resource="resource" :change="arc" class="border-t border-default p-3" @open="emit('open', $event)" />
                    </li>
                  </ul>
                  <p v-else class="px-2 py-1 text-sm text-muted">No outgoing changes are described in the model.</p>
                </div>
              </template>
            </UCollapsible>
          </div>
        </div>
      </div>

      <aside v-if="showInspector" ref="inspectorPane" class="blr-lifecycle-inspector min-w-0 overflow-auto rounded-lg border border-default bg-elevated/30 p-3" aria-label="Lifecycle details" data-lifecycle-inspector>
        <div class="mb-3 flex items-start justify-between gap-2">
          <!-- A State wears its badge and a change reads as every other change does; the plain title stays their accessible name. -->
          <h3 ref="inspectorHeading" tabindex="-1" class="pt-1 text-sm font-semibold text-highlighted outline-none" :aria-label="selectedState?.name ?? selectedArc?.title ?? 'Forbidden change'">
            <BlrEntityState v-if="selectedState" :name="selectedState.name" />
            <BlrEntityEffect v-else-if="selectedArc" :mention="selectedArc" class="font-normal" />
            <template v-else>Forbidden change</template>
          </h3>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" aria-label="Close lifecycle details" @click="closeInspector" />
        </div>
        <BlrLifecycleChangeDetails v-if="selectedArc" :workspace="workspace" :resource="resource" :change="selectedArc" :highlight="highlight" @open="emit('open', $event)" />
        <div v-else-if="selectedState" class="space-y-4">
          <BlrProse :text="selectedState.content" />
          <p v-if="!selectedState.reached" class="text-sm text-muted">No Scenario leaves it in this state.</p>
          <p v-if="stateCondition(selectedState.name)" class="flex items-center gap-1.5 text-sm font-medium text-highlighted" data-state-condition><UIcon name="i-lucide-split" class="size-3.5 shrink-0" />Reached {{ stateCondition(selectedState.name)!.replace(/^Only/, 'only') }}</p>
          <section v-if="selectedState.capabilityScenarioIds.length || selectedState.journeyScenarioIds.length" class="space-y-2">
            <h4 class="blr-field"><BlrTerm slug="left-here-by" /></h4>
            <BlrLinks :workspace="workspace" :ids="selectedState.capabilityScenarioIds" kind="capability-scenario" interactive @select="emit('open', $event)" />
            <BlrLinks :workspace="workspace" :ids="selectedState.journeyScenarioIds" kind="journey-scenario" interactive @select="emit('open', $event)" />
          </section>
          <section v-if="stateArcs.length" class="space-y-2">
            <h4 class="blr-field">Changes involving this state</h4>
            <ul class="space-y-1">
              <li v-for="arc in stateArcs" :key="arc.id">
                <button type="button" class="-mx-1.5 rounded-md px-1.5 py-1 text-start text-sm transition-colors hover:bg-elevated/60 focus-visible:outline-2 focus-visible:outline-primary" :aria-label="`Inspect ${arc.title}`" @click="inspect(arc.id)">
                  <BlrEntityEffect :mention="arc" />
                </button>
              </li>
            </ul>
          </section>
        </div>
        <div v-else-if="selectedProhibition" class="space-y-2 text-sm">
          <p>Nobody may {{ selectedProhibition.operation }}.</p>
          <BlrResourceLink :resource-key="`rule:${selectedProhibition.ruleId}`" class="underline decoration-dotted underline-offset-2" @open="openRule(selectedProhibition.ruleId)">{{ selectedProhibition.ruleTitle }}</BlrResourceLink>
        </div>
      </aside>
    </div>

    <div v-if="prohibitions.length || resource.noCreation || resource.noTermination" class="max-h-28 shrink-0 space-y-1 overflow-auto text-xs text-muted">
      <details v-if="prohibitions.length">
        <summary class="cursor-pointer">Prohibitions · {{ prohibitions.length }}</summary>
        <ul class="mt-2 space-y-2"><li v-for="prohibition in prohibitions" :key="prohibition.id">
          Nobody may {{ prohibition.operation }} —
          <BlrResourceLink :resource-key="`rule:${prohibition.ruleId}`" class="underline decoration-dotted underline-offset-2" @open="openRule(prohibition.ruleId)">{{ prohibition.ruleTitle }}</BlrResourceLink>
        </li></ul>
      </details>
      <p v-if="resource.noCreation">No creation is described in the model.</p>
      <p v-if="resource.noTermination">No removal is described in the model.</p>
    </div>
  </div>
</template>

<style scoped>
.blr-lifecycle-workspace { display: grid; grid-template-rows: minmax(0, 1fr); gap: 12px; }
.blr-lifecycle-workspace.has-inspector { grid-template-rows: minmax(160px, 1fr) auto; }
.blr-lifecycle-inspector { max-height: min(40dvh, 340px); }
.blr-lifecycle-diagram :deep(.blr-diagram-canvas), .blr-lifecycle-diagram :deep(.blr-flow-shell) { min-height: 0; }
@container (min-width: 1000px) {
  .blr-lifecycle-workspace.has-inspector { grid-template-columns: minmax(0, 1fr) 320px; grid-template-rows: minmax(0, 1fr); }
  .blr-lifecycle-inspector { max-height: none; }
}
</style>
