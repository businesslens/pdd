---
domain: model-authoring
relations:
  - entity: capability-scenario
    verb: holds
    cardinality: many
  - entity: entity
    verb: acts on
    cardinality: many
---

# Capability

A durable ability of the Product — the smallest behaviour that stays
independently meaningful. It has no beginning or end.

## Information kept

- Why it exists and which outcome it protects
- Where it is available, as Contexts
- The Entities it acts on
- Its subject Domain, when it has one
