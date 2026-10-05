---
kind: validation
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a paused habit and tries to check off a day
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Product explains that a paused habit takes no check-ins until it is resumed
    kind: product
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [] }
      - { entity: check-in, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: No check-in is recorded, and the habit stays paused
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [] }
      - { entity: check-in, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
---

# Reject checking off a paused habit

## Trigger

The Owner tries to check off a day for a habit that is paused.

## Outcome

Nothing is recorded and the habit stays paused, with the way to resume it in
reach.
