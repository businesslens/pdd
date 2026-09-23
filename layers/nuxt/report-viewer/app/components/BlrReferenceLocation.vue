<script setup lang="ts">
/**
 * One referenced location — a repository path or an external page — with the
 * citations that point at it kept behind its own disclosure.
 *
 * A row carries the icon of each kind of material cited at that exact
 * location, beside how many citations that is. A closed folder or site also
 * says what opening it would find, faded: that is navigation, never the
 * folder's own meaning, so it disappears when the folder opens. Opening a
 * folder reveals the locations inside it and nothing else.
 */
import type { RepositoryTreeNode } from '../utils/repositoryTree'
import type { ReportWorkspace } from '../utils/reportWorkspace'
import type { ReferenceCitation } from '../utils/referenceCatalog'
import { REFERENCE_KIND_LABEL, REFERENCE_KIND_ORDER } from '../utils/referenceCatalog'
import { repositoryModelKind } from '../utils/repositoryTree'
import { ENTITY_KIND_META, entityFacetOf, resolveResourceKey } from '../utils/reportWorkspace'
import { referenceNavigationKey, referenceHref, isExternalReference as isExternal } from '../utils/referenceNavigation'
import { slotColor } from '../utils/reportPalette'

const props = defineProps<{
  node: RepositoryTreeNode
  workspace: ReportWorkspace
  citationsAt: (location: string) => ReferenceCitation[]
  /** Open folders and open citation lists, the latter keyed `citations:<location>`. */
  expanded: string[]
  depth: number
}>()
const emit = defineEmits<{ toggle: [key: string], selectKey: [key: string, tab: string] }>()

/** Sites and repositories group external pages; nothing is cited at them directly. */
const isGroup = (value: string) => value.startsWith('site:') || value.startsWith('repo:')
const site = computed(() => props.node.value.startsWith('site:'))
const repository = computed(() => props.node.value.startsWith('repo:'))
const group = computed(() => isGroup(props.node.value))
const open = computed(() => props.expanded.includes(props.node.value))
const here = computed(() => group.value ? [] : props.citationsAt(props.node.value))
const reading = computed(() => props.expanded.includes(`citations:${props.node.value}`))
const kindsOf = (citations: ReferenceCitation[]) => {
  const present = new Set(citations.map(citation => citation.reference.kind))
  return REFERENCE_KIND_ORDER.filter(kind => present.has(kind))
}
const kinds = computed(() => kindsOf(here.value))
const collect = (node: RepositoryTreeNode): ReferenceCitation[] =>
  [...(isGroup(node.value) ? [] : props.citationsAt(node.value)), ...node.children.flatMap(collect)]
/** Citations anywhere below — what opening this folder or site finds. */
const below = computed(() => props.node.children.length ? [...new Set(props.node.children.flatMap(collect))] : [])
const kindsBelow = computed(() => kindsOf(below.value))
const model = computed(() => {
  const kind = group.value ? null : repositoryModelKind(props.node)
  return kind ? ENTITY_KIND_META[kind] : null
})
const colorMode = useColorMode()
const modelLogo = computed(() => `/brand/logo/mark${colorMode.value === 'dark' ? '-dark' : ''}.svg`)
const label = computed(() => props.node.label + (props.node.directory && !group.value ? '/' : ''))
const indent = computed(() => `${props.depth * 1.15}rem`)
const external = computed(() => group.value || isExternal(props.node.value))

function read() {
  if (here.value.length) emit('toggle', `citations:${props.node.value}`)
}
/** The label is a pointer target for the row's one control, never a second tab stop. */
function select() {
  if (here.value.length) read()
  else if (props.node.children.length) emit('toggle', props.node.value)
}

const navigation = inject(referenceNavigationKey, null)
const hrefFor = (citation: ReferenceCitation) => isExternal(citation.reference.target)
  ? citation.reference.target
  : navigation?.href(referenceHref(citation.reference)) ?? referenceHref(citation.reference)
function follow(event: MouseEvent, citation: ReferenceCitation) {
  if (!navigation || isExternal(citation.reference.target) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigation.open(referenceHref(citation.reference))
}
/** The whole location is opened from its row; a citation links only to what it points at within it. */
const whole = computed(() => here.value.find(citation => !citation.anchor))
/** A title every citation shares describes the location, so it is written once, beside it. */
const sharedTitle = computed(() => {
  const titles = new Set(here.value.map(citation => citation.reference.title ?? ''))
  const [title] = titles
  return titles.size === 1 && title && title !== props.node.label ? title : ''
})
/**
 * Citations under each distinct title they give this location, in first-cited
 * order, so a title many resources share is written once above them. A shared
 * or absent title needs no heading.
 */
const titleGroups = computed(() => {
  const groups = new Map<string, ReferenceCitation[]>()
  for (const citation of here.value) {
    const title = sharedTitle.value || citation.reference.title === props.node.label ? '' : citation.reference.title ?? ''
    groups.set(title, [...groups.get(title) ?? [], citation])
  }
  return [...groups].map(([title, citations]) => ({ title, citations }))
})
function ownerEntity(citation: ReferenceCitation) {
  if (!citation.ownerKey) return undefined
  const resource = resolveResourceKey(props.workspace, citation.ownerKey)
  return resource?.kind === 'entity' ? resource : undefined
}
/** Role describes why material is attached, never a verification result. */
const ROLE_TONE: Record<string, 'primary' | 'neutral' | 'secondary'> = {
  intent: 'primary', implementation: 'secondary', context: 'neutral'
}
</script>

<template>
  <li class="min-w-0">
    <div
      class="flex min-w-0 items-center gap-2 rounded-md py-1 pe-2 transition-colors"
      :class="here.length ? 'hover:bg-elevated/40' : ''"
      :style="{ paddingInlineStart: indent }"
    >
      <button
        v-if="node.children.length"
        type="button"
        class="flex size-4 shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="`${open ? 'Collapse' : 'Expand'} ${node.label}`"
        :aria-expanded="open"
        @click="emit('toggle', node.value)"
      >
        <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0 text-dimmed transition-transform" :class="open && 'rotate-90'" />
      </button>
      <span v-else class="size-4 shrink-0" />
      <UIcon v-if="site" name="i-lucide-globe" class="size-4 shrink-0 text-muted" />
      <UIcon v-else-if="repository" name="i-lucide-folder-git-2" class="size-4 shrink-0 text-muted" />
      <img
        v-else-if="node.directory && node.value.split('/').at(-1) === '.businesslens'"
        :src="modelLogo"
        alt=""
        title="BusinessLens Product Model"
        class="size-4 shrink-0 object-contain"
      >
      <UIcon
        v-else-if="model"
        :name="model.icon"
        :title="model.label"
        :style="{ color: slotColor(model.slot, colorMode.value === 'dark') }"
        class="size-4 shrink-0"
      />
      <UIcon
        v-else
        :name="external ? 'i-lucide-link' : node.directory ? open && node.children.length ? 'i-lucide-folder-open' : 'i-lucide-folder' : 'i-lucide-file'"
        class="size-4 shrink-0 text-muted"
      />
      <span
        class="min-w-0 truncate text-start text-sm"
        :class="[external && !repository ? '' : 'font-mono', here.length || node.children.length ? 'cursor-pointer' : '', here.length ? 'text-default' : 'text-dimmed', reading && 'font-semibold']"
        :title="external && !group ? node.value : undefined"
        :data-reference-path="node.value"
        @click="select"
      >{{ label }}<span v-if="sharedTitle" class="font-sans text-muted" data-reference-shared-title><span aria-hidden="true" class="text-dimmed"> · </span>{{ sharedTitle }}</span></span>
      <!-- The kind icons, the count and the chevron are the row's one control. -->
      <button
        v-if="here.length"
        type="button"
        class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 text-muted transition-colors hover:bg-elevated/60 hover:text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="`${reading ? 'Hide' : 'Read'} ${here.length} ${here.length === 1 ? 'citation' : 'citations'} of ${node.label}`"
        :aria-expanded="reading"
        data-reference-reveal
        @click="read"
      >
        <span class="flex shrink-0 items-center gap-1">
          <BlrReferenceIcon
            v-for="kind in kinds"
            :key="kind"
            :kind="kind"
            class="size-3.5 text-muted"
            :title="REFERENCE_KIND_LABEL[kind]"
            :data-reference-kind="kind"
          />
        </span>
        <!-- Counts where the set is many: one icon already says there is one. -->
        <span v-if="here.length > 1" class="blr-meta">{{ here.length }}</span>
        <UIcon name="i-lucide-chevron-down" class="size-3.5 shrink-0 transition-transform" :class="reading && 'rotate-180'" />
      </button>
      <a
        v-if="whole"
        :href="hrefFor(whole)"
        :target="external ? '_blank' : undefined"
        rel="noopener noreferrer"
        class="flex size-6 shrink-0 items-center justify-center rounded-md text-dimmed transition-colors hover:bg-elevated/60 hover:text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="`Open ${node.label}`"
        :aria-description="external ? 'Opens in a new tab' : 'Opens in this report'"
        :title="external ? 'Open in a new tab' : 'Open in this report'"
        data-reference-open-location
        @click="follow($event, whole)"
      >
        <UIcon :name="external ? 'i-lucide-external-link' : 'i-lucide-eye'" class="size-3.5" :data-external-reference="external ? '' : undefined" />
      </a>
      <!-- Only while closed: what opening this folder would find, never its own meaning. -->
      <button
        v-if="!open && below.length"
        type="button"
        class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 text-dimmed transition-colors hover:bg-elevated/60 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="`Expand ${node.label} to read ${below.length} ${below.length === 1 ? 'citation' : 'citations'} inside it`"
        data-reference-inside
        @click="emit('toggle', node.value)"
      >
        <span class="flex items-center gap-1 opacity-60">
          <BlrReferenceIcon v-for="kind in kindsBelow" :key="kind" :kind="kind" class="size-3.5" :data-reference-kind-inside="kind" />
        </span>
        <span class="text-xs">{{ below.length }} inside</span>
      </button>
    </div>

    <div v-if="here.length && reading" class="space-y-2 py-1" :style="{ paddingInlineStart: `calc(${indent} + 2.5rem)` }">
      <div v-for="group in titleGroups" :key="group.title" class="min-w-0 space-y-1 border-s-2 border-default ps-3">
        <p v-if="group.title" class="text-xs text-muted [overflow-wrap:anywhere]" data-reference-title>{{ group.title }}</p>
        <ul class="space-y-1">
          <li
            v-for="citation in group.citations"
            :key="citation.index"
            class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm"
            :data-reference-target="citation.reference.target"
          >
            <BlrKind
              :kind="citation.ownerKind"
              :facet="entityFacetOf(ownerEntity(citation))"
              :acts="ownerEntity(citation)?.acts"
              :labelled="false"
              size="xs"
            />
            <BlrResourceLink
              v-if="citation.ownerKey"
              :resource-key="citation.ownerKey"
              tab="references"
              class="min-w-0 text-default hover:text-primary hover:underline [overflow-wrap:anywhere]"
              @open="emit('selectKey', citation.ownerKey, 'references')"
            >
              {{ citation.ownerTitle }}
            </BlrResourceLink>
            <span v-else class="text-default">{{ citation.ownerTitle }}</span>
            <UBadge :color="ROLE_TONE[citation.reference.role] || 'neutral'" variant="subtle" size="sm">{{ citation.reference.role }}</UBadge>
            <UBadge v-if="citation.reference.state" color="neutral" variant="outline" size="sm" :title="`Depicts the ${citation.reference.state} product state`">{{ citation.reference.state }}</UBadge>
            <a
              v-if="citation.anchor"
              :href="hrefFor(citation)"
              :target="isExternal(citation.reference.target) ? '_blank' : undefined"
              :aria-description="isExternal(citation.reference.target) ? 'Opens in a new tab' : 'Opens in this report'"
              rel="noopener noreferrer"
              class="inline-flex min-w-0 items-center gap-1 font-mono text-xs text-muted hover:text-primary hover:underline [overflow-wrap:anywhere]"
              :title="citation.reference.target"
              data-reference-open
              @click="follow($event, citation)"
            >
              <BlrReferenceIcon :kind="citation.reference.kind" class="size-3.5" />
              {{ citation.anchor }}
              <UIcon v-if="isExternal(citation.reference.target)" name="i-lucide-external-link" class="size-3 text-dimmed" aria-hidden="true" data-external-reference />
            </a>
          </li>
        </ul>
      </div>
    </div>

    <ul v-if="open && node.children.length" class="min-w-0">
      <BlrReferenceLocation
        v-for="child in node.children"
        :key="child.value"
        :node="child"
        :workspace="workspace"
        :citations-at="citationsAt"
        :expanded="expanded"
        :depth="depth + 1"
        @toggle="emit('toggle', $event)"
        @select-key="(key, tab) => emit('selectKey', key, tab)"
      />
    </ul>
  </li>
</template>
