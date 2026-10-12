---
kind: validation
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a habit and picks a day more than a week ago, or one still to come
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: The Product explains that only today and the six days before it can be checked off
    kind: product
    actor: owner
    entities: []
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
  - text: No check-in is recorded and the history is unchanged
    kind: condition
    actor: owner
    entities:
      - { entity: check-in, effect: reads, facts: [] }
    contexts: { web: { place: tracker-web::habit-detail }, mobile: { place: tracker-mobile::habit-detail } }
---

# Reject a day outside the past week

## Trigger

The Owner tries to check off a habit for a day before the past week or after
today.

## Outcome

Nothing is recorded, the Owner knows which days can be checked off, and the
habit's history and streak are unchanged.
