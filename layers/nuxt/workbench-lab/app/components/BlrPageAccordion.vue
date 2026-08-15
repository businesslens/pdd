<script setup lang="ts">
/**
 * Page · Accordion — everything closed but the reading.
 *
 * The strongest form of "show me less": the page is a list of what is here,
 * with counts, and you open only what you came for. The Overview and the
 * authored detail start open because they are the reading; everything else
 * announces itself and waits.
 *
 * The cost is a click before every answer, and two clicks to compare two
 * sections — which is exactly the trade the Overview already makes for its own
 * metadata, so this asks whether that trade survives on a busier page.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { sectionsFor, type PageSectionId } from '../utils/pageSections'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  selectedKey?: string | null
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
  focus: [entity: AnyEntityView]
}>()

const OPEN_BY_DEFAULT: PageSectionId[] = ['overview', 'detail']

const sections = computed(() => sectionsFor(props.workspace, props.entity))
const openIds = ref<Set<PageSectionId>>(new Set(OPEN_BY_DEFAULT))

watch(() => props.entity.key, () => {
  openIds.value = new Set(OPEN_BY_DEFAULT)
})

function toggle(id: PageSectionId) {
  const next = new Set(openIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openIds.value = next
}

const allOpen = computed(() => sections.value.every(section => openIds.value.has(section.id)))

function toggleAll() {
  openIds.value = allOpen.value ? new Set() : new Set(sections.value.map(section => section.id))
}
</script>

<template>
  <article class="space-y-5">
    <BlrPageHeader
      :workspace="workspace"
      :entity="entity"
      @open="emit('open', $event)"
      @focus="emit('focus', $event)"
    />

    <div class="flex items-center justify-between">
      <p class="blr-accordion-label">{{ sections.length }} sections</p>
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        :label="allOpen ? 'Collapse all' : 'Expand all'"
        @click="toggleAll"
      />
    </div>

    <div class="divide-y divide-default border-y border-default">
      <div v-for="section in sections" :key="section.id">
        <button type="button" class="blr-accordion-head" :aria-expanded="openIds.has(section.id)" @click="toggle(section.id)">
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 shrink-0 text-dimmed transition-transform"
            :class="openIds.has(section.id) && 'rotate-90'"
          />
          <span class="text-sm font-medium text-highlighted">{{ section.label }}</span>
          <span v-if="section.count !== undefined" class="blr-meta">{{ section.count }}</span>
          <span v-if="section.hint" class="hidden min-w-0 flex-1 truncate text-xs text-dimmed sm:block">
            {{ section.hint }}
          </span>
        </button>
        <div v-if="openIds.has(section.id)" class="pb-6 ps-7">
          <BlrPageSection
            :workspace="workspace"
            :entity="entity"
            :id="section.id"
            :selected-key="selectedKey"
            @select="emit('select', $event)"
            @open="emit('open', $event)"
            @focus="emit('focus', $event)"
          />
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.blr-accordion-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-accordion-head {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 0;
  text-align: start;
}

.blr-accordion-head:hover .text-highlighted {
  color: var(--ui-text-highlighted);
}
</style>
