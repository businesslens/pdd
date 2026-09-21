<script setup lang="ts">
import type { ComparisonNode, ComparisonSide } from '../utils/resourceComparison'
import { referenceStateKey } from '../utils/referenceNavigation'
import { resourceNavigationKey } from '../utils/resourceNavigation'

const props = defineProps<{ node: ComparisonNode, side: ComparisonSide }>()
const emit = defineEmits<{ inspect: [key: string, state: string] }>()
provide(referenceStateKey, computed(() => props.side.state))
const navigation = inject(resourceNavigationKey, null)
if (navigation) provide(resourceNavigationKey, { ...navigation, href: (key, tab) => navigation.href(key, tab, props.side.state) })
</script>

<template>
  <div class="min-w-0 space-y-3 text-sm [overflow-wrap:anywhere]">
    <BlrRefs v-if="node.reference" :references="[node.reference]" :scope="JSON.stringify([side.state, node.reference])" label="" />
    <template v-else>
      <BlrResourceLink v-if="node.resource" :resource-key="node.resource" class="text-primary underline decoration-dotted underline-offset-2" @open="emit('inspect', node.resource!, side.state)">{{ node.text }}</BlrResourceLink>
      <BlrProse v-else-if="node.prose && node.text" :text="node.text" class="max-w-3xl" />
      <p v-else-if="node.text" class="whitespace-pre-wrap">{{ node.text }}</p>
      <dl v-if="node.fields" class="space-y-3">
        <div v-for="field in node.fields" :key="field.id" class="grid min-w-0 gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)]">
          <dt class="mb-1 text-xs font-medium text-muted">{{ field.label }}</dt>
          <dd class="space-y-2">
            <BlrComparisonValue v-for="(item, index) in field.items" :key="index" :node="item" :side="side" @inspect="(key, state) => emit('inspect', key, state)" />
          </dd>
        </div>
      </dl>
    </template>
  </div>
</template>
