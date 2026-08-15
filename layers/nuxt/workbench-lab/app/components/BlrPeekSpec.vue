<script setup lang="ts">
/**
 * Peek · Spec sheet — one aligned table, and nothing else.
 *
 * The opposite bet from Prose. If the panel is hard to read because the eye has
 * to hunt, the answer might not be fewer objects but a stricter grid: labels in
 * one column, values in another, every row the same height, nothing emphasised.
 *
 * Nothing is styled to draw attention, which is the point and also the risk —
 * a spec sheet has no opinion about what matters.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META, resolveEntity } from '../utils/model'
import { peekBadge, peekFacts, peekRelationsByKind, relationTitles } from '../utils/peekFacts'
import { firstSentence } from '../utils/model'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
}>()

const meta = computed(() => ENTITY_KIND_META[props.entity.kind])
const badge = computed(() => peekBadge(props.workspace, props.entity))
const facts = computed(() => peekFacts(props.workspace, props.entity).filter(fact => fact.value))
const relations = computed(() => peekRelationsByKind(props.entity)
  .map(relation => ({ ...relation, names: relationTitles(props.workspace, relation.kind, relation.ids) })))

function pick(kind: ReportEntityKind, id: string) {
  const entity = resolveEntity(props.workspace, kind, id)
  if (entity) emit('select', entity)
}
</script>

<template>
  <div class="flex min-h-full flex-col gap-4">
    <dl class="blr-spec">
      <div class="blr-spec-row">
        <dt>Kind</dt>
        <dd>{{ meta.label }}<span v-if="badge" class="text-muted"> · {{ badge }}</span></dd>
      </div>
      <div class="blr-spec-row">
        <dt>Id</dt>
        <dd><code class="font-mono text-[11px] text-muted">{{ entity.id }}</code></dd>
      </div>
      <div v-if="entity.lead" class="blr-spec-row">
        <dt>Summary</dt>
        <dd class="text-default">{{ firstSentence(entity.lead, 160) }}</dd>
      </div>
      <div v-for="fact in facts" :key="fact.label" class="blr-spec-row">
        <dt>{{ fact.label }}</dt>
        <dd>{{ fact.value }}</dd>
      </div>

      <div v-for="relation in relations" :key="relation.kind" class="blr-spec-row">
        <dt class="flex items-center gap-1.5">
          <BlrKind :kind="relation.kind" :labelled="false" size="xs" />
          {{ relation.label }}
          <span class="ms-auto font-mono text-[11px] text-dimmed">{{ relation.ids.length }}</span>
        </dt>
        <dd>
          <template v-for="(name, index) in relation.names" :key="name.id">
            <span v-if="index" class="text-dimmed">, </span>
            <button
              type="button"
              class="rounded-sm text-default hover:text-primary hover:underline hover:underline-offset-3"
              @click="pick(relation.kind, name.id)"
            >{{ name.title }}</button>
          </template>
        </dd>
      </div>
    </dl>

    <UButton
      class="mt-auto shrink-0"
      color="primary"
      variant="solid"
      size="md"
      block
      trailing-icon="i-lucide-arrow-right"
      :label="`Open ${meta.label} page`"
      @click="emit('open', entity)"
    />
  </div>
</template>

<style scoped>
.blr-spec {
  border-top: 1px solid var(--ui-border);
}

.blr-spec-row {
  display: grid;
  grid-template-columns: 9.5rem 1fr;
  gap: 0.75rem;
  padding: 0.4375rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ui-border) 55%, transparent);
  font-size: 13px;
  line-height: 1.4;
}

.blr-spec-row dt {
  color: var(--ui-text-dimmed);
}

.blr-spec-row dd {
  min-width: 0;
  color: var(--ui-text-highlighted);
}
</style>
