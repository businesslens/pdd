---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner unchecks a habit checked off today
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
      - { entity: check-in, effect: reads, facts: [Day] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
  - text: The Product removes today's check-in
    kind: product
    actor: owner
    entities:
      - { entity: check-in, effect: removes }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
  - text: The habit is due again today, and its current streak no longer counts today
    kind: condition
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Current streak] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
---

# Uncheck a habit done today

## Trigger

The Owner checked off a habit by mistake.

## Outcome

There is no check-in for today, the habit is due again, and its streak is as it
was before the mistake.
