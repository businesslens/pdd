<script setup lang="ts">
/**
 * One block of a page, rendered by id.
 *
 * The page owns arrangement; this switchboard keeps each authored or derived
 * reading in one implementation.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, counterpartsOf } from '../utils/reportWorkspace'
import { resourceFacts } from '../utils/resourceFacts'
import type { PageBlockId } from '../utils/pageSections'

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

const meta = computed(() => ENTITY_KIND_META[props.resource.kind])
const contexts = computed(() => props.resource.kind === 'capability' ? props.resource.contexts : [])
const entryPoints = computed(() => props.resource.kind === 'journey' ? props.resource.entryPoints : [])
const counterparts = computed(() => counterpartsOf(props.workspace, props.resource))
const facts = computed(() => resourceFacts(props.workspace, props.resource).filter(fact => fact.value))
</script>

<template>
  <BlrProse v-if="id === 'lead' && resource.lead" :text="resource.lead" size="base" class="max-w-3xl" />

  <dl v-else-if="id === 'facts' && facts.length" class="flex flex-wrap gap-x-8 gap-y-3">
    <div v-for="fact in facts" :key="fact.label" class="min-w-0">
      <dt class="text-xs text-dimmed">{{ fact.label }}</dt>
      <dd class="mt-0.5 truncate text-sm font-medium text-highlighted">{{ fact.value }}</dd>
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

  <div v-else-if="id === 'connections'" class="space-y-2.5">
    <p v-if="heading" class="blr-block-heading">Connections</p>
    <BlrConnections :workspace="workspace" :resource="resource" @select="emit('open', $event)" />
  </div>

  <div v-else-if="id === 'supporting' && resource.supportingContent" class="space-y-2">
    <p v-if="heading" class="blr-block-heading">Supporting context</p>
    <BlrProse :text="resource.supportingContent" class="max-w-3xl" />
  </div>

  <BlrRefs v-else-if="id === 'references'" :references="resource.references" variant="list" />
</template>

<style scoped>
.blr-block-heading {
  font-size: var(--text-sm);
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--ui-text-highlighted);
}
</style>
