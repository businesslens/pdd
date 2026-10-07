---
appliesTo:
  - type: entity
    id: incident-update
    effect: reads
    facts: [Notes]
permits:
  - actors: [operator]
---

# Operator notes are never published

The notes an update's message was drafted from are read only in the operator
console.

## Rationale

Notes are written fast and for colleagues; they may name customers, systems
or guesses that visitors should never see.
