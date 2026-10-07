---
appliesTo:
  - type: entity
    id: card-proposal
    effect: creates
permits:
  - related: [{ verb: holds, entity: deck }, { verb: owns, entity: learner }]
---

# Only a deck's owner drafts its card proposals

Card proposals are drafted into a deck only when its owner pastes notes and
asks for them. Nobody drafts proposals into another Learner's deck.

## Rationale

Proposals are offered only to the person who decides them, and only when they
asked for help.
