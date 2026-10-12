---
appliesTo:
  - type: entity
    id: entry-question
    effect: removes
permits:
  - related: [{ verb: holds, entity: form }, { verb: owns, entity: creator }]
---

# Only a Creator removes their form's entry questions

Only the Creator who owns a form removes its entry questions, whether a question on
the form or a proposed one they dismiss. Drafting never dismisses a proposed
question on its own.

## Rationale

Taking a question away changes what the form asks, which is the Creator's
decision alone.
