<script setup lang="ts">
/**
 * Contextual topology shows one entity's neighbourhood,
 * never the whole model.
 *
 * It starts deliberately small: the focus entity and everything one hop away.
 * A reader expands intentionally (per selected box), filters by kind without
 * the layout jumping (fade, not removal — membership only changes on expand),
 * re-roots by double-click, and can walk back the way they came. The strip
 * under the canvas explains the selected entity in words, because a graph
 * that cannot say what a box *is* has not answered anything.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, REPORT_ENTITY_KINDS, resolveEntityKey } from '../utils/reportWorkspace'
import { buildNeighbourhood, layoutFlow, neighbourIds } from '../utils/flowGraph'
import { firstSentence } from '../utils/reportMarkdown'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  focusId: string
  /** Hide the explanation strip when the host view provides its own. */
  explain?: boolean
  direction?: 'LR' | 'TB'
}>(), {
  explain: true,
  direction: 'LR'
})

const emit = defineEmits<{
  /** Selection changed inside the graph; null when the canvas was cleared. */
  select: [entity: AnyEntityView | null]
  /** The reader asked for the full entity content in the host view. */
  inspect: [entity: AnyEntityView]
}>()

const focus = ref(props.focusId)
const history = ref<string[]>([])
const expandedIds = ref<string[]>([])
const selectedId = ref<string | null>(null)
const excludedKinds = ref<Set<ReportEntityKind>>(new Set())

watch(() => props.focusId, (next) => {
  focus.value = next
  history.value = []
  expandedIds.value = []
  selectedId.value = null
})

const focusEntity = computed(() => resolveEntityKey(props.workspace, focus.value) ?? null)
const selectedEntity = computed(() => (selectedId.value && resolveEntityKey(props.workspace, selectedId.value)) || null)

/** Kinds actually present around the focus — the filter never lists ghosts. */
const presentKinds = computed<ReportEntityKind[]>(() => {
  const kinds = new Set<ReportEntityKind>()
  for (const rootId of [focus.value, ...expandedIds.value]) {
    for (const id of neighbourIds(props.workspace, rootId)) {
      kinds.add(resolveEntityKey(props.workspace, id)!.kind)
    }
  }
  return REPORT_ENTITY_KINDS.map(meta => meta.kind).filter(kind => kinds.has(kind))
})

const graph = computed(() => {
  const activeKinds = new Set<ReportEntityKind>(
    presentKinds.value.filter(kind => !excludedKinds.value.has(kind))
  )
  // Roots always survive the kind filter; hiding the thing being explained
  // would turn filtering into navigation.
  const shape = buildNeighbourhood(props.workspace, [focus.value, ...expandedIds.value], {
    kinds: activeKinds,
    selectedId: selectedId.value
  })
  return layoutFlow(shape, { direction: props.direction })
})

const selectedExpandable = computed(() => (
  selectedEntity.value
  && selectedEntity.value.key !== focus.value
  && !expandedIds.value.includes(selectedEntity.value.key)
  && neighbourIds(props.workspace, selectedEntity.value.key).length > 0
))

function handleSelect(entityId: string) {
  selectedId.value = entityId === selectedId.value ? null : entityId
  emit('select', selectedEntity.value)
}

function handleClear() {
  selectedId.value = null
  emit('select', null)
}

function refocus(entityId: string) {
  if (entityId === focus.value) return
  history.value = [...history.value, focus.value]
  focus.value = entityId
  expandedIds.value = []
  selectedId.value = entityId
  emit('select', resolveEntityKey(props.workspace, entityId) ?? null)
}

function goBack() {
  const previous = history.value.at(-1)
  if (!previous) return
  history.value = history.value.slice(0, -1)
  focus.value = previous
  expandedIds.value = []
  selectedId.value = null
  emit('select', null)
}

function expandSelected() {
  if (!selectedEntity.value || !selectedExpandable.value) return
  expandedIds.value = [...expandedIds.value, selectedEntity.value.key]
}

function toggleKind(kind: ReportEntityKind) {
  const next = new Set(excludedKinds.value)
  if (next.has(kind)) next.delete(kind)
  else next.add(kind)
  excludedKinds.value = next
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-default px-3 py-2">
      <UButton
        v-if="history.length"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        size="xs"
        :label="`Back to ${resolveEntityKey(workspace, history.at(-1)!)?.title ?? 'previous'}`"
        @click="goBack"
      />
      <span v-if="focusEntity" class="inline-flex min-w-0 items-center gap-1.5">
        <BlrKind :kind="focusEntity.kind" :labelled="false" />
        <span class="truncate text-xs font-medium text-highlighted">{{ focusEntity.title }}</span>
        <span class="blr-field">Neighbourhood</span>
      </span>
      <div class="ms-auto flex flex-wrap items-center gap-1">
        <button
          v-for="kind in presentKinds"
          :key="kind"
          type="button"
          class="rounded-full border px-1.5 py-0.5 transition"
          :class="excludedKinds.has(kind)
            ? 'border-transparent opacity-35 grayscale hover:opacity-60'
            : 'border-default bg-elevated/50'"
          :title="excludedKinds.has(kind)
            ? `Show ${ENTITY_KIND_META[kind].plural}`
            : `Fade ${ENTITY_KIND_META[kind].plural}`"
          @click="toggleKind(kind)"
        >
          <BlrKind :kind="kind" size="xs" />
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1">
      <BlrFlowCanvas
        :nodes="graph.nodes"
        :edges="graph.edges"
        @select="handleSelect"
        @focus="refocus"
        @clear="handleClear"
      />
    </div>

    <div
      v-if="explain"
      class="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-t border-default px-3 py-2"
    >
      <template v-if="selectedEntity">
        <BlrKind :kind="selectedEntity.kind" :labelled="false" />
        <span class="text-xs font-medium text-highlighted">{{ selectedEntity.title }}</span>
        <span class="min-w-0 flex-1 truncate text-xs text-dimmed">
          {{ firstSentence(selectedEntity.lead) }}
        </span>
        <span class="flex shrink-0 items-center gap-1">
          <UButton
            v-if="selectedExpandable"
            icon="i-lucide-plus"
            color="neutral"
            variant="outline"
            size="xs"
            label="Expand"
            title="Add this entity's own neighbourhood"
            @click="expandSelected"
          />
          <UButton
            v-if="selectedEntity.id !== focus"
            icon="i-lucide-scan"
            color="neutral"
            variant="outline"
            size="xs"
            label="Focus"
            title="Rebuild the map around this entity"
            @click="refocus(selectedEntity.id)"
          />
          <UButton
            icon="i-lucide-book-open"
            color="neutral"
            variant="outline"
            size="xs"
            label="Open"
            title="Open the full entity content"
            @click="emit('inspect', selectedEntity)"
          />
        </span>
      </template>
      <span v-else class="text-xs text-dimmed italic">
        Select a box to read what it is; double-click to make it the focus.
      </span>
    </div>
  </div>
</template>
