<script setup lang="ts">
/**
 * What one resource touches.
 *
 * The rows are grouped by the kind on the other end, because that is the
 * question a reader arrives with — "what Screens does this reach" — and not by
 * whether the model authored the link or derived it. That distinction is real
 * and stays visible on the row, but it is a property of the connection, not the
 * heading a reader should have to read past first.
 *
 * A relation label is kept whole rather than merged into its kind: "Journeys
 * via linked Journey Scenarios" and "Journeys via exposed Capabilities" reach
 * the same kind by different derivations, and collapsing them would be exactly
 * the ambiguity the named views exist to avoid.
 */
import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import { resourceConnectionRows } from '../utils/resourceConnections'
import type { RelationRow } from '../utils/resourceConnections'
import { ENTITY_KIND_META, entityFacetOf, resolveResource } from '../utils/reportWorkspace'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
  /** Cap the chips per row; the overflow becomes a count. 0 shows everything. */
  max?: number
  /** Cap the rows themselves, so a peek stays one screen whatever it is on. */
  maxRows?: number
}>(), { max: 0, maxRows: 0 })

const emit = defineEmits<{ select: [resource: AnyResourceView] }>()

const rows = computed(() => resourceConnectionRows(props.workspace, props.resource))

/* Authored rows first when the list is capped: a derived reach is the thing a
   reader is most willing to open a page for. */
const ordered = computed(() => [...rows.value].sort((left, right) =>
  Number(left.derived) - Number(right.derived)))

const shownRows = computed(() => props.maxRows ? ordered.value.slice(0, props.maxRows) : ordered.value)
const directions = computed(() => (['Incoming', 'Outgoing'] as const).map(name => ({ name, rows: shownRows.value.filter(item => item.direction === name) })).filter(group => group.rows.length))
const hiddenRows = computed(() => ordered.value.length - shownRows.value.length)

function shown(item: RelationRow): string[] {
  return props.max ? item.ids.slice(0, props.max) : item.ids
}

function overflow(item: RelationRow): number {
  return props.max ? Math.max(0, item.ids.length - props.max) : 0
}

/*
  Two counterparts reaching the same resource produce two chips with one name.

  "Source list, Source list" reads as a rendering bug rather than as the true
  statement that this Capability is exposed through both Interfaces. The Interface is
  the segment that distinguishes them, and it is added only where the ambiguity
  is actually present — every other chip stays short.
*/
function title(kind: ReportResourceKind, id: string, siblings: string[]): string {
  const resource = resolveResource(props.workspace, kind, id)
  if (!resource) return id
  const shared = siblings.filter((other) => {
    if (other === id) return false
    return resolveResource(props.workspace, kind, other)?.title === resource.title
  })
  if (!shared.length) return resource.title
  const [interfaceId] = resource.id.split('::')
  if (!interfaceId || interfaceId === resource.id) return resource.title
  const owner = resolveResource(props.workspace, 'interface', interfaceId)?.title ?? interfaceId
  return `${resource.title} · ${owner.replace(/ application$/, '')}`
}

function pick(kind: ReportResourceKind, id: string) {
  const resource = resolveResource(props.workspace, kind, id)
  if (resource) emit('select', resource)
}

function interfaceType(kind: ReportResourceKind, id: string) {
  if (kind !== 'interface') return undefined
  const resource = resolveResource(props.workspace, 'interface', id)
  return resource?.kind === 'interface' ? resource.interfaceType : undefined
}

function entityAt(kind: ReportResourceKind, id: string) {
  if (kind !== 'entity') return null
  const resource = resolveResource(props.workspace, 'entity', id)
  return resource?.kind === 'entity' ? resource : null
}
</script>

<template>
  <div v-if="rows.length" class="space-y-3.5">
    <section v-for="group in directions" :key="group.name" class="space-y-3">
    <h3 class="text-xs font-semibold text-muted">{{ group.name }}</h3>
    <div v-for="item in group.rows" :key="`${item.label}:${item.kind}:${item.ids.join(',')}`" class="space-y-1.5">
      <p class="flex items-center gap-2 text-xs font-medium text-muted">
        <UIcon
          :name="ENTITY_KIND_META[item.kind].icon"
          class="size-3.5 shrink-0"
          :style="{ color: `var(--blr-slot-${ENTITY_KIND_META[item.kind].slot})` }"
        />
        {{ item.label }}
        <span v-if="item.ids.length > 1" class="font-mono text-dimmed">{{ item.ids.length }}</span>
        <!-- Provenance rides on the row, not above a wall of them. -->
        <span v-if="item.derived" class="blr-derived" title="Derived from the model, never authored here">derived</span>
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="id in shown(item)"
          :key="id"
          type="button"
          class="blr-connection"
          :class="item.derived && 'blr-connection--derived'"
          @click="pick(item.kind, id)"
        >
          <BlrKind
            :kind="item.kind"
            :interface-type="interfaceType(item.kind, id)"
            :facet="entityFacetOf(entityAt(item.kind, id))"
            :acts="entityAt(item.kind, id)?.acts"
            :labelled="false"
            size="xs"
          />
          <span class="truncate">{{ title(item.kind, id, item.ids) }}</span>
        </button>
        <span v-if="overflow(item)" class="self-center text-xs text-dimmed">+{{ overflow(item) }}</span>
      </div>
    </div>
    </section>
    <!-- Say what was left out. A silent cut reads as "that is all of it". -->
    <p v-if="hiddenRows > 0" class="text-xs text-dimmed">
      {{ hiddenRows }} more {{ hiddenRows === 1 ? 'relation' : 'relations' }} on the page.
    </p>
  </div>
  <p v-else class="text-sm text-muted">No additional connections are modeled.</p>
</template>

<style scoped>
.blr-connection {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3125rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--ui-bg-elevated) 35%, transparent);
  font-size: var(--text-sm);
  color: var(--ui-text-default);
  transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
}

.blr-connection:hover {
  border-color: var(--ui-border-accented);
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

/* Dashed: the model computed this link rather than someone writing it down. */
.blr-connection--derived {
  border-style: dashed;
}

.blr-derived {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}
</style>
