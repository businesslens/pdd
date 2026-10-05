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

The notes a draft was prepared from are read only in the operator console,
whether or not the update was posted.

## Rationale

Notes are written fast and for colleagues; they may name customers, systems
or guesses that visitors should never see.
