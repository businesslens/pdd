---
appliesTo:
  - type: entity
    id: response
    effect: reads
permits:
  - related: [{ verb: receives, entity: form }, { verb: owns, entity: creator }]
  - actors: [assistant]
---

# Only a Creator and the Assistant read a form's responses

A form's responses are read by the Creator who owns it, and by the Assistant
only when that Creator asks it to summarize them. Respondents never see each
other's answers.

## Rationale

People answer a form for the person who asked. Their answers must not reach
anyone else, and the Assistant reads them only on that person's behalf.
