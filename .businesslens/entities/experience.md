---
domain: model-authoring
relations:
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
    target: docs/experiences.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ReportExperienceSchema
---

# Experience

What an author adds once one Interface has stopped being one thing — a second
audience, a different way in, a set of Capabilities the first audience never
sees.

## Information kept

- Which Interface contains it, from its path
- The Actors it serves and the access it requires
- Its own entry points
- What it supports, and what it explicitly does not
