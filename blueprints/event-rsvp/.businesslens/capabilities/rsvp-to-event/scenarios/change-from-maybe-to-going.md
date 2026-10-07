---
kind: primary
routes:
  web: Web
steps:
  - text: The Guest opens their personal link and changes their answer from maybe to going
    kind: actor
    actor: guest
    entities:
      - { entity: rsvp, effect: reads, facts: [Name, Plus-one] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The event has spots left for them and their plus-one
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [Spots left] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product records the Guest as going
    kind: product
    actor: guest
    entities:
      - { entity: rsvp, from: Maybe, to: Going, facts: [Responded at] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product emails the Guest a confirmation of their new answer
    kind: product
    actor: guest
    entities:
      - { entity: rsvp, effect: reads, facts: [Email] }
---

# Change from maybe to going

## Trigger

A Guest who answered maybe decides to come while there is still room.

## Outcome

The Guest holds their spots and the Host's guest list shows them as going.
