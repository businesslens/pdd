---
kind: primary
routes:
  web: Web
steps:
  - text: The Student changes a topic's name or estimated hours
    kind: actor
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [Name, Estimated hours] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product saves the topic
    kind: product
    actor: student
    entities:
      - { entity: topic, facts: [Name, Estimated hours] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: Sessions already logged for the topic still count toward it
    kind: condition
    entities:
      - { entity: topic, effect: reads, facts: [] }
      - { entity: study-session, effect: reads, facts: [Logged minutes] }
    contexts:
      web:
        place: planner-web::goal-detail
---

# Change a topic's estimate

## Trigger

The Student finds a topic needs more or less study than they first thought.

## Outcome

The topic shows its new estimate, and the goal's hours still to study follow it.

## Edge cases

- The new estimate is below the hours already logged → the topic shows as fully studied, and nothing logged is lost.
