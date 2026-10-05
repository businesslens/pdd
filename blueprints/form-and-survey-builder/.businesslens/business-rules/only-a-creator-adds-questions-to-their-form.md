---
appliesTo:
  - type: entity
    id: question
    effect: creates
permits:
  - related: [{ verb: holds, entity: form }, { verb: owns, entity: creator }]
---

# Only a Creator adds questions to their form

A question joins a form only by its Creator's act: adding it by hand, or
accepting a suggested question. Drafting proposes suggested questions and never
adds a question itself.

## Rationale

What a form asks is the Creator's decision. Drafted suggestions shorten the
work but must never put a question in front of Respondents that the Creator did
not choose.
