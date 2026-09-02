---
domain: model-authoring
relations:
  - entity: capability-scenario
    verb: holds
    cardinality: one-to-many
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
changes how a model reads. It declares nothing about the things it changes;
what it changes is what its Steps say.

## Information kept

- **Purpose** — why it exists and which outcome it protects
- **Availability** — where it is available, as Contexts
- **Domain** — its subject Domain, when it has one
