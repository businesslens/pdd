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
  - text: The Product asks the Student to confirm, and says how many planned sessions are cancelled and how many hours of logged study go with the topic for good
    kind: product
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [] }
      - { entity: study-session, as: planned, effect: reads, facts: [] }
      - { entity: study-session, as: logged, effect: reads, facts: [Logged minutes] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Student confirms
    kind: actor
    actor: student
    entities: []
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Product removes the topic with its planned and logged sessions for good
    kind: product
    actor: student
    entities:
      - { entity: topic, effect: removes }
      - { entity: study-session, as: planned, effect: removes, from: Planned, with: topic }
      - { entity: study-session, as: logged, effect: removes, from: Logged, with: topic }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The goal's progress no longer counts the topic's estimate or its logged hours
    kind: condition
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [] }
      - { entity: topic, effect: reads, facts: [Estimated hours] }
    contexts:
      web:
        place: planner-web::goal-detail
---

# Remove a topic

## Trigger

A topic turns out not to be part of what the Student must study.

## Outcome

The topic, its planned sessions and the study logged for it are gone for good, and the goal's progress counts only the topics left.

## Edge cases

- The Student does not confirm → the topic and its sessions stay as they were.
- The topic has no logged study → the confirmation names only the planned sessions that are cancelled.
