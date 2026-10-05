---
kind: primary
routes:
  web: Web
steps:
  - text: The Student moves a planned session to a new start or length
    kind: actor
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [Start, Planned minutes] }
    contexts:
      web:
        place: planner-web::schedule
  - text: The Product saves the session at its new time
    kind: product
    actor: student
    entities:
      - { entity: study-session, facts: [Start, Planned minutes] }
    contexts:
      web:
        place: planner-web::schedule
---

# Move a planned session

## Trigger

A planned session no longer fits the Student's day.

## Outcome

The session is in the schedule at its new start and length, for the same topic.

## Edge cases

- The new time overlaps another session → the Product refuses it as when scheduling, and the session keeps its time.
