<script setup lang="ts">
/**
 * One recorded location, with everything authored about it kept behind its own
 * disclosure.
 *
 * A row carries the icons of the categories recorded at that exact path. A
 * closed folder also says how much is hidden under it, drawn faded and muted:
 * that is navigation — a reason to open the folder — and never the
 * folder's own meaning, which is why it disappears the moment the folder opens
 * and why selecting it expands the folder rather than reading anything. It
 * counts distinct statements, so one claim recorded at three paths below counts
 * once. Opening a folder reveals the paths inside it and nothing else: an
 * explanation is disclosed by its own row, so structure stays browsable without
 * the prose that would bury it.
 */
import type { RepositoryTreeNode } from '../utils/repositoryTree'
import { repositoryModelKind } from '../utils/repositoryTree'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { slotColor } from '../utils/reportPalette'
import { COVERAGE_KIND_META, type CoverageStatement } from '../utils/coverageStatements'

const props = defineProps<{
  node: RepositoryTreeNode
  statementsAt: (path: string) => CoverageStatement[]
  /** Open folders and open explanations, the latter keyed `statements:<path>`. */
  expanded: string[]
  focused: string | null
  depth: number
}>()
const emit = defineEmits<{ toggle: [key: string], focus: [path: string | null] }>()

const open = computed(() => props.expanded.includes(props.node.value))
const here = computed(() => props.statementsAt(props.node.value))
const reading = computed(() => props.expanded.includes(`statements:${props.node.value}`))
const kinds = computed(() => [...new Set(here.value.map(statement => statement.kind))])
const collect = (node: RepositoryTreeNode): CoverageStatement[] =>
  [...props.statementsAt(node.value), ...node.children.flatMap(collect)]
/** Distinct statements recorded anywhere below — what opening this folder finds. */
const below = computed(() => props.node.children.length
  ? [...new Set(props.node.children.flatMap(collect))]
  : [])
const kindsBelow = computed(() => [...new Set(below.value.map(statement => statement.kind))])
const model = computed(() => {
  const kind = repositoryModelKind(props.node)
  return kind ? ENTITY_KIND_META[kind] : null
})
const colorMode = useColorMode()
const modelLogo = computed(() => `/brand/logo/mark${colorMode.value === 'dark' ? '-dark' : ''}.svg`)
const label = computed(() => props.node.label + (props.node.directory ? '/' : ''))
const indent = computed(() => `${props.depth * 1.15}rem`)

/** Reading a location focuses it; putting the focused one away clears the focus. */
function read() {
  if (!here.value.length) return
  if (!reading.value) emit('focus', props.node.value)
  else if (props.focused === props.node.value) emit('focus', null)
  emit('toggle', `statements:${props.node.value}`)
}
/** The path is a pointer target for the row's one control, never a second tab stop. */
function select() {
  if (here.value.length) read()
  else if (props.node.children.length) emit('toggle', props.node.value)
}
</script>

<template>
  <li class="min-w-0">
    <div
      class="flex min-w-0 items-center gap-2 rounded-md py-1 pe-2 transition-colors"
      :class="[focused === node.value && 'bg-elevated/60', here.length && 'hover:bg-elevated/40']"
      :style="{ paddingInlineStart: indent }"
    >
      <button
        v-if="node.children.length"
        type="button"
        class="flex size-4 shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="`${open ? 'Collapse' : 'Expand'} ${node.value}`"
        :aria-expanded="open"
        @click="emit('toggle', node.value)"
      >
        <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0 text-dimmed transition-transform" :class="open && 'rotate-90'" />
      </button>
      <span v-else class="size-4 shrink-0" />
      <img
        v-if="node.directory && node.value.split('/').at(-1) === '.businesslens'"
        :src="modelLogo"
        alt=""
        title="BusinessLens Product Model"
        class="size-4 shrink-0 object-contain"
        data-model-folder-logo
      >
      <UIcon
        v-else-if="model"
        :name="model.icon"
        :title="model.label"
        :style="{ color: slotColor(model.slot, colorMode.value === 'dark') }"
        class="size-4 shrink-0"
        :data-model-kind="model.kind"
      />
      <UIcon
        v-else
        :name="node.directory ? open && node.children.length ? 'i-lucide-folder-open' : 'i-lucide-folder' : 'i-lucide-file'"
        class="size-4 shrink-0 text-muted"
      />
      <span
        class="min-w-0 truncate text-start font-mono text-sm"
        :class="[here.length ? 'cursor-pointer text-default' : node.children.length ? 'cursor-pointer text-dimmed' : 'text-dimmed', reading && 'font-semibold']"
        :aria-current="focused === node.value ? 'true' : undefined"
        :data-repository-path="node.value"
        @click="select"
      >{{ label }}</span>
      <!--
        The icons, the count and the chevron are the row's one control: its
        marks are what a reader reaches for, and they exist exactly when there
        is something to disclose. The path above is only a larger pointer target
        for it, so keyboard and screen-reader users meet one stop per row.
      -->
      <button
        v-if="here.length"
        type="button"
        class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 text-muted transition-colors hover:bg-elevated/60 hover:text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="`${reading ? 'Hide' : 'Read'} ${here.length} ${here.length === 1 ? 'statement' : 'statements'} recorded at ${node.value}`"
        :aria-expanded="reading"
        data-coverage-reveal
        @click="read"
      >
        <span class="flex shrink-0 items-center gap-1">
          <UIcon
            v-for="kind in kinds"
            :key="kind"
            :name="COVERAGE_KIND_META[kind].icon"
            class="blr-coverage-mark size-3.5 shrink-0"
            :class="COVERAGE_KIND_META[kind].tone"
            :title="`${COVERAGE_KIND_META[kind].label} recorded here`"
            :data-coverage-kind="kind"
          />
        </span>
        <!-- Counts where the set is many: one icon already says there is one. -->
        <span v-if="here.length > 1" class="blr-meta">{{ here.length }}</span>
        <UIcon name="i-lucide-chevron-down" class="size-3.5 shrink-0 transition-transform" :class="reading && 'rotate-180'" />
      </button>
      <!-- Only while closed: what opening this folder would find, never its own meaning. -->
      <button
        v-if="!open && below.length"
        type="button"
        class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 text-dimmed transition-colors hover:bg-elevated/60 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="`Expand ${node.value} to read ${below.length} recorded inside it`"
        data-coverage-inside
        @click="emit('toggle', node.value)"
      >
        <span class="flex items-center gap-1">
          <UIcon
            v-for="kind in kindsBelow"
            :key="kind"
            :name="COVERAGE_KIND_META[kind].icon"
            class="blr-coverage-inside size-3.5 shrink-0"
            :class="COVERAGE_KIND_META[kind].tone"
            :data-coverage-kind-inside="kind"
          />
        </span>
        <span class="text-xs">{{ below.length }} inside</span>
      </button>
    </div>

    <ul v-if="here.length && reading" class="space-y-3 py-1" :style="{ paddingInlineStart: `calc(${indent} + 2.5rem)` }">
      <li v-for="(statement, index) in here" :key="index" class="border-s-2 border-default ps-3">
        <BlrCoverageStatement :statement="statement" :here="node.value" />
      </li>
    </ul>

    <ul v-if="open && node.children.length" class="min-w-0">
      <BlrCoverageLocation
        v-for="child in node.children"
        :key="child.value"
        :node="child"
        :statements-at="statementsAt"
        :expanded="expanded"
        :focused="focused"
        :depth="depth + 1"
        @toggle="emit('toggle', $event)"
        @focus="emit('focus', $event)"
      />
    </ul>
  </li>
</template>

<style scoped>
.blr-coverage-mark {
  color: var(--coverage-accent);
}

/* Faded: recorded below, not here. */
.blr-coverage-inside {
  color: color-mix(in oklab, var(--coverage-accent) 50%, transparent);
}
</style>
