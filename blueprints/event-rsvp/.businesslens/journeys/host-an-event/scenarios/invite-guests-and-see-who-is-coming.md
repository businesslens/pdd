---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Host creates an event with its time, place and capacity
    kind: actor
    actor: host
    capability: create-event
    entities:
      - { entity: event, effect: creates, to: Scheduled, facts: [Title, Description, Starts at, Ends at, Place, Capacity, Plus-ones allowed, Invitation link] }
    contexts: { web: { place: rsvp-web::hosting::new-event } }
  - text: The Product opens the new event with its invitation link, before anyone has answered
    kind: product
    actor: host
    capability: view-guest-list
    entities:
      - { entity: event, effect: reads, facts: [Title, Invitation link] }
    contexts: { web: { place: rsvp-web::hosting::event } }
  - text: The Host shares the invitation link outside the Product
    kind: actor
    actor: host
    entities: []
  - text: A Guest answers going through the invitation link
    kind: actor
    actor: guest
    capability: rsvp-to-event
    entities:
      - { entity: guest, effect: creates, to: Going, facts: [Name, Email, Plus-one, Responded at] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Host sees the Guest on the event's guest list as going
    kind: actor
    actor: host
    capability: view-guest-list
    entities:
      - { entity: guest, effect: reads, facts: [Name, Plus-one] }
      - { entity: event, effect: reads, facts: [Spots left] }
    contexts: { web: { place: rsvp-web::hosting::event } }
---

# Invite guests and see who is coming

## Trigger

The Host decides to hold an event and invite people to it.

## Outcome

The Journey goal is achieved: the event is scheduled, its link is shared, and
the Host sees the answers on the guest list as they arrive.
