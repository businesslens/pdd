---
appliesTo:
  - type: entity
    id: study-plan
    effect: creates
permits:
  - actors: [planning-assistant]
---

# Only the Planning assistant prepares study plans

A study plan is always the Planning assistant's proposal: prepared when the
Student asks for one, or on the assistant's own initiative after a missed
session. The Student schedules sessions directly instead of writing a plan.

## Rationale

A plan carries the assistant's explanation of how it divided the study, so the
Student always knows that what they are reviewing came from the assistant and
why.
