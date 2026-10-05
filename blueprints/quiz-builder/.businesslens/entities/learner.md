---
kind: person
acts: external
relations:
  - entity: account
    verb: uses
    cardinality: one-to-one
  - entity: attempt
    verb: makes
    cardinality: one-to-many
  - entity: practice-round
    verb: practices
    cardinality: one-to-many
---

# Learner

A person who joins classes, takes the quizzes shared with them, sees how they
did, and practices the questions they missed.
