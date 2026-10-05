---
appliesTo:
  - type: entity
    id: study-plan
    effect: creates
permits:
  - actors: [ai-agent]
---

# Only the AI agent prepares study plans

A study plan is always the proposal of the AI agent the Student connected:
prepared when the Student asks it to plan a goal, or on its own after it finds
a missed session. The Student schedules sessions directly instead of writing a
plan.

## Rationale

A plan carries the agent's explanation of how it divided the study, so the
Student always knows that what they are reviewing came from their agent and
why.
