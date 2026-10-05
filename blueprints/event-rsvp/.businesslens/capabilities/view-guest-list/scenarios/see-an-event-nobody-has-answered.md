---
kind: edge
routes:
  web: Web
steps:
  - text: The Host opens one of their events
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Title, Invitation link] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: No guest has answered the event yet
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [] }
      - { entity: guest, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product shows an empty guest list beside the invitation link to share
    kind: product
    actor: host
    entities:
      - { entity: guest, effect: reads, facts: [] }
      - { entity: event, effect: reads, facts: [Invitation link] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# See an event nobody has answered

## Trigger

The Host opens an event before anyone has answered it.

## Outcome

The Host sees that nobody has answered yet and has the invitation link at hand
to share.
