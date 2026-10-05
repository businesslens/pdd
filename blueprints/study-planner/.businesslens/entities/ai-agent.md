---
kind: system
acts: external
relations:
  - entity: study-plan
    verb: prepares
    cardinality: one-to-many
---

# AI agent

An AI agent harness a Student connects to their planner. It reads the
Student's goals, topics, schedule and weekly availability on their behalf,
prepares study plans when the Student asks it to plan a goal, and prepares a
revised plan when it finds a missed session. It chooses what to read, how to
divide the study and when to look again; it changes nothing in the planner
except the plans it leaves for the Student to decide.
