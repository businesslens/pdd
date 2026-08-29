---
relations:
  - entity: product
    verb: holds
    cardinality: one-to-one
  - entity: actor
    verb: holds
    cardinality: one-to-many
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
its product is intended to do. Its declared coverage is the state a reader
observes — how much of the intended product breadth this model claims to hold —
and it is the first thing every BusinessLens workflow establishes before acting.
Whether one exists at all is not a state it is in: a repository with no
`.businesslens/` has no Product Model to have one.

## Information kept

- Which Product it describes, and that Product's identity and attribution
- How much of the intended Product breadth it claims to cover
- The inspection that produced it, and what it leaves unmapped

