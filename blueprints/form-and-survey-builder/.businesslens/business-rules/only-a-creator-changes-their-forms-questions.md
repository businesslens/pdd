---
appliesTo:
  - type: entity
    id: question
    effect: changes
permits:
  - related: [{ verb: holds, entity: form }, { verb: owns, entity: creator }]
---

# Only a Creator changes their form's questions

Only the Creator who owns a form changes a question on it — its prompt, answer
type, options, whether it is required, and when it is shown.

## Rationale

Respondents answer what the Creator asked; nothing rewords a question after
the Creator has put it on the form.
