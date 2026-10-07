---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a habit and unchecks a day of the past week that has a check-in
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
      - { entity: check-in, effect: reads, facts: [Day] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Product removes that day's check-in
    kind: product
    actor: owner
    entities:
      - { entity: check-in, effect: removes }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The day leaves the habit's history, and its streaks are counted again
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Current streak, Best streak] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
---

# Uncheck an earlier day

## Trigger

The Owner recorded a day of the past week that they did not actually do the
habit on.

## Outcome

The day is no longer recorded as done, and the habit's streaks are counted
without it.

## Edge cases

- A day before the past week → the habit offers no way to uncheck it, and its history stays as it is.
