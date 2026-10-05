---
appliesTo:
  - type: entity
    id: quiz
    effect: changes
permits:
  - related: [{ verb: owns, entity: creator }]
---

# Only the creator changes a quiz

Only the Creator who owns a quiz changes its title, its questions and their
order, its source material, what it reveals after submitting, and whether it is
shared or closed.

## Rationale

Learners and the Quiz assistant never alter what a quiz asks or who can take
it; the Creator is answerable for both.
