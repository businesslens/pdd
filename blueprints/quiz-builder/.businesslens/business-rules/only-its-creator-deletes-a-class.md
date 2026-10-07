---
appliesTo:
  - type: entity
    id: class
    effect: removes
permits:
  - related: [{ verb: owns, entity: creator }]
---

# Only its creator deletes a class

Only the Creator who owns a class deletes it, once they confirm, and with it
every learner's place in it.

## Rationale

Deleting a class ends its join code for everyone in it, which only its Creator
decides.
