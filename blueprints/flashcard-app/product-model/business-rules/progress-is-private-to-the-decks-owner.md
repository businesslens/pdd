---
appliesTo:
  - type: entity
    id: card
    effect: reads
    facts: [Due on, Interval]
permits:
  - related: [{ verb: holds, entity: deck }, { verb: owns, entity: learner }]
---

# Only a deck's owner sees its study progress

When each card comes back, and the gap its last rating set, are shown only to
the Learner who owns the deck. A shared deck presents its cards' fronts and
backs and nothing about how its owner is doing.

## Rationale

How well someone remembers is personal; sharing a deck shares study material,
not the owner's record.
