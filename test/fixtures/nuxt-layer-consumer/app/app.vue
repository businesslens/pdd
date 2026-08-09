<script setup lang="ts">
import { projectReportView } from 'businesslens/report/view-model'

const report = projectReportView({
  id: 'packed-layer-smoke',
  title: 'Packed Layer Smoke Test',
  summary: 'Builds the public Nuxt Layers from the packed businesslens artifact.',
  description: 'The report renderer, global theme, and pure projection resolve together.',
  category: 'developer-tool',
  authors: [{ name: 'BusinessLens' }],
  license: 'MIT',
  intent: 'Catch missing files, invalid exports, and host-owned dependency mistakes before publication.',
  counts: {
    actors: 0,
    capabilities: 0,
    capabilityScenarios: 0,
    journeys: 0,
    journeyScenarios: 0,
    businessRules: 0
  },
  model: {
    actors: [],
    capabilities: [],
    journeys: [],
    businessRules: [],
    capabilityScenarios: [],
    journeyScenarios: []
  }
})
</script>

<template>
  <BusinessLensReportViewer :report="report" logo-src="/logo.svg" />
</template>
