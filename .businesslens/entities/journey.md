---
domain: model-authoring
relations:
  - entity: journey-scenario
    verb: holds
    cardinality: one-to-many
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: doc
    role: context
    target: docs/journeys.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ReportJourneySchema
---

# Journey

What an author writes when a goal is plainly real and no single Capability
delivers it. The hardest type to justify, and the one most often authored
because it feels owed rather than because it was needed.

## Information kept

- The stable Actor intent it pursues
- How an achieved attempt is recognized
- Which Actors pursue it
