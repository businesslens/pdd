<script setup lang="ts">
import type { ComparisonSide } from '../utils/resourceComparison'
import { comparisonReadings, comparisonResource, pairedFields, readingChanged } from '../utils/resourceComparison'

const props = defineProps<{ before: ComparisonSide | null, after: ComparisonSide | null, resourceKey: string, initialTab?: string }>()
const emit = defineEmits<{ inspect: [key: string, state: string] }>()
const tab = defineModel<string>('tab', { default: '' })
const container = useTemplateRef('container')
const source = computed(() => props.after && comparisonResource(props.after, props.resourceKey) || props.before && comparisonResource(props.before, props.resourceKey))
const parentKey = computed(() => props.resourceKey.startsWith('capability-scenario:') ? `capability:${source.value?.capabilityId}`
  : props.resourceKey.startsWith('journey-scenario:') ? `journey:${source.value?.journeyId}` : props.resourceKey)
function readings(side: ComparisonSide | null) {
  const result = comparisonReadings(side, parentKey.value)
  if (parentKey.value !== props.resourceKey) {
    const references = comparisonReadings(side, props.resourceKey).find(reading => reading.id === 'references')
    return [...result.filter(reading => reading.id !== 'references'), ...references ? [references] : []]
  }
  return result
}
const beforeReadings = computed(() => readings(props.before))
const afterReadings = computed(() => readings(props.after))
const order = ['overview', 'scenarios', 'lifecycle', 'connections', 'coverage', 'references']
const tabs = computed(() => [...new Set([...beforeReadings.value, ...afterReadings.value].map(reading => reading.id))].sort((a, b) => order.indexOf(a) - order.indexOf(b)).map(id => {
  const before = beforeReadings.value.find(reading => reading.id === id), after = afterReadings.value.find(reading => reading.id === id)
  return { id, label: (after ?? before)!.label, changed: readingChanged(before, after) }
}))
const scenarioLanding = computed(() => {
  const before = comparisonReadings(props.before, props.resourceKey), after = comparisonReadings(props.after, props.resourceKey)
  const changed = (id: string) => readingChanged(before.find(reading => reading.id === id), after.find(reading => reading.id === id))
  return !changed('overview') && changed('references') ? 'references' : 'scenarios'
})
// An automatic landing reading is not a user navigation or an extra history entry.
const activeTab = computed({
  get: () => tabs.value.some(item => item.id === tab.value) ? tab.value
    : parentKey.value !== props.resourceKey ? scenarioLanding.value : props.initialTab ?? tabs.value.find(item => item.changed)?.id ?? tabs.value[0]?.id ?? 'overview',
  set: value => { tab.value = value }
})
const fields = computed(() => pairedFields(beforeReadings.value.find(reading => reading.id === activeTab.value)?.fields ?? [], afterReadings.value.find(reading => reading.id === activeTab.value)?.fields ?? []))
watch([() => props.resourceKey, () => props.before?.state, () => props.after?.state], async () => {
  await nextTick()
  if (parentKey.value !== props.resourceKey && activeTab.value === 'scenarios') [...container.value?.querySelectorAll<HTMLElement>('[data-comparison-field]') ?? []].find(element => element.dataset.comparisonField === props.resourceKey)?.scrollIntoView({ block: 'start' })
}, { immediate: true })
</script>

<template>
  <div ref="container" class="min-w-0 space-y-5" data-resource-comparison>
    <BlrPageTabs v-model="activeTab" :items="tabs" label="Resource comparison readings" />
    <p class="text-xs text-muted">Highlighted values compare Before → After. Unchanged content remains visible for context.</p>
    <div class="space-y-6">
      <BlrComparisonField v-for="pair in fields" :key="(pair.after ?? pair.before)!.id" :before="pair.before" :after="pair.after" :before-side="before" :after-side="after" @inspect="(key, state) => emit('inspect', key, state)" />
    </div>
  </div>
</template>
