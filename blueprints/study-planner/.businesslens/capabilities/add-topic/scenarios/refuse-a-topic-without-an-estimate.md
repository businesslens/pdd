---
kind: validation
routes:
  web: Web
steps:
  - text: The Student enters a name without the hours of study they expect it to need
    kind: actor
    actor: student
    entities: []
    contexts:
      web:
        place: planner-web::goal-detail
  - text: No estimate in hours was given
    kind: condition
    entities: []
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product explains that every topic needs an estimate in hours
    kind: product
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
---

# Refuse a topic without an estimate

## Trigger

The Student adds a topic without saying how many hours it needs.

## Outcome

No topic is added, and the name the Student entered remains available to complete.
