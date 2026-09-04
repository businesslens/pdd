---
domain: model-authoring
relations:
  - entity: experience
    verb: holds
    cardinality: one-to-many
  - entity: screen
    verb: holds
    cardinality: one-to-many
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: doc
    role: context
    target: docs/interfaces.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ReportInterfaceSchema
---

# Interface

Where an author says how the Product is actually reached. Everything an Actor
touches hangs below one of these, which is why getting the list wrong is
expensive to correct later.

## Information kept

- **Type** — its one interaction type, from a closed vocabulary
- **Actors** — the acting Entities it admits
- **Entry points** — the product-facing addresses it answers on
- **Boundary** — what it supports, and what it explicitly does not
