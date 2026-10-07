---
appliesTo:
  - type: entity
    id: deck
    effect: removes
permits:
  - related: [{ verb: owns, entity: learner }]
---

# Only a deck's owner deletes it

Only the Learner who owns a deck deletes it, with everything it holds. Deleting
the original never deletes a copy someone else made.

## Rationale

A copy belongs to the Learner who made it, so it outlives whatever happens to
the deck it came from.
