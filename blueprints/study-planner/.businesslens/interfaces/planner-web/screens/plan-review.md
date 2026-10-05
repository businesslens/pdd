---
entities:
  - { entity: study-plan, shows: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
  - { entity: goal, shows: [Name, Target date] }
entryPoints:
  - planner-web: /plans/:planId
---

# Plan review

Presents one study plan for its goal: the sessions it would schedule, the
upcoming sessions it would replace, any study that does not fit before the
target date, and the agent's explanation. This is where the Student accepts
or declines it.
