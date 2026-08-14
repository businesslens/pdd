<script setup lang="ts">
/**
 * Columns — the tree, walked one level at a time.
 *
 * Premise: schema 5 says the model has two hierarchies and one axis, and the
 * shipped Workbench answers that by grouping *within* a collection. This asks
 * the opposite question: what if the hierarchy were the whole navigation?
 *
 * A Miller column browser is the shape that survives the objection that killed
 * the tree rail. A tree in a rail has to show every branch at once and pick one
 * parent per entity. Columns show one level at a time, so depth costs no
 * vertical space, and an entity with several parents simply appears in several
 * paths — which is true, and which a tree would have had to lie about.
 *
 * The axis is chosen explicitly rather than merged, because merging them is the
 * derivation ambiguity the named views exist to avoid: `Interfaces ⊃ Screens`
 * and `Domains ⊃ Capabilities` are different questions, not two halves of one.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META, entitiesOfKind, relatedIds, resolveEntities } from '../utils/model'
import type { WorkbenchVariant } from '../utils/workbenchVariants'

const props = defineProps<{
  workspace: ReportWorkspace
  variant: WorkbenchVariant
  logoSrc?: string | null
}>()

interface Axis {
  id: string
  name: string
  question: string
  /** Root kind first, then each level below it. */
  levels: ReportEntityKind[]
}

/*
  Three axes, named after what the format calls them. Actors and Business Rules
  head their own axis because they attach across everything: they contain
  nothing, so their second column is what they reach rather than what they own.
*/
const AXES: Axis[] = [
  {
    id: 'surface',
    name: 'Surface tree',
    question: 'Where is the Product, and what is on each surface?',
    levels: ['interface', 'experience', 'screen', 'capability']
  },
  {
    id: 'behavior',
    name: 'Behavior tree',
    question: 'What does the Product do, and how do we know it works?',
    levels: ['domain', 'capability', 'capability-scenario', 'screen']
  },
  {
    id: 'promise',
    name: 'Promises',
    question: 'What is promised, to whom, and how does it unfold?',
    levels: ['actor', 'journey', 'journey-scenario', 'screen']
  },
  {
    id: 'constraint',
    name: 'Constraints',
    question: 'What is ruled, and how far does each rule reach?',
    levels: ['rule', 'capability', 'capability-scenario', 'screen']
  }
]

const axisId = ref(AXES[0]!.id)
const axis = computed(() => AXES.find(item => item.id === axisId.value) ?? AXES[0]!)

/** One selected key per column depth. Truncated whenever a shallower one moves. */
const path = ref<string[]>([])

const columns = computed(() => {
  const result: Array<{ depth: number, kind: ReportEntityKind, entities: AnyEntityView[], selectedKey: string | null }> = []
  const [rootKind, ...rest] = axis.value.levels
  if (!rootKind) return result

  result.push({
    depth: 0,
    kind: rootKind,
    entities: entitiesOfKind(props.workspace, rootKind),
    selectedKey: path.value[0] ?? null
  })

  let parent = result[0]!.entities.find(entity => entity.key === path.value[0]) ?? null
  rest.forEach((kind, index) => {
    if (!parent) return
    const children = resolveEntities(props.workspace, kind, relatedIds(parent, kind))
    if (!children.length) return
    const depth = index + 1
    result.push({ depth, kind, entities: children, selectedKey: path.value[depth] ?? null })
    parent = children.find(entity => entity.key === path.value[depth]) ?? null
  })

  return result
})

/** The last thing chosen, at whatever depth: the reading in the final column. */
const selected = computed<AnyEntityView | null>(() => {
  for (let depth = columns.value.length - 1; depth >= 0; depth -= 1) {
    const column = columns.value[depth]
    const entity = column?.entities.find(item => item.key === column.selectedKey)
    if (entity) return entity
  }
  return null
})

function choose(depth: number, entity: AnyEntityView) {
  path.value = [...path.value.slice(0, depth), entity.key]
}

/** Where you are, as a trail of names rather than a stack of open panels. */
const trail = computed(() => columns.value
  .map(column => column.entities.find(entity => entity.key === column.selectedKey))
  .filter((entity): entity is AnyEntityView => Boolean(entity)))

/*
  Open on something.

  A Miller browser conventionally starts with nothing chosen, which here means
  one narrow column and four fifths of the window empty. Selecting the first
  root shows what the axis *does* — two columns and a reading — which is the
  thing being auditioned.
*/
function selectFirstRoot() {
  const [rootKind] = axis.value.levels
  const [first] = rootKind ? entitiesOfKind(props.workspace, rootKind) : []
  path.value = first ? [first.key] : []
}

watch(axisId, selectFirstRoot)
onMounted(selectFirstRoot)

function jump(entity: AnyEntityView) {
  /* Land ⌘K and relation clicks on an axis that can actually hold the entity,
     then select it at its own depth. */
  const target = AXES.find(item => item.levels.includes(entity.kind)) ?? axis.value
  axisId.value = target.id
  void nextTick(() => {
    const depth = target.levels.indexOf(entity.kind)
    if (depth === 0) {
      path.value = [entity.key]
      return
    }
    /* Deeper kinds need their parents chosen first; walk up by relation. */
    const chain: string[] = []
    let current: AnyEntityView | undefined = entity
    for (let level = depth; level >= 0 && current; level -= 1) {
      chain[level] = current.key
      const parentKind = target.levels[level - 1]
      if (!parentKind) break
      const [parentId] = relatedIds(current, parentKind)
      current = parentId
        ? resolveEntities(props.workspace, parentKind, [parentId])[0]
        : undefined
    }
    path.value = chain.filter(Boolean)
  })
}

const status = computed(() => trail.value.length
  ? trail.value.map(entity => entity.title).join(' › ')
  : axis.value.name)
</script>

<template>
  <BlrLabFrame :workspace="workspace" :variant="variant" :logo-src="logoSrc" :status="status" @select="jump">
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-default px-4 py-2">
        <span class="blr-col-label">Axis</span>
        <div class="flex flex-wrap items-center gap-1">
          <button
            v-for="item in AXES"
            :key="item.id"
            type="button"
            class="blr-col-axis"
            :data-current="item.id === axis.id"
            @click="axisId = item.id"
          >
            {{ item.name }}
          </button>
        </div>
        <p class="min-w-0 flex-1 truncate text-sm text-muted">{{ axis.question }}</p>
        <div class="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.07em] text-dimmed">
          <template v-for="(level, index) in axis.levels" :key="level">
            <span v-if="index" class="opacity-60">⊃</span>
            <span :class="index < columns.length ? 'text-muted' : ''">{{ ENTITY_KIND_META[level].plural }}</span>
          </template>
        </div>
      </div>

      <!-- The columns. Depth costs horizontal space, never vertical. -->
      <div class="flex min-h-0 flex-1">
        <div class="flex min-h-0 flex-1 overflow-x-auto">
          <section
            v-for="column in columns"
            :key="`${axis.id}:${column.depth}`"
            class="flex min-h-0 w-64 shrink-0 flex-col border-e border-default"
          >
            <header class="flex shrink-0 items-center gap-1.5 border-b border-default px-3 py-2">
              <UIcon
                :name="ENTITY_KIND_META[column.kind].icon"
                class="size-3.5 shrink-0"
                :style="{ color: `var(--blr-slot-${ENTITY_KIND_META[column.kind].slot})` }"
              />
              <span class="blr-col-label">{{ ENTITY_KIND_META[column.kind].plural }}</span>
              <span class="blr-meta ms-auto">{{ column.entities.length }}</span>
            </header>
            <div class="blr-pane min-h-0 flex-1 p-1.5">
              <button
                v-for="entity in column.entities"
                :key="entity.key"
                type="button"
                class="blr-col-item"
                :data-current="entity.key === column.selectedKey"
                :style="{ '--kind-color': `var(--blr-slot-${ENTITY_KIND_META[entity.kind].slot})` }"
                @click="choose(column.depth, entity)"
              >
                <span class="min-w-0 flex-1 truncate text-start">{{ entity.title }}</span>
                <UIcon
                  v-if="column.depth < axis.levels.length - 1"
                  name="i-lucide-chevron-right"
                  class="size-3.5 shrink-0 opacity-45"
                />
              </button>
              <p v-if="!column.entities.length" class="px-2 py-3 text-xs text-dimmed italic">Nothing at this level.</p>
            </div>
          </section>

          <!-- The last column is the reading, not another list. -->
          <section class="blr-pane min-w-0 flex-1">
            <div class="mx-auto max-w-3xl">
            <BlrLabReading
              :workspace="workspace"
              :entity="selected"
              empty-note="Pick something in the first column. Each choice opens the level below it, so depth never costs a scroll."
              @select="jump"
            />
            </div>
          </section>
        </div>
      </div>
    </div>
  </BlrLabFrame>
</template>

<style scoped>
.blr-col-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-col-axis {
  padding: 0.1875rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  font-size: 12px;
  color: var(--ui-text-muted);
}

.blr-col-axis:hover {
  border-color: var(--ui-border-accented);
  color: var(--ui-text-highlighted);
}

.blr-col-axis[data-current='true'] {
  border-color: transparent;
  background: var(--ui-bg-inverted);
  color: var(--ui-bg);
  font-weight: 600;
}

.blr-col-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.3125rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 13px;
  color: var(--ui-text-muted);
}

.blr-col-item:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.blr-col-item[data-current='true'] {
  background: color-mix(in srgb, var(--kind-color) 12%, var(--ui-bg-elevated));
  color: var(--ui-text-highlighted);
  font-weight: 600;
}
</style>
