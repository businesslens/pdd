---
appliesTo:
  - type: entity
    id: card-proposal
permits:
  - related: [{ verb: holds, entity: deck }, { verb: owns, entity: learner }]
---

# Only a deck's owner drafts, accepts or dismisses its card proposals

Card proposals are drafted into a deck only when its owner asks, are seen only
by that owner, and wait until the owner accepts or dismisses each one. The
Product never accepts or dismisses a proposal on its own, and a decided
proposal is never decided again.

## Rationale

The Product proposes; the Learner decides. A proposal settled without the
Learner's decision would be a decision taken for them.
