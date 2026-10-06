---
appliesTo:
  - type: entity
    id: card
    effect: changes
permits:
  - related: [{ verb: holds, entity: deck }, { verb: owns, entity: learner }]
---

# Only a deck's owner edits or studies its cards

Only the Learner who owns a deck changes its cards: their text when editing,
their schedule when studying. Another Learner studies a shared deck only by
copying it.

## Rationale

A schedule is only meaningful for one person's memory, so every rating must be
the owner's.
