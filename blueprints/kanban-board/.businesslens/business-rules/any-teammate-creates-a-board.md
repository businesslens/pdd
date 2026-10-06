---
appliesTo:
  - type: entity
    id: board
    effect: creates
permits:
  - actors: [teammate]
---

# Any Teammate creates a board

Every Teammate with an account may start a board, and becomes its first admin.
An AI agent never creates one.

## Rationale

A team should not need anyone's permission to start organizing its work.
