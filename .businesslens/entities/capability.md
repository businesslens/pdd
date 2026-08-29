---
domain: model-authoring
relations:
  - entity: capability-scenario
    verb: holds
    cardinality: one-to-many
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
    target: src/core/portable.ts#ReportCapabilitySchema
---

# Capability

What an author writes most of, and argues about most. Where one ends and the
next begins is the judgement `lint` cannot make for them, and the one that most
changes how a model reads.

## Information kept

- Why it exists and which outcome it protects
- Where it is available, as Contexts
- The Entities it changes
- Its subject Domain, when it has one
