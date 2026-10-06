---
kind: person
acts: external
relations:
  - entity: account
    verb: uses
    cardinality: one-to-one
  - entity: quiz
    verb: owns
    cardinality: one-to-many
  - entity: class
    verb: owns
    cardinality: one-to-many
---

# Creator

A person who builds quizzes, accepts or dismisses the questions the Product
drafts, shares quizzes with learners, and reviews and grades their results — a
teacher, a trainer, or anyone checking what others have learned.
