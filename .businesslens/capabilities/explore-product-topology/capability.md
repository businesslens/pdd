---
domain: model-inspection
availability: [{ place: local-report-web }]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/utils/productTopologyViews.ts#PRODUCT_TOPOLOGY_VIEWS
    title: The named views
---

# Explore Product structure and connections

Presents the model’s structure and connections through named readings, each a
tab of the collection whose subject it draws. Domain map belongs to Domains,
Interface map and delivery comparison to Interfaces, Entity relationships to
Entities, mutations to Capabilities, attachments to Business Rules, and Journey
composition to Journeys. There is no view of the whole model: the rail names
every collection with its count, and a resource's own connections belong to its
page. Each view states the question it answers and explains its derivation. The
Developer can expand groups, narrow the visible resources, inspect a resource’s
incoming and outgoing connections, and open any included resource’s page. The
selected reading survives returning from a page, reloading, and valid model
edits.

## Intent

Give the Developer a readable, accountable answer to a question spanning resource
types, with the scope and supporting relationships available for inspection.
