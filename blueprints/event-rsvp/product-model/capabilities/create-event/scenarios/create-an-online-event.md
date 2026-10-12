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
  - text: The Host enters a title, a description, the start and end, the online link, a capacity and whether plus-ones are allowed
    kind: actor
    actor: host
    entities: []
    contexts: { web: { place: rsvp-web::hosting::new-event } }
  - text: The Product creates a scheduled event owned by the Host, with an invitation link of its own
    kind: product
    actor: host
    entities:
      - { entity: event, effect: creates, to: Scheduled, facts: [Title, Description, Starts at, Ends at, Online link, Capacity, Plus-ones allowed, Invitation link] }
    contexts: { web: { place: rsvp-web::hosting::new-event } }
  - text: The Product opens the new event with its invitation link ready to share
    kind: product
    actor: host
    entities:
      - { entity: event, effect: reads, facts: [Title, Invitation link] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# Create an online event

## Trigger

The Host wants to invite people to something held online.

## Outcome

A scheduled online event exists with a public invitation link. The invitation
says the event is online; where to join is kept for the Host and the event's
guests.

## Edge cases

- A place and an online link are both given → the event is held in both ways and the invitation shows the place to everyone.
