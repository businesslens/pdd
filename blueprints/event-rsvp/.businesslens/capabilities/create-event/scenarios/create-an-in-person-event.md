---
kind: primary
routes:
  web: Web
steps:
  - text: The Host starts a new event from the list of their events
    kind: actor
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::hosting::events } }
  - text: The Host enters a title, a description, the start and end, the place, a capacity and whether plus-ones are allowed
    kind: actor
    actor: host
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-event } }
  - text: The Product creates a scheduled event owned by the Host, with an invitation link of its own
    kind: product
    actor: host
    entities:
      - { entity: event, effect: creates, to: Scheduled, facts: [Title, Description, Starts at, Ends at, Place, Capacity, Plus-ones allowed, Invitation link] }
    contexts: { web: { place: rsvp-web::hosting::new-event } }
  - text: The Product opens the new event with its invitation link ready to share
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Title, Invitation link] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# Create an in-person event

## Trigger

The Host wants to invite people to something they are holding at a place.

## Outcome

A scheduled event exists with its details, all its capacity as spots left, and
a public invitation link the Host can share. Nobody has answered yet.

## Edge cases

- No capacity is given → the event has no limit and nobody is ever waitlisted.
- Neither a place nor an online link is given → the Product asks for one and creates nothing.
