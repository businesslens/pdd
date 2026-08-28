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

One coherent Actor goal that requires deliberately composing several
Capabilities. It owns the goal, never the route.

## Information kept

- The stable Actor intent it pursues
- How an achieved attempt is recognized
- Which Actors pursue it
