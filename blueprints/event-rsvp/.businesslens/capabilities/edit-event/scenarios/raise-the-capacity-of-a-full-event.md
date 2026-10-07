---
kind: edge
routes:
  web: Web
steps:
  - text: The Host raises the capacity of a full event that has a waitlist
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Capacity, Spots left] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product saves the new capacity, which opens spots on the event
    kind: product
    actor: host
    entities:
      - { entity: event, facts: [Capacity] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# Raise the capacity of a full event

## Trigger

The Host makes room for more people on an event whose waitlist is not empty.

## Outcome

The event has its new capacity and the new spots are open. Handing them to
waitlisted guests continues in waitlist promotion; the Host moves nobody
themselves.
