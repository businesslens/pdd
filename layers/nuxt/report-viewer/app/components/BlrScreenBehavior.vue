<script setup lang="ts">
/** Actions and descriptive view states are independent authored lists. */
import type { ReportWorkspace, ScreenView } from '../utils/reportWorkspace'

const props = defineProps<{ workspace: ReportWorkspace, resource: ScreenView }>()
const scope = computed(() => JSON.stringify([props.workspace.identity.id, props.resource.key]))
const stateKeys = computed(() => props.resource.states.map(state => state.title))
const expanded = useBlrScreenStateExpansion(scope, stateKeys)

function setOpen(key: string, open: boolean) {
  expanded.value = open ? [...new Set([...expanded.value, key])] : expanded.value.filter(value => value !== key)
}
</script>

<template>
  <div class="space-y-8" data-screen-behavior>
    <section v-if="resource.actions.length" class="space-y-3" data-screen-actions>
      <h2 class="text-base font-[650] tracking-[-0.015em] text-highlighted">
        Available actions <span class="blr-meta ms-1">{{ resource.actions.length }}</span>
      </h2>
      <ul class="space-y-2">
        <li v-for="action in resource.actions" :key="action" class="flex items-start gap-2 text-sm text-default">
          <UIcon name="i-lucide-mouse-pointer-click" class="mt-0.5 size-4 shrink-0 text-muted" />{{ action }}
        </li>
      </ul>
    </section>

    <section v-if="resource.states.length" class="space-y-3" data-screen-states>
      <header class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-base font-[650] tracking-[-0.015em] text-highlighted">
          <BlrTerm slug="view-state" text="View states" />
          <span class="blr-meta ms-1">{{ resource.states.length }}</span>
        </h2>
        <UFieldGroup size="sm" aria-label="View state expansion">
          <UTooltip text="Expand all"><UButton icon="i-lucide-maximize-2" color="neutral" variant="outline" aria-label="Expand all" @click="expanded = [...stateKeys]" /></UTooltip>
          <UTooltip text="Collapse all"><UButton icon="i-lucide-minimize-2" color="neutral" variant="outline" aria-label="Collapse all" @click="expanded = []" /></UTooltip>
        </UFieldGroup>
      </header>
      <div class="space-y-3">
        <UCollapsible v-for="state in resource.states" :key="state.title" :open="expanded.includes(state.title)"
          class="overflow-hidden rounded-xl border border-default bg-elevated/20" :data-screen-state="state.title"
          @update:open="setOpen(state.title, $event)">
          <template #default="{ open }">
            <UButton color="neutral" variant="ghost" size="sm" block
              class="w-full justify-start rounded-none px-3 py-2 text-start"
              :aria-label="`${open ? 'Collapse' : 'Expand'} ${state.title}`">
              <span class="mx-1 size-2.5 shrink-0 rounded-full border-2 border-accented" aria-hidden="true" />
              <span class="min-w-0 flex-1 text-sm font-semibold tracking-tight text-highlighted [overflow-wrap:anywhere]">{{ state.title }}</span>
              <UIcon name="i-lucide-chevron-down" class="size-3.5 shrink-0 text-dimmed transition-transform" :class="open && 'rotate-180'" />
            </UButton>
          </template>
          <template #content>
            <BlrProse :text="state.description" class="border-t border-muted px-4 py-3" data-screen-state-description />
          </template>
        </UCollapsible>
      </div>
    </section>
  </div>
</template>
