<script setup lang="ts">
import type { AnyEntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, resolveEntity } from '../utils/reportWorkspace'
import type { EntityCardMetric, EntityCardVariant } from '../utils/entityCards'
import { entityCardPresentation } from '../utils/entityCards'
import { slotColor } from '../utils/reportPalette'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  variant: EntityCardVariant
  active?: boolean
}>()

const emit = defineEmits<{ open: [entity: AnyEntityView] }>()
const presentation = computed(() => entityCardPresentation(props.workspace, props.entity))
const kindLabel = computed(() => props.entity.kind === 'rule' ? 'Business rule' : props.entity.kind)
const colorMode = useColorMode()
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

function metricColor(metric: EntityCardMetric): string | undefined {
  if (!metric.kind) return undefined
  return slotColor(ENTITY_KIND_META[metric.kind].slot, mounted.value && colorMode.value === 'dark')
}

function metricTitle(metric: EntityCardMetric, id: string): string {
  return metric.kind ? resolveEntity(props.workspace, metric.kind, id)?.title ?? id : id
}
</script>

<template>
  <button
    type="button"
    class="blr-entity-card group relative w-full overflow-hidden border bg-default text-start transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    :class="[
      `blr-entity-card--${variant}`,
      active ? 'border-primary bg-primary/5' : 'border-default hover:border-accented hover:bg-elevated/40'
    ]"
    :aria-label="`Open ${kindLabel} ${entity.title}`"
    @click="emit('open', entity)"
  >
    <!-- Dense index: identity, one-line description, then the same three facts. -->
    <template v-if="variant === 'index'">
      <span class="flex min-w-0 flex-1 items-center gap-3">
        <BlrKind :kind="entity.kind" :labelled="false" />
        <span class="min-w-0 flex-1">
          <span class="flex min-w-0 items-center gap-2">
            <span class="truncate text-[15px] font-semibold tracking-tight text-highlighted">{{ entity.title }}</span>
            <UBadge v-if="presentation.badge" color="neutral" variant="subtle" size="sm" class="max-w-40 shrink-0 truncate">
              {{ presentation.badge }}
            </UBadge>
          </span>
          <span class="mt-0.5 block truncate text-sm leading-5 text-default">{{ entity.lead }}</span>
        </span>
      </span>
      <span class="hidden shrink-0 items-center gap-4 lg:flex">
        <span v-for="metric in presentation.metrics" :key="metric.label" class="min-w-16 text-end">
          <span class="font-mono text-xs font-medium text-highlighted tabular-nums">{{ metric.value }}</span>
          <span class="ms-1 text-xs text-muted">{{ metric.label }}</span>
        </span>
      </span>
      <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-dimmed transition group-hover:translate-x-0.5 group-hover:text-default" />
    </template>

    <!-- Catalog and Editorial share a recognition-first header. -->
    <template v-else>
      <span class="flex items-center gap-2">
        <BlrKind :kind="entity.kind" />
        <UBadge v-if="presentation.badge" color="neutral" variant="subtle" size="sm" class="ms-auto max-w-48 truncate">
          {{ presentation.badge }}
        </UBadge>
      </span>

      <span class="mt-3 flex min-w-0 items-start gap-3">
        <span class="min-w-0 flex-1">
          <span class="block text-[17px] font-semibold leading-6 tracking-tight text-highlighted">{{ entity.title }}</span>
          <span
            class="mt-1.5 block text-sm leading-5 text-default"
            :class="variant === 'editorial' ? 'line-clamp-3' : 'line-clamp-2'"
          >
            {{ entity.lead }}
          </span>
        </span>
        <UIcon name="i-lucide-chevron-right" class="mt-1 size-4 shrink-0 text-dimmed transition group-hover:translate-x-0.5 group-hover:text-default" />
      </span>

      <span v-if="variant === 'editorial' && presentation.hook" class="mt-4 block border-s-2 border-default ps-3">
        <span class="block text-xs font-medium text-muted">{{ presentation.hookLabel }}</span>
        <span class="mt-0.5 block line-clamp-1 text-sm text-default">{{ presentation.hook }}</span>
      </span>

      <span class="mt-auto block pt-3">
        <span class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-muted pt-3">
          <template v-for="metric in presentation.metrics" :key="metric.label">
            <UTooltip
              v-if="metric.kind"
              :delay-duration="150"
              :ui="{ content: 'h-auto max-w-xl items-start px-3 py-3' }"
            >
              <span class="inline-flex items-center gap-1.5">
                <UIcon
                  :name="ENTITY_KIND_META[metric.kind].icon"
                  class="size-3.5 shrink-0"
                  :style="{ color: metricColor(metric) }"
                />
                <span class="font-mono text-xs font-semibold text-highlighted tabular-nums">{{ metric.value }}</span>
                <span class="text-xs text-muted">{{ metric.label }}</span>
              </span>
              <template #content>
                <span class="block w-max max-w-[34rem] space-y-2">
                  <span class="flex items-center gap-2 text-xs font-medium text-muted">
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
                        <UIcon
                          :name="ENTITY_KIND_META[metric.kind].icon"
                          class="size-3.5 shrink-0"
                          :style="{ color: metricColor(metric) }"
                        />
                      </template>
                      {{ metricTitle(metric, id) }}
                    </UBadge>
                  </span>
                  <span v-else class="block text-xs text-dimmed">
                    No {{ ENTITY_KIND_META[metric.kind].plural.toLowerCase() }}
                  </span>
                </span>
              </template>
            </UTooltip>
            <span v-else class="inline-flex items-baseline gap-1.5">
              <span class="font-mono text-xs font-semibold text-highlighted tabular-nums">{{ metric.value }}</span>
              <span class="text-xs text-muted">{{ metric.label }}</span>
            </span>
          </template>
        </span>
      </span>
    </template>
  </button>
</template>

<style scoped>
.blr-entity-card--catalog {
  display: flex;
  min-height: 9rem;
  flex-direction: column;
  border-radius: 0.75rem;
  padding: 1rem;
}

.blr-entity-card--index {
  display: flex;
  min-height: 4.5rem;
  align-items: center;
  gap: 1rem;
  border-radius: 0.625rem;
  padding: 0.75rem 1rem;
}

.blr-entity-card--editorial {
  display: flex;
  min-height: 12rem;
  flex-direction: column;
  border-radius: 0.875rem;
  padding: 1.125rem;
}
</style>
