---
appliesTo:
  - type: entity
    id: card-proposal
    effect: changes
permits:
  - related: [{ verb: holds, entity: deck }, { verb: owns, entity: learner }]
---

# Only a deck's owner accepts or dismisses its card proposals

A card proposal waits until the deck's owner accepts or dismisses it. The
Product never accepts or dismisses a proposal on its own, and a decided
proposal is never decided again.

## Rationale

The Product proposes; the Learner decides. A proposal settled without the
Learner's decision would be a decision taken for them.
