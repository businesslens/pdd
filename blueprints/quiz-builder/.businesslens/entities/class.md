---
domain: classes
relations:
  - entity: learner
    verb: enrolls
    cardinality: many-to-many
  - entity: quiz
    verb: assigns
    cardinality: many-to-many
---

# Class

A named group of learners a creator shares quizzes with.

## Information kept

- **Name** — what the class is called
- **Join code** — the code a learner enters to join it
- **Learners** — the learners who have joined it
- **Assigned quizzes** — the quizzes its creator has shared with it
