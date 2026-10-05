---
kind: edge
routes:
  web: Web
steps:
  - text: The Host lowers the capacity of an event below the number already going
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Capacity, Spots left] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product saves the new capacity and shows no spots left
    kind: product
    actor: host
    entities:
      - { entity: event, facts: [Capacity] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: Every guest already going keeps their spot
    kind: condition
    entities:
      - { entity: guest, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# Lower capacity without removing guests

## Trigger

The Host lowers an event's capacity after more people than the new number have
said yes.

## Outcome

The event has its new capacity and no spots left. Nobody loses a spot; new yes
answers join the waitlist until enough guests change their answer.
