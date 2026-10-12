---
kind: primary
routes:
  web: Web
steps:
  - text: The Student picks a topic and enters a start and a length
    kind: actor
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [Name] }
    contexts:
      web:
        place: planner-web::schedule
  - text: The Product adds the planned session to the schedule
    kind: product
    actor: student
    entities:
      - { entity: study-session, effect: creates, to: Planned, facts: [Start, Planned minutes] }
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::schedule
---

# Add a session for a topic

## Trigger

The Student decides when they will study a topic.

## Outcome

The schedule shows the planned session with its topic, start and length.
