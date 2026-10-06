---
appliesTo:
  - type: entity
    id: entry-question
    effect: changes
permits:
  - related: [{ verb: holds, entity: form }, { verb: owns, entity: creator }]
---

# Only a Creator changes their form's entry questions

Only the Creator who owns a form changes its entry questions, including accepting a
proposed one onto the form.

## Rationale

Respondents answer what the Creator asked; nothing rewords a question after
the Creator has put it on the form.
