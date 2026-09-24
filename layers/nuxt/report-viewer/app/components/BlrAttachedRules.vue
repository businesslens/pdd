<script setup lang="ts">
/**
 * The Business Rules tab: the Rules that name this resource, read from its
 * side, as the Business Rules collection lists them — name and statement —
 * with the hook line saying how the Rule names this resource: where it holds,
 * what it selects, or which Scenario it targets. Every edge a Rule's Applies to
 * tree draws is so read at both ends. The Rule's own reach is its reading's,
 * not this one's, so the row carries no metrics.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { attachedRules } from '../utils/topologyTargets'

const props = defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const rules = computed(() => attachedRules(props.workspace, props.resource))
</script>

<template>
  <div v-if="rules.length" class="space-y-2" data-attached-rules>
    <BlrResourceCard
      v-for="{ rule, hookLabel, hook } in rules"
      :key="rule.key"
      :workspace="workspace"
      :resource="rule"
      :hook-label="hookLabel"
      :hook="hook"
      :metrics="false"
      @open="emit('open', $event)"
    />
  </div>
</template>
