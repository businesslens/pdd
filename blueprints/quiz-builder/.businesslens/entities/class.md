---
domain: classes
relations:
  - entity: enrollment
    verb: has
    cardinality: one-to-many
  - entity: quiz
    verb: assigns
    cardinality: many-to-many
---

# Class

A named group of learners a creator shares quizzes with.

## Information kept

- **Name** — what the class is called
- **Join code** — the code a learner enters to join it
- **Assigned quizzes** — the quizzes its creator has shared with it
