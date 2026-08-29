---
domain: model-authoring
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

- Whether the goal was achieved
- Its trigger and its observable outcome
- One ordered list of typed Steps, each able to name the Capability it exercises
- The named routes those Steps traverse, and the Context each Step occurs in
- Its taxonomy kind, its decision points and its edge cases
- The named routes those Steps traverse
