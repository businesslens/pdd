<script setup lang="ts">
/**
 * Peek · Map — the entity and one hop, drawn.
 *
 * A relation list tells you *what* an entity touches. It does not tell you the
 * direction: which things reach into this entity and which it reaches out to.
 * That distinction is authored in the model and thrown away by a flat chip list.
 *
 * So this draws it: the entity in the middle, what reaches it on the left, what
 * it reaches on the right. No graph library — at panel width a hand-laid column
 * pair is both legible and cheap, where a force layout would be neither.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META, resolveEntity, slotColor } from '../utils/model'
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
const identity = computed(() => peekFacts(props.workspace, props.entity).find(fact => fact.wide && fact.value))

const colorMode = useColorMode()
const mounted = ref(false)
onMounted(() => { mounted.value = true })

/*
  Which side a kind sits on.

  "Inbound" is what contains, performs, or constrains this entity; "outbound" is
  what it contains, exposes or reaches. The split follows the format's own
  direction of authorship, not alphabetical order.
*/
const INBOUND: Partial<Record<ReportEntityKind, ReportEntityKind[]>> = {
  screen: ['interface', 'experience', 'capability-scenario', 'journey-scenario'],
  capability: ['domain', 'interface', 'experience'],
  'capability-scenario': ['capability', 'actor'],
  'journey-scenario': ['journey', 'actor'],
  journey: ['actor', 'interface', 'experience'],
  experience: ['interface', 'actor'],
  interface: ['actor'],
  domain: [],
  actor: [],
  rule: []
}

const sides = computed(() => {
  const inboundKinds = new Set(INBOUND[props.entity.kind] ?? [])
  const relations = peekRelationsByKind(props.entity).map(relation => ({
    ...relation,
    names: relationTitles(props.workspace, relation.kind, relation.ids).slice(0, 3),
    hidden: Math.max(0, relation.ids.length - 3),
    color: slotColor(ENTITY_KIND_META[relation.kind].slot, mounted.value && colorMode.value === 'dark')
  }))
  return {
    inbound: relations.filter(relation => inboundKinds.has(relation.kind)),
    outbound: relations.filter(relation => !inboundKinds.has(relation.kind))
  }
})

function pick(kind: ReportEntityKind, id: string) {
  const entity = resolveEntity(props.workspace, kind, id)
  if (entity) emit('select', entity)
}
</script>

<template>
  <div class="flex min-h-full flex-col gap-4">
    <p v-if="entity.lead" class="line-clamp-2 text-sm leading-5 text-default">{{ entity.lead }}</p>

    <div class="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
      <!-- Reaches in -->
      <div class="space-y-2.5">
        <p class="blr-map-side">Reaches it</p>
        <div v-for="relation in sides.inbound" :key="relation.kind" class="space-y-1">
          <p class="blr-map-kind" :style="{ color: relation.color }">{{ relation.label }}</p>
          <button
            v-for="name in relation.names"
            :key="name.id"
            type="button"
            class="blr-map-node"
            :style="{ '--edge': relation.color }"
            @click="pick(relation.kind, name.id)"
          >
            {{ name.title }}
          </button>
          <p v-if="relation.hidden" class="text-[10px] text-dimmed">+{{ relation.hidden }} more</p>
        </div>
        <p v-if="!sides.inbound.length" class="text-[11px] text-dimmed italic">Nothing reaches in.</p>
      </div>

      <!-- The entity itself, in the middle. -->
      <div class="sticky top-2 flex flex-col items-center gap-1 px-1">
        <div class="blr-map-self">
          <BlrKind :kind="entity.kind" :labelled="false" />
          <span class="mt-1 block max-w-28 text-center text-xs font-semibold leading-4 text-highlighted">
            {{ entity.title }}
          </span>
          <span v-if="badge" class="mt-0.5 block text-center text-[10px] text-muted">{{ badge }}</span>
          <span v-else-if="identity" class="mt-0.5 block max-w-28 truncate text-center text-[10px] text-muted">
            {{ identity.value }}
          </span>
        </div>
      </div>

      <!-- Reaches out -->
      <div class="space-y-2.5">
        <p class="blr-map-side">It reaches</p>
        <div v-for="relation in sides.outbound" :key="relation.kind" class="space-y-1">
          <p class="blr-map-kind" :style="{ color: relation.color }">{{ relation.label }}</p>
          <button
            v-for="name in relation.names"
            :key="name.id"
            type="button"
            class="blr-map-node"
            :style="{ '--edge': relation.color }"
            @click="pick(relation.kind, name.id)"
          >
            {{ name.title }}
          </button>
          <p v-if="relation.hidden" class="text-[10px] text-dimmed">+{{ relation.hidden }} more</p>
        </div>
        <p v-if="!sides.outbound.length" class="text-[11px] text-dimmed italic">It reaches nothing.</p>
      </div>
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

<style scoped>
.blr-map-side {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-map-kind {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.9;
}

.blr-map-node {
  display: block;
  width: 100%;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--ui-border);
  border-inline-start: 2px solid var(--edge);
  border-radius: 0.25rem;
  background: var(--ui-bg-default);
  font-size: 11px;
  line-height: 1.3;
  text-align: start;
  color: var(--ui-text-default);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blr-map-node:hover {
  border-color: var(--ui-border-accented);
  color: var(--ui-text-highlighted);
}

.blr-map-self {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.625rem 0.5rem;
  border: 2px solid var(--ui-border-accented);
  border-radius: 0.5rem;
  background: var(--ui-bg-elevated);
}
</style>
