---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner takes back the check-in recorded for a habit today
    kind: actor
    actor: owner
    entities:
      - { entity: habit, effect: reads, facts: [Name] }
      - { entity: check-in, effect: reads, facts: [Day] }
    contexts: { web: { place: tracker-web::today }, mobile: { place: tracker-mobile::today } }
  - text: The Product removes the check-in
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

# Take back a check-off

## Trigger

The Owner checked off a habit by mistake.

## Outcome

There is no check-in for today, the habit is due again, and its streak is as it
was before the mistake.

## Edge cases

- A day from the past week taken back on the habit itself → the day leaves the habit's history and the streak is counted again.
