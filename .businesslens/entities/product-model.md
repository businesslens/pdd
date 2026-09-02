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
its product is intended to do. It is the first thing every BusinessLens workflow
establishes before acting, and the one thing in this Product that only the
Developer may write. Whether one exists at all is not a state it is in: a
repository with no `.businesslens/` has no Product Model to have one. Its
declared coverage is a claim it carries, authored with it and moved with it,
not a state anything here moves it through.

## Information kept

- **Product** — which Product it describes, with that Product's identity and attribution
- **Coverage** — how much of the intended breadth it claims to hold: draft, partial, or complete
- **Inspection** — the method that produced it, the source areas it read, what it leaves unmapped, and its limitations
