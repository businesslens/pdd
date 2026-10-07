---
appliesTo:
  - type: entity
    id: response
    effect: creates
---

# A form takes responses only while open

A response is received only while its form is open. A draft form has no public
link to answer, and a closed form's link says it is not taking responses,
including to someone who started answering before it closed.

## Rationale

Closing is the Creator's one control over when collecting ends, so it must hold
for every Respondent at once.
