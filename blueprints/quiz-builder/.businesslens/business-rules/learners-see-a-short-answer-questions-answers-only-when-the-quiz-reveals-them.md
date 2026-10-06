---
appliesTo:
  - type: entity
    id: short-answer-question
    effect: reads
    facts: [Accepted answers, Explanation]
permits:
  - related: [{ verb: contains, entity: quiz }, { verb: owns, entity: creator }]
  - actors: [learner]
    when: [{ entity: quiz, fact: Answer reveal, is: true }]
---

# Learners see a short-answer question's answers only when the quiz reveals them

A short-answer question's accepted answers and explanation are always the
Creator's to see. A learner sees them only after submitting, and only when the
quiz reveals answers; otherwise their attempt and their practice show only which
answers were right.

## Rationale

A Creator who reuses a quiz, or uses it as an assessment, must be able to keep
its answers from circulating among learners.
