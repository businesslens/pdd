---
kind: primary
routes:
  web: Web
steps:
  - text: The Student edits the goal's name and target date
    kind: actor
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [Name, Target date] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product saves the goal with its new name and target date
    kind: product
    actor: student
    entities:
      - { entity: goal, facts: [Name, Target date] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The goal's topics and scheduled sessions are untouched
    kind: condition
    entities:
      - { entity: goal, effect: reads, facts: [] }
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
---

# Change a goal's target date

## Trigger

The date the Student is studying toward changes, or the goal needs a clearer name.

## Outcome

The goal shows its new name and target date, and nothing else in the planner has moved.

## Edge cases

- The new target date has already passed → the Product refuses it as when the goal was created, and the goal keeps its date.
- Sessions are planned after the new target date → they stay where they are until the Student moves them or accepts a new study plan.
