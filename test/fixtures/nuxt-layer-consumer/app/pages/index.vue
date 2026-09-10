<script setup lang="ts">
import type { ProductReportV13 } from 'businesslens/report'

const route = useRoute()
const { section, resource, tab, scenarioRoute, routeColumns, topology } = useBlrReportNavigation({ sectionKey: route.query.catalog === '1' ? 'tab' : 's' })

const report: ProductReportV13 = {
  schemaVersion: '13.0.0',
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
  generator: { name: 'businesslens', version: '0.9.0' },
  counts: {
    interfaces: 1,
    experiences: 0,
    screens: 0,
    domains: 0,
    entities: 1,
    capabilities: 0,
    capabilityScenarios: 0,
    journeys: 0,
    journeyScenarios: 0,
    businessRules: 0
  },
  limitations: [],
  model: {
    taxonomies: { scenarioKinds: [] },
    entities: [{
      id: 'reader',
      title: 'Reader',
      description: 'A person viewing the report.',
      kind: 'person',
      acts: 'external',
      informationKept: [],
      relations: [{ entityId: 'reader', verb: 'knows', cardinality: 'many-to-many' }],
      states: [{ name: 'Active', content: 'The Reader is active.' }, { name: 'Unreached', content: 'No Step reaches this State.' }],
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
  <div>
    <BusinessLensReportViewer v-for="index in route.query.multi === '1' ? 2 : 1" :key="index" v-model:section="section" v-model:resource="resource" v-model:tab="tab" v-model:scenario-route="scenarioRoute" v-model:route-columns="routeColumns" v-model:topology="topology" :report="report" />
  </div>
</template>
