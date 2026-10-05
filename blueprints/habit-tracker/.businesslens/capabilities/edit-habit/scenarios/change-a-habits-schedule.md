---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a habit and chooses a different schedule for it
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name, Schedule] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Product saves the new schedule, due from today
    kind: product
    actor: owner
    entities:
      - { entity: habit, facts: [Schedule] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: Earlier days keep counting against the schedule they had, so the history and streak are unchanged
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Current streak, Best streak] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: Today lists the habit on the days its new schedule makes it due
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Schedule] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
---

# Change a habit's schedule

## Trigger

The Owner finds a habit's schedule no longer fits, such as every day when four
times a week is realistic.

## Outcome

The habit follows the new schedule from today, and its earlier history and
streak are exactly as they were.

## Edge cases

- The new schedule has no days → the Product refuses it as it does for a new habit and keeps the old schedule.
