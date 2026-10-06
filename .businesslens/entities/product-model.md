---
relations:
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
resolve this directory before acting on it; installing skills does not require
one. Only the Developer may authorize its
creation or changes. Whether one exists at all is not a state it is in: a
repository with no `.businesslens/` has no Product Model to have one. Its
coverage says which of the repository's code it accounts for; a model decided
before any code exists has empty coverage until a mapping records some.

## Information kept

- **Product** — which Product it describes, with that Product's identity and attribution
- **Coverage** — which of the repository's code the model accounts for: covered code areas, code excluded as not product behavior, code with unmodeled behavior, and code whose behavior could not be established, each at the folders it names; empty when the model is tied to no code
- **Method** — the short note on how its code was inspected; empty with empty coverage
