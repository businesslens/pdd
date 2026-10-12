---
appliesTo:
  - type: entity
    id: class
    effect: changes
permits:
  - related: [{ verb: owns, entity: creator }]
---

# Only its creator changes a class

Only the Creator who owns a class changes its name or the quizzes assigned to
it, by sharing a quiz with it or deleting one.

## Rationale

Learners in a class are shown what its Creator assigns, and nothing a classmate
does changes that.
