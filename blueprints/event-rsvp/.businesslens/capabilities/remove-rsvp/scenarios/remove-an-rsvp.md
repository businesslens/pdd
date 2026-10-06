---
kind: primary
routes:
  web: Web
steps:
  - text: The Host chooses an RSVP on their event's guest list, a maybe from someone they did not invite, and removes it
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Title] }
      - { entity: guest, effect: reads, facts: [] }
      - { entity: rsvp, effect: reads, facts: [Name, Email] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product asks the Host to confirm that the RSVP is removed for good
    kind: product
    actor: host
    entities:
      - { entity: rsvp, effect: reads, facts: [Name] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Host confirms
    kind: actor
    actor: host
    entities:
      - { entity: rsvp, effect: removes, from: Maybe }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Product emails the RSVP's guest that the Host removed it
    kind: product
    actor: host
    entities:
      - { entity: guest, effect: reads, facts: [] }
      - { entity: rsvp, effect: reads, facts: [Email] }
  - text: The guest list no longer shows the RSVP
    kind: product
    actor: host
    entities:
      - { entity: guest, effect: reads, facts: [] }
      - { entity: rsvp, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# Remove an RSVP

## Trigger

The Host finds an answer on their guest list that should not be there.

## Outcome

The RSVP is gone for good: the guest list no longer shows it, its personal
link no longer opens an answer, and its Guest has been told.

## Edge cases

- The Host leaves before confirming → the RSVP stays as it was and nobody is emailed.
- The RSVP is not going or waitlisted → it is removed the same way; a waitlisted one leaves the waitlist and nobody else's place changes.
- The removed Guest answers again through the invitation link → it is a new RSVP like any other, at the back of the waitlist if the event is full.
