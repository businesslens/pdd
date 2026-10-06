---
kind: primary
routes:
  web: Web
steps:
  - text: The Student opens a goal
    kind: actor
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [Name, Target date] }
    contexts:
      web:
        place: planner-web::goals
  - text: The Product shows each topic's logged hours against its estimate
    kind: product
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [Name, Estimated hours] }
      - { entity: study-session, effect: reads, facts: [Logged minutes] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product shows the hours still to study and the days left before the target date
    kind: product
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [Target date] }
      - { entity: topic, effect: reads, facts: [Estimated hours] }
      - { entity: study-session, effect: reads, facts: [Logged minutes] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: Nothing about the goal or its topics changes
    kind: condition
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [] }
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
---

# See progress toward a goal

## Trigger

The Student wants to know whether they are on track for a goal.

## Outcome

The Student sees logged hours against estimates for every topic, the study still to do, and the days left.
