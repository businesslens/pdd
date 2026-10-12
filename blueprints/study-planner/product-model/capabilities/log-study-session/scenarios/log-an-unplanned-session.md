---
kind: edge
routes:
  web: Web
steps:
  - text: The Student logs study that was not scheduled, picking the topic and entering when, how long and any notes
    kind: actor
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [Name] }
    contexts:
      web:
        place: planner-web::schedule
  - text: The Product adds the session to the schedule as logged
    kind: product
    actor: student
    entities:
      - { entity: study-session, effect: creates, to: Logged, facts: [Start, Logged minutes, Notes] }
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::schedule
---

# Log an unplanned session

## Trigger

The Student studied a topic without having planned it.

## Outcome

The study appears in the schedule as a logged session, and the goal's progress includes it.
