<script setup lang="ts">
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { coveragePathContext } from '../utils/coveragePaths'

const props = defineProps<{ workspace: ReportWorkspace, path: string }>()
const emit = defineEmits<{ selectKey: [key: string], selectPath: [path: string] }>()
const context = computed(() => coveragePathContext(props.workspace, props.path))
const areas = computed(() => [
  { label: 'Covered', items: context.value.covered },
  { label: 'Exclusions', items: context.value.exclusions },
  { label: 'Unmapped', items: context.value.unmapped },
  { label: 'Limitations', items: context.value.limitations }
])
</script>

<template>
  <div class="min-w-0 space-y-6" data-coverage-annotations>
    <p class="text-xs text-muted">Paths locate authored context; they do not establish file-level completeness or whether a file exists.</p>
    <section v-for="field in areas" :key="field.label" class="space-y-3" :aria-label="field.label">
      <h3 class="text-sm font-semibold text-highlighted">{{ field.label }} <span class="blr-meta ms-1">{{ field.items.length }}</span></h3>
      <ul v-if="field.items.length" class="space-y-4">
        <li v-for="(area, index) in field.items" :key="index" class="space-y-2">
          <BlrProse :text="area.description" />
          <ul class="flex flex-wrap gap-x-3 gap-y-1">
            <li v-for="location in area.paths" :key="location"><button type="button" class="break-all text-start font-mono text-xs text-primary underline decoration-dotted underline-offset-4" @click="emit('selectPath', location)">{{ location }}</button></li>
          </ul>
        </li>
      </ul>
      <p v-else class="text-sm text-muted">None recorded.</p>
    </section>
    <section class="space-y-3" aria-label="Model references">
      <h3 class="text-sm font-semibold text-highlighted">Model references <span class="blr-meta ms-1">{{ context.owners.length }} resources</span></h3>
      <ul v-if="context.owners.length" class="space-y-4">
        <li v-for="owner in context.owners" :key="owner.key" class="space-y-2">
          <button v-if="owner.key" type="button" class="text-sm text-primary underline underline-offset-2" @click="emit('selectKey', owner.key)">{{ owner.title }}</button>
          <p v-else class="text-sm text-default">{{ owner.title }} · Product</p>
          <BlrRefs :references="owner.references" :scope="JSON.stringify([workspace.identity.id, 'coverage', path, owner.key])" label="" />
        </li>
      </ul>
      <p v-else class="text-sm text-muted">None recorded.</p>
    </section>
  </div>
</template>
