---
kind: primary
routes:
  web: Web
steps:
  - text: The Student reviews the plan and dismisses it
    kind: actor
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Explanation] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product marks the plan dismissed
    kind: product
    actor: student
    entities:
      - { entity: study-plan, from: Proposed, to: Dismissed, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The schedule is unchanged and the plan no longer waits in Plans
    kind: condition
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [] }
      - { entity: study-plan, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Dismiss a proposed plan

## Trigger

The Student does not want a proposed plan.

## Outcome

The plan is dismissed and every session in the schedule is as it was.
