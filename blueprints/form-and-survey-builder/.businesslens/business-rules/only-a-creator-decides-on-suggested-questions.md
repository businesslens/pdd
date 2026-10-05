---
appliesTo:
  - type: entity
    id: suggested-question
    effect: changes
permits:
  - related: [{ verb: offers, entity: form }, { verb: owns, entity: creator }]
---

# Only a Creator decides on suggested questions

Only the Creator of the form a suggested question was drafted for accepts or
dismisses it. Until they do, it stays proposed and is no part of the form.

## Rationale

A suggestion is a proposal to one Creator about one form; accepting it is the
act that makes it a question, so it cannot be anyone else's.
