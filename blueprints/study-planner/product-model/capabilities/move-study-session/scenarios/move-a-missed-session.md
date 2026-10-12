---
kind: edge
routes:
  web: Web
steps:
  - text: The Student moves a session shown as missed to a later day
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
      - { entity: study-session, facts: [Start] }
    contexts:
      web:
        place: planner-web::schedule
  - text: The session is upcoming again and no longer shown as missed
    kind: condition
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [Start] }
    contexts:
      web:
        place: planner-web::schedule
---

# Move a missed session

## Trigger

The Student wants to make up a session they missed.

## Outcome

The missed study is back in the schedule on a day still ahead.
