---
kind: validation
routes:
  web: Web
steps:
  - text: The Host chooses an RSVP on their event's guest list and removes it
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Title] }
      - { entity: guest, effect: reads, facts: [] }
      - { entity: rsvp, effect: reads, facts: [Name] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The event has already started
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [Starts at] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product keeps the RSVP and explains that the guest list closed when the event started
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [] }
      - { entity: guest, effect: reads, facts: [] }
      - { entity: rsvp, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# Refuse removing an RSVP once the event has started

## Trigger

The Host tries to remove an answer after the event's start time.

## Outcome

The guest list stays as it stood when the event started, and the Host knows
why.
