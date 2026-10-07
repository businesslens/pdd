---
kind: edge
routes:
  web: Web
steps:
  - text: The Student opens a goal whose target date has passed
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
  - text: The goal is shown as past, and no study plan can be asked for it
    kind: condition
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [Target date] }
      - { entity: study-plan, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
---

# See progress on a past goal

## Trigger

The Student looks back at a goal whose target date has passed.

## Outcome

The Student sees how much of each topic they studied, and the goal is marked as past.
