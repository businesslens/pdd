---
kind: validation
routes:
  web: Web
steps:
  - text: The Student enters a name and a target date that has already passed
    kind: actor
    actor: student
    entities: []
    contexts:
      web:
        place: planner-web::goals
  - text: The target date is before today
    kind: condition
    entities: []
    contexts:
      web:
        place: planner-web::goals
  - text: The Product explains that the target date must be today or later
    kind: product
    actor: student
    entities: []
    contexts:
      web:
        place: planner-web::goals
---

# Refuse a goal dated in the past

## Trigger

The Student enters a target date that has already passed.

## Outcome

No goal is created, and the name and date the Student entered remain available to correct.
