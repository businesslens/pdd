---
appliesTo:
  - type: entity
    id: stall-flag
    effect: creates
permits:
  - unattended: true
---

# Only the Product raises stall flags

A stall flag is raised only by the Product's own check of a board's cards
against its stall threshold. Neither a member nor an AI agent raises one.

## Rationale

A flag is a fact about how long a card has waited, so it is the same for every
board, whoever is looking.
