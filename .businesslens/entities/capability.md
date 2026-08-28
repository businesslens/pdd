---
domain: model-authoring
relations:
  - entity: capability-scenario
    verb: holds
    cardinality: many
  - entity: entity
    verb: acts on
    cardinality: many
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
    target: src/core/portable.ts#ReportCapabilitySchema
---

# Capability

A durable ability of the Product — the smallest behaviour that stays
independently meaningful. It has no beginning or end.

## Information kept

- Why it exists and which outcome it protects
- Where it is available, as Contexts
- The Entities it changes
- Its subject Domain, when it has one
