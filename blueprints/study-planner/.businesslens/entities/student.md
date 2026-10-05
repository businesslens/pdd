---
kind: person
acts: external
relations:
  - entity: goal
    verb: owns
    cardinality: one-to-many
---

# Student

A person planning their own study toward one or more goals. Each Student has
one private planner, and is the only person who changes it.

## Information kept

- **Weekly availability** — the hours on each day of the week the Student can study, which study plans are built around
