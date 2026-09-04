---
domain: model-inspection
availability: [{ place: local-report-web }]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/utils/productTopologyViews.ts#PRODUCT_TOPOLOGY_VIEWS
    title: The named views
---

# Explore the Product Topology

Draws the model's cross-kind structure as one of a fixed set of named views.
Each view states the question it answers and how it derives its answer, and the
reader can hide a kind, narrow the view, or focus a single resource's
neighbourhood.

## Intent

"Which Capabilities does each Journey Scenario compose" has more than one
defensible derivation, and a view builder would make the reader invent the
meaning before they could read anything. A named view picks one derivation,
states it, and is accountable for it; a new correlation costs code, which is the
point.
