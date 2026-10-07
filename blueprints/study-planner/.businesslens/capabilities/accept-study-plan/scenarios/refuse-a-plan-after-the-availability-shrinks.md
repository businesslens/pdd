---
kind: edge
routes:
  web: Web
steps:
  - text: The Student accepts a plan after reducing their weekly availability
    kind: actor
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Prepared at] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: A proposed session now falls outside the Student's current weekly availability
    kind: condition
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions] }
      - { entity: student, effect: reads, facts: [Weekly availability] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product refuses the plan, closes it as outdated and names the sessions that no longer fit the availability
    kind: product
    actor: student
    entities:
      - { entity: study-plan, from: Proposed, to: Outdated, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The schedule is unchanged, and the Student can ask for a new plan built around the availability they have now
    kind: condition
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [] }
      - { entity: study-session, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Refuse a plan after the availability shrinks

## Trigger

The Student accepts a plan whose sessions were placed in hours they have since removed from their weekly availability.

## Outcome

No session changes, the plan is outdated, and the Student knows the plan no longer fits the hours they can study.
