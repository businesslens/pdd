---
appliesTo:
  - type: entity
    id: choice-question
    effect: changes
permits:
  - related: [{ verb: holds, entity: form }, { verb: owns, entity: creator }]
---

# Only a Creator changes their form's choice questions

Only the Creator who owns a form changes its choice questions, including accepting a
proposed one onto the form. Drafting never accepts a proposed question on its
own; it stays proposed until that Creator accepts or dismisses it.

## Rationale

Respondents answer what the Creator asked; a language model's draft can be
wrong, and nothing rewords a question after the Creator has put it on the form.
