<script setup lang="ts">
import type { AnyResourceView, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'

defineProps<{ workspace: ReportWorkspace, scenario: ScenarioView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
</script>

<template>
  <ol class="blr-steps-list" data-scenario-steps-drawing>
    <li v-for="(step, index) in scenario.steps" :key="index" :data-step="index + 1">
      <span class="blr-steps-number">{{ index + 1 }}</span>
      <BlrScenarioStep :workspace="workspace" :scenario="scenario" :step="step" :index="index" @open="emit('open', $event)" />
    </li>
  </ol>
</template>
