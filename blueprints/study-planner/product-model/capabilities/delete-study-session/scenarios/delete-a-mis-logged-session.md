---
kind: primary
routes:
  web: Web
steps:
  - text: The Student chooses to delete a logged session
    kind: actor
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [Start, Logged minutes] }
    contexts:
      web:
        place: planner-web::schedule
  - text: The Product asks the Student to confirm, and says the logged minutes come off the topic's progress for good
    kind: product
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [Logged minutes] }
      - { entity: topic, effect: reads, facts: [Name] }
    contexts:
      web:
        place: planner-web::schedule
  - text: The Student confirms
    kind: actor
    actor: student
    entities: []
    contexts:
      web:
        place: planner-web::schedule
  - text: The Product deletes the session for good
    kind: product
    actor: student
    entities:
      - { entity: study-session, effect: removes, from: Logged }
    contexts:
      web:
        place: planner-web::schedule
  - text: The topic's logged hours no longer include the session's minutes
    kind: condition
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [] }
      - { entity: study-session, effect: reads, facts: [Logged minutes] }
    contexts:
      web:
        place: planner-web::schedule
---

# Delete a mis-logged session

## Trigger

The Student logged study that did not happen as recorded, such as against the wrong topic or with the wrong minutes.

## Outcome

The session is gone for good, the goal's progress no longer counts it, and the Student can log the study again correctly.

## Edge cases

- The Student does not confirm → the session stays logged and keeps counting.
