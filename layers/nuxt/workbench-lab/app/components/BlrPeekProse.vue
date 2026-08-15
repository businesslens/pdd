<script setup lang="ts">
/**
 * Peek · Prose — the entity as two sentences.
 *
 * The complaint the peek variations answer is that the panel is hard to read.
 * One cause is that it is not written to be read at all: it is a grid of small
 * objects, and the eye has to assemble the sentence itself.
 *
 * So this one writes the sentence. Facts become a clause, relations become a
 * clause, and the only interactive things are the names — which is also the
 * only thing you would click.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META, resolveEntity } from '../utils/model'
import { peekBadge, peekFacts, peekRelationsByKind, relationTitles } from '../utils/peekFacts'

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

/* The identifying clause: what kind of thing it is, and where it sits. */
const placement = computed(() => {
  const facts = peekFacts(props.workspace, props.entity)
  const wide = facts.find(fact => fact.wide && fact.value)
  if (!wide) return badge.value ? `a ${badge.value} ${meta.value.label}` : `a ${meta.value.label}`
  return `a ${meta.value.label} in ${wide.value}`
})

/* The numeric clause: only facts that are counts, and only non-zero ones. */
const measures = computed(() => peekFacts(props.workspace, props.entity)
  .filter(fact => !fact.wide && /^\d+$/.test(fact.value) && fact.value !== '0')
  .map(fact => `${fact.value} ${fact.value === '1' ? singular(fact.label) : fact.label.toLowerCase()}`))

function singular(label: string): string {
  const lower = label.toLowerCase()
  return lower.endsWith('s') ? lower.slice(0, -1) : lower
}

const relations = computed(() => peekRelationsByKind(props.entity)
  .map(relation => ({
    ...relation,
    names: relationTitles(props.workspace, relation.kind, relation.ids)
  })))

function pick(kind: ReportEntityKind, id: string) {
  const entity = resolveEntity(props.workspace, kind, id)
  if (entity) emit('select', entity)
}
</script>

<template>
  <div class="flex min-h-full flex-col gap-5">
    <p class="text-[15px] leading-6 text-default">
      <span class="font-semibold text-highlighted">{{ entity.title }}</span>
      is {{ placement }}<template v-if="measures.length">, with {{ measures.join(', ') }}</template>.
      <template v-if="entity.lead">{{ entity.lead }}</template>
    </p>

    <code class="w-fit max-w-full truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted">
      {{ entity.id }}
    </code>

    <!-- Relations as sentences too: one line per kind, names inline as links. -->
    <div v-if="relations.length" class="space-y-2.5 border-t border-default pt-4">
      <p v-for="relation in relations" :key="relation.kind" class="text-sm leading-6">
        <span class="me-1.5 inline-flex translate-y-0.5 items-center">
          <BlrKind :kind="relation.kind" :labelled="false" size="xs" />
        </span>
        <span class="text-muted">{{ relation.label }}</span>
        <span class="text-dimmed"> — </span>
        <template v-for="(name, index) in relation.names" :key="name.id">
          <span v-if="index" class="text-dimmed">, </span>
          <button
            type="button"
            class="rounded-sm text-default underline decoration-(--ui-border-accented) underline-offset-3 transition-colors hover:text-highlighted hover:decoration-(--ui-text-dimmed)"
            @click="pick(relation.kind, name.id)"
          >{{ name.title }}</button>
        </template>
      </p>
    </div>

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
