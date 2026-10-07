---
appliesTo:
  - type: entity
    id: quiz
    effect: changes
permits:
  - related: [{ verb: owns, entity: creator }]
---

# Only the creator changes a quiz

Only the Creator who owns a quiz changes its title, what it reveals after
submitting, its questions and their order, its source material, and whether it
is shared, closed or reopened.

## Rationale

Learners never alter what a quiz asks or who can take it, and nothing the
Product drafts does either; the Creator is answerable for both.
