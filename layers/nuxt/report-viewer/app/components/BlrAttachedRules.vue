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
      v-for="{ rule, hookLabel, hook, parts } in rules"
      :key="rule.key"
      :workspace="workspace"
      :resource="rule"
      :hook-label="hookLabel"
      :hook="hook"
      :metrics="false"
      @open="emit('open', $event)"
    >
      <!-- An operation reads with its Entity chip and State badges, as the Rule's own Who may draws it. -->
      <template v-if="parts.some(part => part.operations.length)" #hook>
        <template v-for="(part, index) in parts" :key="index">
          <span v-if="index" class="text-dimmed">{{ part.label.toLowerCase() }}</span>
          <template v-if="part.operations.length">
            <BlrRuleOperation
              v-for="(operation, position) in part.operations"
              :key="position"
              :workspace="workspace"
              :target="operation.target"
              :places="operation.places"
              :entity="operation.entity"
              static
            />
          </template>
          <span v-else>{{ part.text }}</span>
        </template>
      </template>
    </BlrResourceCard>
  </div>
</template>
