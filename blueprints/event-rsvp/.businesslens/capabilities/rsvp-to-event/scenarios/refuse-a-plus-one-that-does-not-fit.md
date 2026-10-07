---
kind: validation
routes:
  web: Web
steps:
  - text: The Guest opens their personal link and adds a plus-one to their going answer
    kind: actor
    actor: guest
    entities:
      - { entity: rsvp, effect: reads, facts: [Name, Plus-one] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The event has no spots left
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [Spots left] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product refuses the plus-one, says the event is full, and keeps the Guest going alone
    kind: product
    actor: guest
    entities:
      - { entity: event, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Refuse a plus-one that does not fit

## Trigger

A Guest who is going tries to add a plus-one to a full event.

## Outcome

The Guest keeps their own spot without a plus-one, knows why, and the guest
list is unchanged.
