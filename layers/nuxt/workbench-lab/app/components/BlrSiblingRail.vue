<script setup lang="ts">
/**
 * The sibling rail: a second level of navigation, beside the first.
 *
 * Only the `rail` option renders this. It is the most expensive answer to the
 * complaint — a page that carries its own navigation is a page competing with
 * the rail already on screen — and the cheapest to move around in, because
 * reading every Scenario of a Capability never leaves the page.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META } from '../utils/model'
import { parentOf, siblingsOf } from '../utils/pageSections'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
}>()

const emit = defineEmits<{ open: [entity: AnyEntityView] }>()

const parent = computed(() => parentOf(props.workspace, props.entity))
const siblings = computed(() => siblingsOf(props.workspace, props.entity))
const parentMeta = computed(() => parent.value ? ENTITY_KIND_META[parent.value.kind] : null)
</script>

<template>
  <aside v-if="parent && siblings.length > 1" class="hidden w-56 shrink-0 border-e border-default lg:block">
    <div class="sticky top-0 p-2">
      <button
        type="button"
        class="mb-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-start hover:bg-elevated"
        @click="emit('open', parent)"
      >
        <UIcon v-if="parentMeta" :name="parentMeta.icon" class="size-3.5 shrink-0 text-dimmed" />
        <span class="min-w-0 flex-1 truncate text-xs font-semibold text-highlighted">{{ parent.title }}</span>
      </button>
      <p class="blr-rail-label">{{ siblings.length }} Scenarios</p>
      <button
        v-for="(item, position) in siblings"
        :key="item.key"
        type="button"
        class="blr-sibling"
        :data-current="item.key === entity.key"
        @click="emit('open', item)"
      >
        <span class="blr-sibling-index">{{ position + 1 }}</span>
        <span class="min-w-0 flex-1 truncate text-start">{{ item.title }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.blr-rail-label {
  padding: 0.375rem 0.5rem 0.25rem;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-sibling {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3125rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 12px;
  color: var(--ui-text-muted);
}

.blr-sibling:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.blr-sibling[data-current='true'] {
  background: color-mix(in srgb, var(--blr-slot-7) 10%, var(--ui-bg-elevated));
  box-shadow: inset 2px 0 0 var(--blr-slot-7);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

.blr-sibling-index {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ui-text-dimmed);
}
</style>
