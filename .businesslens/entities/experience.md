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

- **Container** — which Interface contains it, from its path
- **Audience** — the acting Entities it serves and the access it requires
- **Entry points** — its own addresses
- **Boundary** — what it supports, and what it explicitly does not
