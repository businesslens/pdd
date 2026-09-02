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
    target: docs/capabilities.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ReportCapabilityScenarioSchema
---

# Capability Scenario

How an author shows a Capability actually works, in a case another person could
check. A Capability with none is a claim nobody has to honour.

## Information kept

- **Trigger and outcome** — what starts it and what is observable at the end
- **Steps** — one ordered list of typed Steps, each naming its Actor and what it does to the Product's things: creates, changes, removes, or reads, with the state a thing leaves and lands in
- **Routes and Contexts** — the named routes those Steps traverse, and the Context each Step occurs in
- **Classification** — its taxonomy kind, its decision points, and its edge cases
