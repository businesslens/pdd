<script setup lang="ts">
/**
 * Page · Anchored — one scroll, but you can see where you are in it.
 *
 * The least disruptive answer: keep the single reading, and add the thing a
 * long document normally has and this one does not — a contents list that says
 * what is below, how much of it there is, and which part you are in.
 *
 * It keeps the cost of a long page and removes only the disorientation, which
 * is either most of the complaint or none of it. That is what the audition is
 * for.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { sectionsFor } from '../utils/pageSections'

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

const sections = computed(() => sectionsFor(props.workspace, props.entity))
const active = ref<string>('overview')
const root = useTemplateRef<HTMLElement>('root')

/*
  Which section the reader is in.

  `IntersectionObserver` against the scrolling pane, taking the topmost visible
  heading rather than the largest intersection — while scrolling down, the one
  you have just reached is the one you mean.
*/
let observer: IntersectionObserver | undefined

function observe() {
  observer?.disconnect()
  const container = root.value?.closest('.blr-pane') as HTMLElement | null
  if (!root.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)
    const first = visible[0]?.target.id
    if (first) active.value = first.replace('blr-section-', '')
  }, { root: container, rootMargin: '0px 0px -70% 0px', threshold: 0 })
  for (const node of root.value.querySelectorAll('[id^="blr-section-"]')) observer.observe(node)
}

onMounted(observe)
onBeforeUnmount(() => observer?.disconnect())
watch(() => [props.entity.key, sections.value.length], () => {
  active.value = sections.value[0]?.id ?? 'overview'
  void nextTick(observe)
})

function jump(id: string) {
  const target = root.value?.querySelector(`#blr-section-${id}`)
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  active.value = id
}
</script>

<template>
  <article ref="root" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_13rem]">
    <div class="min-w-0 space-y-8">
      <BlrPageHeader
        :workspace="workspace"
        :entity="entity"
        @open="emit('open', $event)"
        @focus="emit('focus', $event)"
      />

      <section
        v-for="section in sections"
        :id="`blr-section-${section.id}`"
        :key="section.id"
        class="scroll-mt-4 space-y-2"
      >
        <header v-if="section.id !== 'overview'" class="flex flex-wrap items-baseline gap-2">
          <h2 class="text-base font-semibold tracking-tight text-highlighted">{{ section.label }}</h2>
          <span v-if="section.count !== undefined" class="blr-meta">{{ section.count }}</span>
          <span v-if="section.hint" class="text-xs text-muted">{{ section.hint }}</span>
        </header>
        <BlrPageSection
          :workspace="workspace"
          :entity="entity"
          :id="section.id"
          :selected-key="selectedKey"
          @select="emit('select', $event)"
          @open="emit('open', $event)"
          @focus="emit('focus', $event)"
        />
      </section>
    </div>

    <nav class="hidden lg:sticky lg:top-4 lg:block lg:self-start">
      <p class="blr-toc-label">On this page</p>
      <button
        v-for="section in sections"
        :key="section.id"
        type="button"
        class="blr-toc"
        :data-current="section.id === active"
        @click="jump(section.id)"
      >
        <span class="min-w-0 flex-1 truncate text-start">{{ section.label }}</span>
        <span v-if="section.count !== undefined" class="font-mono text-[10px] text-dimmed">{{ section.count }}</span>
      </button>
    </nav>
  </article>
</template>

<style scoped>
.blr-toc-label {
  padding: 0 0.5rem 0.375rem;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-toc {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-inline-start: 2px solid var(--ui-border);
  font-size: 12px;
  color: var(--ui-text-muted);
  transition: color 0.12s ease, border-color 0.12s ease;
}

.blr-toc:hover {
  color: var(--ui-text-highlighted);
}

.blr-toc[data-current='true'] {
  border-inline-start-color: var(--ui-color-primary-500);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}
</style>
