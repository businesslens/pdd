---
domain: model-authoring
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

- Its trigger and its observable outcome
- One ordered list of typed Steps, each able to name its Actor and the Entity it changes
- The named routes those Steps traverse, and the Context each Step occurs in
- Its taxonomy kind, its decision points and its edge cases
