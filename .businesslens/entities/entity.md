---
domain: model-authoring
relations:
  - entity: entity
    verb: relates to
    cardinality: many
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: doc
    role: context
    target: docs/entities.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ReportEntitySchema
---

# Entity

A thing the Product keeps or reasons about, which an Actor can point at. The
Product's nouns, where Capabilities are its verbs.

## Information kept

- What the Product keeps about the thing
- The states it can be in, and the transitions between them with their causes
- The other Entities it relates to, with a verb and a cardinality
