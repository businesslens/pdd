---
appliesTo:
  - type: entity
    id: choice-question
    effect: reads
    facts: [Correct answer, Explanation]
permits:
  - related: [{ verb: contains, entity: quiz }, { verb: owns, entity: creator }]
  - actors: [learner]
    when: [{ entity: quiz, fact: Answer reveal, is: true }]
---

# Learners see a choice question's answer only when the quiz reveals it

A choice question's correct answer and explanation are always the Creator's to
see. A learner sees them only after submitting, and only when the quiz reveals
answers; otherwise their attempt and their practice show only which answers
were right.

## Rationale

A Creator who reuses a quiz, or uses it as an assessment, must be able to keep
its answers from circulating among learners.
