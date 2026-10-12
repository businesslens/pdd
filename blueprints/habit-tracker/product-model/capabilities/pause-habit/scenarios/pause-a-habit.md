---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner pauses an active habit
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Product sets the habit aside
    kind: product
    actor: owner
    entities:
      - { entity: habit, from: Active, to: Paused, facts: [] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The habit leaves Today and is listed as paused among the habits, with its streak kept
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Current streak] }
    contexts: { web: { place: tracker-web::habits }, mobile: { place: tracker-mobile::habits } }
---

# Pause a habit

## Trigger

The Owner wants a break from a habit without losing it.

## Outcome

The habit is paused: it is not due and takes no check-ins, and its schedule,
history and streak are kept.
