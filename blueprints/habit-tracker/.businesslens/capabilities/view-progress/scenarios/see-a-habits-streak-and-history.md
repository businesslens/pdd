---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a habit from their habits
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name, Schedule, Current streak] }
    contexts: { web: { place: tracker-web::habits }, mobile: { place: tracker-mobile::habits } }
  - text: The Product presents the habit's schedule, the day it started, its current and best streak, and the days it was done
    kind: product
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name, Schedule, Started on, Current streak, Best streak] }
      - { entity: check-in, effect: reads, facts: [Day] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: Nothing about the habit or its check-ins changes
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [] }
      - { entity: check-in, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
---

# See a habit's streak and history

## Trigger

The Owner wants to know how a habit is going.

## Outcome

The Owner sees the habit's current and best streak and every day it was done,
and nothing has changed.

## Edge cases

- A habit with no check-ins yet → its streaks read zero and its history is empty from the day it started.
