---
appliesTo:
  - type: entity
    id: deck
    effect: changes
permits:
  - related: [{ verb: owns, entity: learner }]
---

# Only a deck's owner renames it, shares it or stops sharing it

Only the Learner who owns a deck renames it or makes it shared or private
again. A share link lets others read and copy the deck, never change it.

## Rationale

A deck is its owner's working material; handing it out must never hand out
control of it.
