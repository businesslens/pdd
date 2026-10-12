---
domain: goals
relations:
  - entity: topic
    verb: covers
    cardinality: one-to-many
  - entity: study-plan
    verb: is planned in
    cardinality: one-to-many
---

# Goal

Something a Student is studying toward by a date, such as passing an exam.
Once its target date has passed, the goal is past: its progress stays readable
and no plan is built or proposed for it.

## Information kept

- **Name** — what the Student calls the goal
- **Target date** — the day the goal must be reached by, such as the exam date
