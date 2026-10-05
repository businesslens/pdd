---
kind: system
acts: internal
relations:
  - entity: study-plan
    verb: prepares
    cardinality: one-to-many
---

# Planning assistant

The AI assistant inside the planner. It reads a Student's goals, topics,
schedule and weekly availability, and prepares study plans for the Student to
review: when the Student asks for one, and on its own when sessions are missed.
It chooses how to divide the remaining study into sessions, and it changes
nothing in the Student's planner except the plans it prepares.
