---
kind: validation
routes:
  web: Web
steps:
  - text: The Host enters details whose end comes before their start
    kind: actor
    actor: host
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-event } }
  - text: The Product refuses the details, says the end must come after the start, and keeps everything entered
    kind: product
    actor: host
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-event } }
---

# Refuse an event that ends before it starts

## Trigger

The Host tries to create an event whose end comes before its start.

## Outcome

No event is created, the Host knows what to correct, and nothing they entered
is lost.

## Edge cases

- The start is already in the past → the Product refuses it the same way.
