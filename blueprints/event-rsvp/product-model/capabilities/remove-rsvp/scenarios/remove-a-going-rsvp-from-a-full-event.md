---
kind: edge
routes:
  web: Web
steps:
  - text: The Host removes a going RSVP with a plus-one from a full event that has a waitlist, and confirms
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Spots left] }
      - { entity: rsvp, effect: removes, from: Going }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product emails the RSVP's guest that the Host removed it
    kind: product
    actor: host
    entities:
      - { entity: guest, effect: reads, facts: [] }
      - { entity: rsvp, effect: reads, facts: [Email] }
  - text: The two spots the RSVP held open on the event
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Spots left] }
      - { entity: rsvp, effect: reads, facts: [Plus-one] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# Remove a going RSVP from a full event

## Trigger

The Host removes an answer that was holding spots while guests are waiting.

## Outcome

The RSVP is gone and the two spots it held are open. Handing them to
waitlisted guests continues in waitlist promotion; the Host picks nobody.
