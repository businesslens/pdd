---
appliesTo:
  - type: capability
    id: draft-questions
  - type: capability
    id: add-question
  - type: capability
    id: take-quiz
---

# A drafted question reaches learners only once its creator adds it

A question the Quiz assistant drafts is kept beside the quiz, not in it. It is
never asked in an attempt, never counted in a score or a result, and never
repeated in practice until the Creator adds it to the quiz.

## Rationale

Drafted questions can be wrong in ways only the Creator can judge. Keeping them
out of the quiz until approved makes the assistant's work a proposal, never a
publication.
