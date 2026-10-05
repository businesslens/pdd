---
kind: primary
routes:
  web: Web
steps:
  - text: The Student reviews the plan and declines it
    kind: actor
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Explanation] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product marks the plan declined
    kind: product
    actor: student
    entities:
      - { entity: study-plan, from: Proposed, to: Declined, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The schedule is unchanged and the plan no longer waits in Plans
    kind: condition
    entities:
      - { entity: study-session, effect: reads, facts: [] }
      - { entity: study-plan, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plans
---

# Decline a proposed plan

## Trigger

The Student does not want a proposed plan.

## Outcome

The plan is declined and every session in the schedule is as it was.
