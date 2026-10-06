---
appliesTo:
  - type: entity
    id: choice-question
    effect: changes
    facts: [Show condition]
  - type: entity
    id: entry-question
    effect: changes
    facts: [Show condition]
  - type: entity
    id: form
    effect: changes
    facts: [Question order]
---

# A question is shown only after an earlier answer

A question's show condition names an option of a choice question asked before
it. Setting a condition on a later question, or moving a question above the
one its condition names, is refused.

## Rationale

A Respondent answers top to bottom, so a question can only wait on an answer
they have already had the chance to give.
