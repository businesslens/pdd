<script setup lang="ts">
/**
 * Peek · Bars — the shape of an entity before its words.
 *
 * A peek answers "is this the one I meant", and often the answer is not in the
 * prose at all: a Capability with nine Scenarios and four Screens is a
 * different thing from one with a single Scenario, and a list of chips makes
 * you count to find that out.
 *
 * So relations are drawn as bars, scaled against the largest one on the entity.
 * The shape reads in one glance; the names are one click behind it, which keeps
 * the panel short no matter how connected the entity is.
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

const openKind = ref<ReportEntityKind | null>(null)
const colorMode = useColorMode()
const mounted = ref(false)
onMounted(() => { mounted.value = true })

watch(() => props.entity, () => { openKind.value = null })

const bars = computed(() => {
  const relations = peekRelationsByKind(props.entity)
  const largest = Math.max(1, ...relations.map(relation => relation.ids.length))
  return relations.map(relation => ({
    ...relation,
    names: relationTitles(props.workspace, relation.kind, relation.ids),
    /* A floor of 6% so a single relation is still a visible mark, not a sliver. */
    width: Math.max(6, Math.round((relation.ids.length / largest) * 100)),
    color: slotColor(ENTITY_KIND_META[relation.kind].slot, mounted.value && colorMode.value === 'dark')
  }))
})

const total = computed(() => bars.value.reduce((sum, bar) => sum + bar.ids.length, 0))

function pick(kind: ReportEntityKind, id: string) {
  const entity = resolveEntity(props.workspace, kind, id)
  if (entity) emit('select', entity)
}
</script>

<template>
  <div class="flex min-h-full flex-col gap-5">
    <div class="space-y-1.5">
      <p v-if="identity" class="text-sm">
        <span class="text-dimmed">{{ identity.label }}</span>
        <span class="ms-2 font-medium text-highlighted">{{ identity.value }}</span>
      </p>
      <p v-else-if="badge" class="text-sm text-muted">{{ badge }}</p>
      <p v-if="entity.lead" class="line-clamp-3 text-sm leading-5 text-default">{{ entity.lead }}</p>
    </div>

    <div class="space-y-2">
      <p class="blr-bars-label">
        Reaches {{ total }} {{ total === 1 ? 'entity' : 'entities' }} across {{ bars.length }}
        {{ bars.length === 1 ? 'kind' : 'kinds' }}
      </p>

      <div v-for="bar in bars" :key="bar.kind" class="space-y-1">
        <button type="button" class="blr-bar-row" @click="openKind = openKind === bar.kind ? null : bar.kind">
          <span class="flex w-32 shrink-0 items-center gap-1.5">
            <BlrKind :kind="bar.kind" :labelled="false" size="xs" />
            <span class="truncate text-xs text-muted">{{ bar.label }}</span>
          </span>
          <span class="blr-bar-track">
            <span class="blr-bar-fill" :style="{ width: `${bar.width}%`, background: bar.color }" />
          </span>
          <span class="w-6 shrink-0 text-end font-mono text-xs text-highlighted">{{ bar.ids.length }}</span>
        </button>

        <!-- The names stay behind the shape, so the panel length is constant. -->
        <div v-if="openKind === bar.kind" class="flex flex-wrap gap-1.5 ps-32">
          <button
            v-for="name in bar.names"
            :key="name.id"
            type="button"
            class="rounded-md border border-default bg-elevated/40 px-2 py-1 text-xs text-default hover:border-accented hover:text-highlighted"
            @click="pick(bar.kind, name.id)"
          >
            {{ name.title }}
          </button>
        </div>
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
.blr-bars-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-bar-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  padding: 0.1875rem 0;
}

.blr-bar-row:hover .blr-bar-track {
  background: var(--ui-bg-accented);
}

.blr-bar-track {
  position: relative;
  height: 0.625rem;
  flex: 1;
  overflow: hidden;
  border-radius: 9999px;
  background: var(--ui-bg-elevated);
}

.blr-bar-fill {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  border-radius: 9999px;
  opacity: 0.85;
}
</style>
