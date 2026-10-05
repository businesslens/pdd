---
kind: primary
routes:
  web: Web
steps:
  - text: The Host opens one of their events
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Title, Capacity, Spots left] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product lists the event's guests by answer, with their plus-ones and the waitlist in order
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [] }
      - { entity: guest, effect: reads, facts: [Name, Email, Plus-one, Responded at] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product totals the people going, plus-ones included, against the event's capacity
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Capacity, Spots left] }
      - { entity: guest, effect: reads, facts: [Plus-one] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# See who answered

## Trigger

The Host wants to know who has answered their event.

## Outcome

The Host sees every guest under their current answer, the waitlist in the
order it will move, and how many people are going against the capacity.
