---
appliesTo:
  - type: entity
    id: attempt
    effect: reads
permits:
  - related: [{ verb: makes, entity: learner }]
  - related: [{ verb: receives, entity: quiz }, { verb: owns, entity: creator }]
  - actors: [quiz-assistant]
---

# Only its learner and the quiz's creator see an attempt

An attempt is seen by the learner who made it and by the Creator of its quiz.
Classmates never see each other's answers or scores. The Quiz assistant reads
an attempt only to assemble that learner's practice round.

## Rationale

Scores are personal. Sharing a quiz with a class must not expose one learner's
results to another.
