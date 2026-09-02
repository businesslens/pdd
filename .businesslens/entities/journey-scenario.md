---
domain: model-authoring
relations:
  - entity: entity
    verb: acts on
    cardinality: many-to-many
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
    target: src/core/portable.ts#ReportJourneyScenarioSchema
---

# Journey Scenario

One way that goal actually plays out — including the ways it does not. An author
who only writes the happy path has described an intention, not a product.

## Information kept

- **Result** — whether the goal was achieved
- **Trigger and outcome** — what starts it and what is observable at the end
- **Steps** — one ordered list of typed Steps, each naming the Capability it exercises and what it does to the Product's things
- **Routes and Contexts** — the named routes those Steps traverse, and the Context each Step occurs in
- **Classification** — its taxonomy kind, its decision points, and its edge cases
