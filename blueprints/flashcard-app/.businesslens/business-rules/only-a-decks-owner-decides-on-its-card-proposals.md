---
appliesTo:
  - type: entity
    id: card-proposal
    effect: removes
permits:
  - related: [{ verb: holds, entity: deck }, { verb: owns, entity: learner }]
---

# Only a deck's owner keeps or discards its card proposals

Every card proposal waits until the owner of its deck keeps it or discards it.
The Assistant never accepts, discards or withdraws a proposal on its own.

## Rationale

The Assistant proposes; the Learner decides. A proposal that disappeared
without the Learner's decision would be a decision taken for them.
