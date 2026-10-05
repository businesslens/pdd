---
kind: edge
routes:
  web: Web
steps:
  - text: The Student accepts a plan after the goal's schedule changed
    kind: actor
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Prepared at] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: A session of the goal was scheduled, moved, cancelled or logged after the plan was prepared
    kind: condition
    entities:
      - { entity: study-session, effect: reads, facts: [] }
      - { entity: study-plan, effect: reads, facts: [Prepared at] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product marks the plan outdated and explains that it no longer matches the schedule
    kind: product
    actor: student
    entities:
      - { entity: study-plan, from: Proposed, to: Outdated, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The schedule is unchanged, and the Student can ask for a new plan
    kind: condition
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Refuse an outdated plan

## Trigger

The Student accepts a plan after changing the goal's schedule since the plan was prepared.

## Outcome

No session changes, the plan is outdated, and the Student knows to ask for a plan that matches the schedule.
