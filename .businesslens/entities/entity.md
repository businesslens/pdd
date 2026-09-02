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
nothing in the model owns it yet — including the people and systems that act on
the Product, which are things it keeps like any other. Finding one usually
means rereading Screens that had been carrying it a field at a time. It says
nothing about how it moves: every arc of its lifecycle is a Step somewhere that
creates, changes, or removes it.

## Information kept

- **Kept information** — the named facts the Product keeps about the thing, so a Business Rule can cite one
- **Acts** — whether the thing acts on the Product and from which side of the boundary, which is what makes it an Actor
- **Kind** — person or system, for the ones that act
- **States** — the states it can be in, each one a Step somewhere leaves it in
- **Relations** — the other Entities it relates to, with a verb and both cardinality ends
