---
kind: edge
routes:
  web: Web
steps:
  - text: The Guest chooses going on the invitation and gives their name and email
    kind: actor
    actor: guest
    entities: []
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The event has no spots left
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [Spots left] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product adds the Guest to the waitlist and says so
    kind: product
    actor: guest
    entities:
      - { entity: guest, effect: creates, to: Waitlisted, facts: [Name, Email, Plus-one, Responded at] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product emails the Guest that they are waitlisted, with a personal link to their answer
    kind: product
    actor: guest
    entities:
      - { entity: guest, effect: reads, facts: [Email] }
---

# Join the waitlist of a full event

## Trigger

A person says yes to an event that has no spots left.

## Outcome

The Guest is on the waitlist behind everyone who answered before them, knows
it, and will be emailed if a spot comes to them.
