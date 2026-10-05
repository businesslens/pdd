---
appliesTo:
  - type: entity
    id: deck
    effect: reads
permits:
  - related: [{ verb: owns, entity: learner }]
  - actors: [learner]
    when: [{ state: Shared }]
---

# Only the owner reads a deck that is not shared

A deck is read by its owner always, and by other signed-in Learners only while
it is shared. Once its owner stops sharing it, its share link presents nothing.

## Rationale

Stopping sharing must take effect at once and completely, without deleting the
owner's deck.
