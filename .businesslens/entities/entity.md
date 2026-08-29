---
domain: model-authoring
relations:
  - entity: entity
    verb: relates to
    cardinality: many-to-many
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

What an author names when the same noun keeps surfacing in their own prose and
nothing in the model owns it yet. Finding one usually means rereading Screens
that had been carrying it a field at a time.

## Information kept

- What the Product keeps about the thing
- The states it can be in, and the transitions between them with their causes
- The other Entities it relates to, with a verb and both cardinality ends
