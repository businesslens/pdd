---
kind: primary
routes:
  web: Web
steps:
  - text: The Student chooses to cancel a planned session
    kind: actor
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [Start] }
    contexts:
      web:
        place: planner-web::schedule
  - text: The Product removes the session from the schedule
    kind: product
    actor: student
    entities:
      - { entity: study-session, effect: removes, from: Planned }
    contexts:
      web:
        place: planner-web::schedule
  - text: The topic's estimate and logged hours are unchanged
    kind: condition
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::schedule
---

# Cancel a planned session

## Trigger

The Student will not study at a planned time and does not want to move it.

## Outcome

The session is no longer in the schedule, and the study it was for is still to do.

## Edge cases

- The session was already logged → it cannot be cancelled; the Student deletes it instead if it was logged by mistake.
