---
kind: person
acts: external
relations:
  - entity: habit
    verb: owns
    cardinality: one-to-many
  - entity: weekly-reflection
    verb: receives
    cardinality: one-to-many
---

# Owner

The one person whose habits these are. The Owner defines, checks off, pauses
and reviews their own habits, and nobody else reaches them.

## Information kept

- **Reflections** — whether the Owner wants a reflection prepared when each week ends: On or Off, and Off until they turn it on
