---
appliesTo:
  - type: entity
    id: quiz
    effect: removes
permits:
  - related: [{ verb: owns, entity: creator }]
---

# Only the creator deletes a quiz

Only the Creator who owns a quiz deletes it, once they confirm, and with it its questions, the
attempts at it and their practice rounds.

## Rationale

Deleting a quiz deletes learners' results for good. Only the person accountable
for those results may decide that.
