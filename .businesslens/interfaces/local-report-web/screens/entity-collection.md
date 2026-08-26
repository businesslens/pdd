---
capabilities: [view-product-model]
entryPoints:
  - local-report-web: /?s=capability
---

# Entity collection

Every entity of one kind, ranked and grouped so the reader can find the one they
came for. Scenarios are read from the Capability or Journey that owns them
rather than listed here, because a kind with a mandatory single parent is
reached through that parent.

## Information presented

- Every entity of the selected kind, as cards or as a table
- The identifying facts that distinguish entities of that kind from each other
- The default grouping that shows what contains what
- The filters that narrow this kind, offered only where scanning would be slower
- The count of entities in the kind

## Available actions

- Open an entity's page
- Switch between the card and table readings
- Narrow the collection by a facet of the kind
- Search the whole model by name

## Product states

### Populated collection

Entities are listed with their grouping and, where the collection is large
enough to need them, filter controls.

### Empty collection

The kind holds nothing, and no control is offered for narrowing a list that has
nothing in it.

## Capability boundary

Finding one entity among many of the same kind. It never edits the model, and it
does not correlate across kinds — that question belongs to the Topology.
