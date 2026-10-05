---
kind: primary
routes:
  web: Web
steps:
  - text: The Guest opens their personal link and sees they are going
    kind: actor
    actor: guest
    entities:
      - { entity: guest, effect: reads, facts: [Name, Plus-one] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Guest changes their answer to maybe
    kind: actor
    actor: guest
    entities: []
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product records the Guest as maybe, freeing the spots they held on the event
    kind: product
    actor: guest
    entities:
      - { entity: guest, from: Going, to: Maybe, facts: [Responded at] }
      - { entity: event, effect: reads, facts: [Spots left] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Change from going to maybe

## Trigger

A Guest who said yes is no longer sure they can come.

## Outcome

The Host's guest list shows the Guest as maybe and the spots they held are
open. Handing them to the waitlist continues in waitlist promotion.

## Edge cases

- The Guest changes to not going instead → the same spots open and the guest list shows them as not going.
- A waitlisted Guest changes to not going → they leave the waitlist and nobody else's place changes.
