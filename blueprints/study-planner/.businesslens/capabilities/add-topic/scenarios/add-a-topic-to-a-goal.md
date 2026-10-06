---
kind: primary
routes:
  web: Web
steps:
  - text: The Student enters a name and the hours of study they expect it to need
    kind: actor
    actor: student
    entities: []
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product adds the topic to the goal
    kind: product
    actor: student
    entities:
      - { entity: topic, effect: creates, facts: [Name, Estimated hours] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The goal's study still to do grows by the topic's estimate
    kind: condition
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [] }
      - { entity: topic, effect: reads, facts: [Estimated hours] }
    contexts:
      web:
        place: planner-web::goal-detail
---

# Add a topic to a goal

## Trigger

The Student knows a part of the goal they need to study.

## Outcome

The goal lists the new topic with its estimate, and the hours still to study include it.
