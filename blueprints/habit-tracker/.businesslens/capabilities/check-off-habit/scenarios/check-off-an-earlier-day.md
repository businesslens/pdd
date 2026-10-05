---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a habit and picks a day of the past week that has no check-in
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
      - { entity: check-in, effect: reads, facts: [Day] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Product records a check-in for that day
    kind: product
    actor: owner
    entities:
      - { entity: check-in, effect: creates, facts: [Day] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The day appears in the habit's history, and its streaks are counted again
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Current streak, Best streak] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
---

# Check off an earlier day

## Trigger

The Owner did a habit on a day of the past week but did not record it then.

## Outcome

The day is recorded as done, and a streak the missing record had broken is
whole again.
