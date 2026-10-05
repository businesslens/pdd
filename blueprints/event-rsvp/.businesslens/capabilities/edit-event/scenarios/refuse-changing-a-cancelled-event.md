---
kind: validation
routes:
  web: Web
steps:
  - text: The Host tries to change the details of an event
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The event is cancelled
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product keeps the event as it is and explains that a cancelled event cannot be changed
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# Refuse changing a cancelled event

## Trigger

The Host tries to change the details of an event they already cancelled.

## Outcome

The cancelled event is unchanged, no guest is emailed, and the Host knows why.
