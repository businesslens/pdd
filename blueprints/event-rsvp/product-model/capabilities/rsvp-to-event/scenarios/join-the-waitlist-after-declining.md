---
kind: edge
routes:
  web: Web
steps:
  - text: The Guest opens their personal link and changes their answer from not going to going
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
  - text: The Product puts the Guest on the waitlist and says so
    kind: product
    actor: guest
    entities:
      - { entity: rsvp, from: Not going, to: Waitlisted, facts: [Responded at] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Join the waitlist after declining

## Trigger

A Guest who declined changes their mind after the event has filled.

## Outcome

The Guest is at the back of the waitlist, behind everyone who answered before
this change, and knows it.
