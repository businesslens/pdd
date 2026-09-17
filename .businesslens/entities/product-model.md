---
relations:
  - entity: coverage-review
    verb: has
    cardinality: one-to-many
  - entity: product
    verb: holds
    cardinality: one-to-one
  - entity: interface
    verb: holds
    cardinality: one-to-many
  - entity: domain
    verb: holds
    cardinality: one-to-many
  - entity: entity
    verb: holds
    cardinality: one-to-many
  - entity: capability
    verb: holds
    cardinality: one-to-many
  - entity: journey
    verb: holds
    cardinality: one-to-many
  - entity: business-rule
    verb: holds
    cardinality: one-to-many
  - entity: blueprint
    verb: is compiled into
    cardinality: one-to-many
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: spec
    role: intent
    target: spec/report.md
    title: The Product Report wire contract
  - kind: doc
    role: context
    target: docs/product-model.md
  - kind: code
    role: implementation
    target: src/core/model.ts#loadModel
---

# Product model

The `.businesslens/` directory a repository keeps: the durable statement of what
its product is intended to do. Workflows that read or edit product meaning
resolve this directory before acting on it; installing skills and capturing
repository inputs do not require one. Only the Developer may authorize its
creation or changes. Whether one exists at all is not a state it is in: a
repository with no `.businesslens/` has no Product Model to have one. Its
declared coverage is a claim it carries, authored with it and moved with it,
not a state anything here moves it through.

## Information kept

- **Product** — which Product it describes, with that Product's identity and attribution
- **Coverage** — the declared scope and approved exclusions within which breadth is claimed: draft, partial, or complete
- **Inspection** — the method that produced it, the source areas it read, known gaps inside scope, and its limitations
