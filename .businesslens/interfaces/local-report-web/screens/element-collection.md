---
entities:
  - product-model
  - product
  - actor
  - interface
  - experience
  - screen
  - domain
  - entity
  - capability
  - capability-scenario
  - journey
  - journey-scenario
  - business-rule
capabilities: [view-product-model]
entryPoints:
  - local-report-web: /?s=capability
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrReportShell.vue
---

# Element collection

Every element of one kind, ranked and grouped so the reader can find the one they
came for. Scenarios are read from the Capability or Journey that owns them
rather than listed here, because a kind with a mandatory single parent is
reached through that parent.

## Information presented

- Every element of the selected kind, as cards or as a table
- The identifying facts that distinguish elements of that kind from each other
- The default grouping that shows what contains what
- The filters that narrow this kind, offered only where scanning would be slower
- The count of elements in the kind

## Available actions

- Open an element's page
- Switch between the card and table readings
- Narrow the collection by a facet of the kind
- Search the whole model by name

## View states

### Populated collection

Elements are listed with their grouping and, where the collection is large
enough to need them, filter controls.

### Empty collection

The kind holds nothing, and no control is offered for narrowing a list that has
nothing in it.

## Capability boundary

Finding one element among many of the same kind. It never edits the model, and it
does not correlate across kinds — that question belongs to the Topology.
