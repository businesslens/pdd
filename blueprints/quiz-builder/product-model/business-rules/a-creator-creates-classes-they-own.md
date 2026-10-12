---
appliesTo:
  - type: entity
    id: class
    effect: creates
permits:
  - related: [{ verb: owns, entity: creator }]
---

# A Creator creates classes they own

Every class is created by a Creator and belongs to them from its first moment.

## Rationale

A class decides who is shown a quiz, so one person must answer for who it
includes.
