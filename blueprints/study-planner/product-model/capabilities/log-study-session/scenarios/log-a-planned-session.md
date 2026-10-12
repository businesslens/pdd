---
kind: primary
routes:
  web: Web
steps:
  - text: The Student logs a planned session, entering the minutes studied and any notes
    kind: actor
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [Start, Planned minutes] }
    contexts:
      web:
        place: planner-web::schedule
  - text: The Product records the session as logged
    kind: product
    actor: student
    entities:
      - { entity: study-session, from: Planned, to: Logged, facts: [Logged minutes, Notes] }
    contexts:
      web:
        place: planner-web::schedule
  - text: The logged minutes count toward the topic's progress
    kind: condition
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [Logged minutes] }
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::schedule
---

# Log a planned session

## Trigger

The Student has finished, or partly finished, a planned session.

## Outcome

The session is logged with the minutes actually studied, and the goal's progress includes them.

## Edge cases

- The session is shown as missed → logging it late records it the same way, and it is no longer missed.
- The Student studied for longer or shorter than planned → the logged minutes count, never the planned ones.
