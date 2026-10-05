---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a habit and gives it a new name
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Product saves the new name
    kind: product
    actor: owner
    entities:
      - { entity: habit, facts: [Name] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The habit keeps its schedule, history and streak under its new name
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name, Schedule, Current streak] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
---

# Rename a habit

## Trigger

The Owner wants a habit called something else.

## Outcome

The habit has its new name everywhere it is listed, and nothing else about it
has changed.

## Edge cases

- The Owner clears the name → the Product refuses to save until the habit has a name, and the old one stays.
