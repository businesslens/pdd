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

One concrete end-to-end variation of exactly one Journey, ending with its goal
achieved or not achieved.

## Information kept

- Whether the goal was achieved
- Its trigger and its observable outcome
- One ordered list of typed Steps, each able to name the Capability it exercises
- The named routes those Steps traverse, and the Context each Step occurs in
- Its taxonomy kind, its decision points and its edge cases
- The named routes those Steps traverse
