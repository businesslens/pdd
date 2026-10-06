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
proposed one onto the form.

## Rationale

Respondents answer what the Creator asked; nothing rewords a question after
the Creator has put it on the form.
