<script setup lang="ts">
import type { TreeItem } from '@nuxt/ui'
import { resourceReviewKey, reviewRows } from '../utils/resourceReview'
import { reviewChangeMeta } from '../utils/reviewModel'
import type { ReportReference } from 'businesslens/report'
import { referenceNavigationKey, referenceStateKey, withReferenceState, referenceHref as unscopedReferenceHref, referenceFileHref, isExternalReference as isExternal } from '../utils/referenceNavigation'

const props = withDefaults(defineProps<{
  references: ReportReference[]
  previous?: ReportReference[]
  /** Isolates expansion by report and the resource that owns the attachments. */
  scope: string
  label?: string
}>(), { label: 'References' })

const KIND_LABEL: Record<ReportReference['kind'], string> = {
  code: 'Code', visual: 'Visuals', doc: 'Documentation',
  prd: 'Product requirements', spec: 'Specifications', proposal: 'Proposals',
  adr: 'Architecture decisions', research: 'Research'
}
/** Role describes why material is attached, never a verification result. */
const ROLE_TONE: Record<string, 'primary' | 'neutral' | 'secondary'> = {
  intent: 'primary', implementation: 'secondary', context: 'neutral'
}
const review = inject(resourceReviewKey, computed(() => null))
const compared = computed(() => reviewRows(props.previous, props.references, !!review.value && props.previous !== undefined, item => item, item => `${item.kind}:${item.target}`))
const referenceChanges = computed(() => new Map(compared.value.map(row => [(row.after ?? row.before)!, row])))
const visibleReferences = computed(() => compared.value.map(row => (row.after ?? row.before)!))
const referenceState = (reference: ReportReference) => referenceChanges.value.get(reference)?.change === 'deleted' ? review.value?.before?.state ?? state.value : state.value
const navigation = inject(referenceNavigationKey, null)
const state = inject(referenceStateKey, ref('working'))
const localHref = (reference: ReportReference) => withReferenceState(referenceFileHref(reference.target), referenceState(reference))
const referenceHref = (reference: ReportReference) => withReferenceState(unscopedReferenceHref(reference), referenceState(reference))
const isLocalImage = (reference: ReportReference) => !isExternal(reference.target)
  && reference.kind !== 'code' && /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(reference.target.split(/[?#]/)[0] ?? '')
const hrefFor = (reference: ReportReference) => isExternal(reference.target)
  ? reference.target : navigation?.href(referenceHref(reference)) ?? referenceHref(reference)
function follow(event: MouseEvent, reference: ReportReference) {
  event.stopPropagation()
  if (!navigation || isExternal(reference.target) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigation.open(referenceHref(reference))
}

interface Node extends TreeItem {
  value: string
  label: string
  kind: ReportReference['kind']
  reference?: ReportReference
  referenceIndex?: number
  count?: number
  preview?: boolean
  children?: Node[]
}
const items = computed<Node[]>(() => Object.entries(KIND_LABEL).flatMap(([kind, label]) => {
  const children = visibleReferences.value.flatMap((reference, index): Node[] => {
    if (reference.kind !== kind) return []
    const value = JSON.stringify([reference.kind, reference.target, reference.role, reference.state, index])
    return [{ value, kind: reference.kind, label: isExternal(reference.target) ? reference.title || reference.target : reference.target, reference, referenceIndex: index,
      children: isLocalImage(reference)
        ? [{ value: `${value}:preview`, kind: reference.kind, label: `Preview: ${reference.title || reference.target}`, reference, preview: true }]
        : undefined }]
  })
  return children.length ? [{ value: kind, kind: kind as ReportReference['kind'], label, count: children.length, children }] : []
}))
const branchKeys = computed(() => items.value.flatMap(group => [group.value, ...group.children!.filter(item => item.children).map(item => item.value)]))
const expanded = useBlrReferenceExpansion(computed(() => props.scope), branchKeys, computed(() => items.value.map(item => item.value)))

const select = (event: Event, item: Node) => {
  event.preventDefault()
  if (item.children?.length) {
    expanded.value = expanded.value.includes(item.value)
      ? expanded.value.filter(value => value !== item.value) : [...expanded.value, item.value]
  } else {
    // Row clicks and Enter/Space follow the same native link as its label.
    // Label clicks stop propagation, preserving new-tab and copy-link actions.
    (event.currentTarget as HTMLElement | null)?.querySelector<HTMLAnchorElement>('a')?.click()
  }
}
</script>

<template>
  <div v-if="visibleReferences.length" class="min-w-0 space-y-2">
    <p v-if="label" class="blr-field flex items-center gap-2">
      <BlrReferenceIcon class="size-3.5" />{{ label }} · {{ visibleReferences.length }}
    </p>
    <div class="min-w-0 rounded-xl border border-default bg-elevated/20 px-3 py-2">
      <UTree
        v-model:expanded="expanded"
        :items="items"
        :get-key="(item: Node) => item.value"
        :as="{ link: 'div' }"
        :aria-label="label || 'References'"
        color="neutral"
        size="md"
        :ui="{
          link: 'min-w-0 items-start gap-2 rounded-md bg-transparent transition hover:bg-elevated/40 hover:before:bg-transparent'
        }"
        @select="select"
        @toggle="event => { if (event.detail.originalEvent.type === 'click') event.preventDefault() }"
      >
        <template #item="{ item, expanded: open, handleToggle }">
          <template v-if="!item.preview">
            <button
              v-if="item.children?.length"
              type="button"
              class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :aria-label="`${open ? 'Collapse' : 'Expand'} ${item.label}`"
              :aria-expanded="open"
              @click.stop="handleToggle()"
              @keydown.stop
            >
              <UIcon name="i-lucide-chevron-right" class="size-3.5 text-dimmed transition-transform" :class="open && 'rotate-90'" />
            </button>
            <BlrReferenceIcon :kind="item.kind" class="mt-0.5 size-3.5" />

            <span v-if="!item.reference" class="min-w-0 flex-1 cursor-pointer font-semibold text-highlighted">{{ item.label }}</span>
            <span v-else class="flex min-w-0 flex-1 select-text flex-wrap items-center gap-x-2 gap-y-1" :data-reference-target="item.reference.target">
              <component
                :is="!item.children && hrefFor(item.reference) ? 'a' : 'span'"
                :href="!item.children ? hrefFor(item.reference) : undefined"
                :target="isExternal(item.reference.target) ? '_blank' : undefined"
                :aria-description="isExternal(item.reference.target) ? 'Opens in a new tab' : 'Opens in this report'"
                rel="noopener noreferrer"
                class="min-w-0 text-default [overflow-wrap:anywhere]"
                :class="item.children ? 'cursor-pointer' : hrefFor(item.reference) && 'hover:text-primary hover:underline'"
                :title="item.reference.target"
                @click="(event: MouseEvent) => { if (!item.children) follow(event, item.reference!) }"
                @keydown="(event: KeyboardEvent) => { if (!item.children) event.stopPropagation() }"
              >
                <span data-reference-label>{{ item.label }}</span>
                <template v-if="!isExternal(item.reference.target) && item.reference.title && item.reference.title !== item.reference.target">
                  <span aria-hidden="true" class="text-dimmed"> · </span><span class="text-muted" data-reference-title>{{ item.reference.title }}</span>
                </template>
                <UIcon v-if="isExternal(item.reference.target)" name="i-lucide-external-link" class="ms-1 inline-block size-3 align-baseline text-dimmed" aria-hidden="true" data-external-reference />
              </component>
              <UBadge v-if="item.reference.state" color="neutral" variant="outline" size="sm" :title="`Depicts the ${item.reference.state} product state`">{{ item.reference.state }}</UBadge>
              <UBadge :color="ROLE_TONE[item.reference.role] || 'neutral'" variant="subtle" size="sm">{{ item.reference.role }}</UBadge>
              <span
                v-if="isExternal(item.reference.target) && item.reference.title && item.reference.title !== item.reference.target"
                class="blr-meta w-full min-w-0 [overflow-wrap:anywhere]"
                data-reference-location
              >{{ item.reference.target }}</span>
              <span v-if="referenceChanges.get(item.reference)?.change" class="blr-matrix-tone rounded border px-1.5 py-0.5 text-xs" :data-tone="reviewChangeMeta[referenceChanges.get(item.reference)!.change!].tone" :data-inline-change="referenceChanges.get(item.reference)!.change">{{ referenceChanges.get(item.reference)!.change === 'deleted' ? 'Removed' : reviewChangeMeta[referenceChanges.get(item.reference)!.change!].label }}</span>
              <span v-if="referenceChanges.get(item.reference)?.change === 'modified'" class="w-full text-xs text-muted">Previously: {{ referenceChanges.get(item.reference)?.before?.title || item.reference.target }} · {{ referenceChanges.get(item.reference)?.before?.role }}<template v-if="referenceChanges.get(item.reference)?.before?.state"> · {{ referenceChanges.get(item.reference)?.before?.state }}</template></span>
              <slot name="reference-owner" :index="item.referenceIndex!" :reference="item.reference" />
            </span>

            <span v-if="item.count !== undefined" class="blr-meta">{{ item.count }}</span>
          </template>
          <div v-else class="min-w-0 flex-1 rounded-md py-1" data-reference-preview>
            <a :href="hrefFor(item.reference!)" class="block w-fit max-w-full" @click="follow($event, item.reference!)" @keydown.stop>
              <img :src="localHref(item.reference!)" :alt="item.reference!.title || item.reference!.target" loading="lazy" class="max-h-96 w-auto max-w-full rounded border border-default">
            </a>
          </div>
        </template>
      </UTree>
    </div>
  </div>
</template>
