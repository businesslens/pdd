<script setup lang="ts">
/**
 * One block of a page, rendered by id.
 *
 * A switchboard, so the layouts contain arrangement and nothing else. If a
 * layout had to know how to draw a Screen's Product states, changing that
 * drawing would mean changing it five times and the options would slowly stop
 * being comparable.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META, counterpartsOf } from '../utils/model'
import type { PageBlockId } from '../utils/pageSections'
import { entityFacts } from '../utils/entityFacts'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  id: PageBlockId
  /** Draw a heading above the block; layouts that head their own suppress it. */
  heading?: boolean
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
}>()

const meta = computed(() => ENTITY_KIND_META[props.entity.kind])
const contexts = computed(() => 'contexts' in props.entity ? props.entity.contexts : [])
const entryPoints = computed(() => 'entryPoints' in props.entity ? props.entity.entryPoints : [])
const counterparts = computed(() => counterpartsOf(props.workspace, props.entity))
const facts = computed(() => entityFacts(props.workspace, props.entity).filter(fact => fact.value))
</script>

<template>
  <BlrProse v-if="id === 'lead' && entity.lead" :text="entity.lead" size="base" class="max-w-3xl" />

  <dl v-else-if="id === 'facts' && facts.length" class="flex flex-wrap gap-x-8 gap-y-3">
    <div v-for="fact in facts" :key="fact.label" class="min-w-0">
      <dt class="text-xs text-dimmed">{{ fact.label }}</dt>
      <dd class="mt-0.5 truncate text-sm font-medium text-highlighted">{{ fact.value }}</dd>
    </div>
  </dl>

  <BlrAvail
    v-else-if="id === 'access' && (contexts.length || entryPoints.length)"
    :contexts="contexts"
    :entry-points="entryPoints"
  />

  <BlrEntityBody
    v-else-if="id === 'detail'"
    :workspace="workspace"
    :entity="entity"
    @select="emit('select', $event)"
  />

  <div v-else-if="id === 'counterparts' && counterparts.length" class="space-y-2">
    <p v-if="heading" class="blr-block-heading">
      Also on
      <span class="ms-2 font-normal text-dimmed">
        the same {{ meta.label.toLowerCase() }} on another Interface
      </span>
    </p>
    <BlrEntityCard
      v-for="counterpart in counterparts"
      :key="counterpart.key"
      :workspace="workspace"
      :entity="counterpart"
      @open="emit('open', $event)"
    />
  </div>

  <div v-else-if="id === 'connections'" class="space-y-2.5">
    <p v-if="heading" class="blr-block-heading">Connections</p>
    <BlrConnections :workspace="workspace" :entity="entity" @select="emit('open', $event)" />
  </div>

  <div v-else-if="id === 'supporting' && entity.supportingContent" class="space-y-2">
    <p v-if="heading" class="blr-block-heading">Supporting context</p>
    <BlrProse :text="entity.supportingContent" class="max-w-3xl" />
  </div>

  <BlrRefs v-else-if="id === 'references'" :references="entity.references" variant="list" />
</template>

<style scoped>
.blr-block-heading {
  font-size: var(--text-sm);
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--ui-text-highlighted);
}
</style>
