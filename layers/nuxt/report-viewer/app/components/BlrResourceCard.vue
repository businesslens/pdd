<script setup lang="ts">
/**
 * One resource, one row.
 *
 * The surface is already named after the kind, so the row never repeats it in
 * words — the coloured icon carries it. The slot that word occupied now holds
 * the fact that tells this resource from its neighbours: a Screen's context, a
 * Scenario's parent, an Experience's Interface. Without it a collection of
 * counterparts reads as a list of duplicates.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, resolveResource } from '../utils/reportWorkspace'
import type { ResourceCardMetric } from '../utils/resourceCards'
import { resourceCardPresentation } from '../utils/resourceCards'
import { slotColor } from '../utils/reportPalette'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
  active?: boolean
  /** False inside a group whose header already states what the badge would. */
  badge?: boolean
}>(), { badge: true })

const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const presentation = computed(() => resourceCardPresentation(props.workspace, props.resource))
const kindLabel = computed(() => ENTITY_KIND_META[props.resource.kind].label)
const interfaceType = computed(() => props.resource.kind === 'interface' ? props.resource.interfaceType : undefined)
const actorKind = computed(() => props.resource.kind === 'actor' ? props.resource.actorKind : undefined)
const actorRelationship = computed(() => props.resource.kind === 'actor' ? props.resource.relationship : undefined)
const colorMode = useColorMode()
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

function metricColor(metric: ResourceCardMetric): string | undefined {
  if (!metric.kind) return undefined
  return slotColor(ENTITY_KIND_META[metric.kind].slot, mounted.value && colorMode.value === 'dark')
}

function metricTitle(metric: ResourceCardMetric, id: string): string {
  return metric.kind ? resolveResource(props.workspace, metric.kind, id)?.title ?? id : id
}

function metricInterfaceType(metric: ResourceCardMetric, id: string) {
  if (metric.kind !== 'interface') return undefined
  const resource = resolveResource(props.workspace, 'interface', id)
  return resource?.kind === 'interface' ? resource.interfaceType : undefined
}

function metricActor(metric: ResourceCardMetric, id: string) {
  if (metric.kind !== 'actor') return undefined
  const resource = resolveResource(props.workspace, 'actor', id)
  return resource?.kind === 'actor' ? resource : undefined
}
</script>

<template>
  <button
    type="button"
    class="blr-resource-row group relative flex w-full items-center gap-4 overflow-hidden rounded-[0.625rem] border bg-default px-4 py-3 text-start transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    :class="active ? 'border-primary bg-primary/5' : 'border-default hover:border-accented hover:bg-elevated/40'"
    :aria-label="`Open ${kindLabel} ${resource.title}`"
    @click="emit('open', resource)"
  >
    <span class="flex min-w-0 flex-1 items-start gap-3">
      <BlrKind
        :kind="resource.kind"
        :interface-type="interfaceType"
        :actor-kind="actorKind"
        :actor-relationship="actorRelationship"
        :labelled="false"
        class="mt-0.5"
      />
      <span class="min-w-0 flex-1">
        <span class="flex min-w-0 items-center gap-2">
          <span class="truncate text-[15px] font-semibold tracking-tight text-highlighted">{{ resource.title }}</span>
          <UBadge
            v-if="badge && presentation.badge"
            color="neutral"
            variant="subtle"
            size="sm"
            class="max-w-40 shrink-0 truncate"
          >
            {{ presentation.badge }}
          </UBadge>
        </span>
        <span v-if="resource.lead" class="mt-0.5 block truncate text-sm leading-5 text-default">{{ resource.lead }}</span>
        <!-- The discriminating fact. Absent rather than empty when there is none. -->
        <span v-if="presentation.hook" class="mt-1 flex min-w-0 items-baseline gap-1.5">
          <span class="shrink-0 text-xs text-dimmed">{{ presentation.hookLabel }}</span>
          <span class="truncate text-xs font-medium text-muted">{{ presentation.hook }}</span>
        </span>
      </span>
    </span>

    <span class="hidden shrink-0 items-center gap-4 lg:flex">
      <UTooltip
        v-for="metric in presentation.metrics"
        :key="metric.label"
        :delay-duration="150"
        :disabled="!metric.kind"
        :ui="{ content: 'h-auto max-w-xl items-start px-3 py-3' }"
      >
        <span class="min-w-16 text-end">
          <span class="font-mono text-xs font-medium text-highlighted tabular-nums">{{ metric.value }}</span>
          <span class="ms-1 text-xs text-muted">{{ metric.label }}</span>
        </span>
        <template #content>
          <span class="block w-max max-w-[34rem] space-y-2">
            <span v-if="metric.kind" class="flex items-center gap-2 text-xs font-medium text-muted">
              <UIcon
                :name="ENTITY_KIND_META[metric.kind].icon"
                class="size-3.5 shrink-0"
                :style="{ color: metricColor(metric) }"
              />
              <span>{{ ENTITY_KIND_META[metric.kind].plural }}</span>
              <span class="font-mono text-dimmed tabular-nums">{{ metric.value }}</span>
            </span>
            <span v-if="metric.ids?.length" class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="id in metric.ids"
                :key="id"
                color="neutral"
                variant="outline"
                size="lg"
                :ui="{ base: 'max-w-80 gap-1.5 px-2.5 py-1.5 font-normal', label: 'truncate' }"
              >
                <template #leading>
                  <BlrInterfaceType
                    v-if="metric.kind === 'interface' && metricInterfaceType(metric, id)"
                    :type="metricInterfaceType(metric, id)!"
                    size="xs"
                  />
                  <BlrActorType
                    v-else-if="metricActor(metric, id)"
                    :actor-kind="metricActor(metric, id)!.actorKind"
                    :relationship="metricActor(metric, id)!.relationship"
                    size="xs"
                  />
                  <UIcon
                    v-else-if="metric.kind"
                    :name="ENTITY_KIND_META[metric.kind].icon"
                    class="size-3.5 shrink-0"
                    :style="{ color: metricColor(metric) }"
                  />
                </template>
                {{ metricTitle(metric, id) }}
              </UBadge>
            </span>
            <span v-else-if="metric.kind" class="block text-xs text-dimmed">
              No {{ ENTITY_KIND_META[metric.kind].plural.toLowerCase() }}
            </span>
          </span>
        </template>
      </UTooltip>
    </span>

    <UIcon
      name="i-lucide-chevron-right"
      class="size-4 shrink-0 text-dimmed transition group-hover:translate-x-0.5 group-hover:text-default"
    />
  </button>
</template>
