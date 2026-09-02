---
entities:
  - product-model
  - product
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

# Resource collection

Every resource of one kind, ranked and grouped so the reader can find the one they
came for. Scenarios are read from the Capability or Journey that owns them
rather than listed here, because a kind with a mandatory single parent is
reached through that parent. The things that act lead the Entity collection,
because a reader arrives asking who this is for.

## Information presented

- Every resource of the selected kind, as cards or as a table
- The identifying facts that distinguish resources of that kind from each other
- The default grouping that shows what contains what
- The filters that narrow this kind, offered only where scanning would be slower
- The count of resources in the kind

## Available actions

- Open a resource's page
- Switch between the card and table readings
- Narrow the collection by a facet of the kind
- Search the whole model by name

## View states

### Populated collection

Resources are listed with their grouping and, where the collection is large
enough to need them, filter controls.

### Empty collection

The kind holds nothing, and no control is offered for narrowing a list that has
nothing in it.

## Capability boundary

Finding one resource among many of the same kind. It never edits the model, and it
does not correlate across kinds — that question belongs to the Topology.
