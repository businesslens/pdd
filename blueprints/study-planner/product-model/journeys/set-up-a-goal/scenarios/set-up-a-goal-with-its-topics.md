---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Student enters a name and a target date
    kind: actor
    actor: student
    capability: create-goal
    entities: []
    contexts:
      web:
        place: planner-web::goals
  - text: The Product creates the goal
    kind: product
    actor: student
    capability: create-goal
    entities:
      - { entity: goal, effect: creates, facts: [Name, Target date] }
    contexts:
      web:
        place: planner-web::goals
  - text: The Product opens the new goal, ready to be broken into topics
    kind: product
    actor: student
    capability: create-goal
    entities:
      - { entity: goal, effect: reads, facts: [Name, Target date] }
      - { entity: topic, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::goal-detail
  - text: The Student adds a topic with the hours of study they expect it to need
    kind: actor
    actor: student
    capability: add-topic
    entities:
      - { entity: topic, effect: creates, facts: [Name, Estimated hours] }
    contexts:
      web:
        place: planner-web::goal-detail
---

# Set up a goal with its topics

## Trigger

The Student has an exam or another dated goal to prepare for.

## Outcome

The Journey goal is achieved: the goal exists with its date and an estimated topic.
