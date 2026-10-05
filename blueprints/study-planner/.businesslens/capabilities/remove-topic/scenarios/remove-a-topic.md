---
kind: primary
routes:
  web: Web
steps:
  - text: The Student chooses to remove a topic from the goal
    kind: actor
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [Name] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product asks the Student to confirm, and says how many upcoming planned sessions will be cancelled with it
    kind: product
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [] }
      - { entity: study-session, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Student confirms
    kind: actor
    actor: student
    entities:
      - { entity: topic, effect: removes }
      - { entity: study-session, effect: removes, from: Planned }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: Sessions already logged stay in the history and keep counting toward the goal's logged hours
    kind: condition
    entities:
      - { entity: study-session, effect: reads, facts: [Logged minutes] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
---

# Remove a topic

## Trigger

A topic turns out not to be part of what the Student must study.

## Outcome

The topic and its upcoming planned sessions are gone, and the study already logged for it is kept.

## Edge cases

- The Student declines to confirm → the topic and its sessions stay as they were.
