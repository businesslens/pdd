<script setup lang="ts">
import type { ProductReportV10 } from 'businesslens/report'

const report: ProductReportV10 = {
  schemaVersion: '10.0.0',
  id: 'packed-layer-smoke',
  title: 'Packed Layer Smoke Test',
  summary: 'Builds the public Nuxt layer from the packed businesslens artifact.',
  description: 'The canonical Product Report and stable theme resolve together.',
  category: 'developer-tool',
  authors: [{ name: 'BusinessLens' }],
  license: 'MIT',
  intent: 'Catch missing files, invalid exports, and host-owned dependency mistakes before publication.',
  supportingSections: [],
  references: [],
  referenceProfile: 'portable',
  tags: ['smoke-test'],
  generatedAt: '2026-08-09',
  generator: { name: 'businesslens', version: '0.7.2' },
  counts: {
    actors: 1,
    interfaces: 1,
    experiences: 0,
    screens: 0,
    domains: 0,
    capabilities: 0,
    capabilityScenarios: 0,
    journeys: 0,
    journeyScenarios: 0,
    businessRules: 0
  },
  limitations: [],
  model: {
    taxonomies: { scenarioKinds: [] },
    actors: [{
      id: 'reader',
      name: 'Reader',
      description: 'A person viewing the report.',
      kind: 'person',
      relationship: 'external',
      intent: '',
      supportingSections: [],
      references: []
    }],
    interfaces: [{
      id: 'web',
      title: 'Web',
      description: 'The browser interface.',
      type: 'web',
      actorIds: ['reader'],
      entryPoints: [],
      capabilityBoundary: 'Hosts the report.',
      intent: '',
      supportingSections: [],
      references: []
    }],
    experiences: [],
    screens: [],
    domains: [],
    capabilities: [],
    capabilityScenarios: [],
    journeys: [],
    journeyScenarios: [],
    businessRules: []
  },
  coverage: {
    status: 'complete',
    method: ['Static packed-artifact smoke fixture.'],
    sourceAreas: [],
    unmapped: [],
    limitations: [],
    rationale: 'The fixture exercises package resolution, not a Product claim.'
  }
}
</script>

<template>
  <BusinessLensReportViewer :report="report" logo-src="/logo.svg" />
</template>
