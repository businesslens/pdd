---
appliesTo:
  - type: entity
    id: response
    effect: reads
permits:
  - related: [{ verb: receives, entity: form }, { verb: owns, entity: creator }]
---

# Only a Creator reads their form's responses

A form's responses are read only by the Creator who owns it. Respondents never
see each other's answers. The Product passes written answers to a language
model only when that Creator asks for a summary of them.

## Rationale

People answer a form for the person who asked, and their answers must not
reach anyone else or leave the Product except on that person's request.
