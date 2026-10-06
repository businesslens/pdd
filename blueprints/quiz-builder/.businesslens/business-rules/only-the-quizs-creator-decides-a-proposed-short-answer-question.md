---
appliesTo:
  - type: entity
    id: short-answer-question
    from: Proposed
permits:
  - related: [{ verb: contains, entity: quiz }, { verb: owns, entity: creator }]
---

# Only the quiz's creator decides a proposed short-answer question

A proposed short-answer question leaves Proposed only when the Creator who owns
the quiz accepts or dismisses it. The language model that drafted it never does.

## Rationale

A language model writes the drafts, and they can be wrong in ways only the
Creator can judge.
