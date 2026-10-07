---
kind: primary
routes:
  web: Web
steps:
  - text: The Guest chooses going on the invitation and adds a plus-one
    kind: actor
    actor: guest
    entities: []
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Guest gives their name and email
    kind: actor
    actor: guest
    entities: []
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The event has spots left for both of them
    kind: condition
    entities:
      - { entity: event, effect: reads, facts: [Spots left, Plus-ones allowed] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product adds the Guest to the guest list as going with their plus-one
    kind: product
    actor: guest
    entities:
      - { entity: rsvp, effect: creates, to: Going, facts: [Name, Email, Plus-one, Responded at, Personal link] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product emails the Guest a confirmation with a personal link to their answer
    kind: product
    actor: guest
    entities:
      - { entity: rsvp, effect: reads, facts: [Email, Personal link] }
---

# Say yes with a plus-one

## Trigger

A person holding the invitation link decides to come and bring someone.

## Outcome

The Guest and their plus-one hold two spots, the Host's guest list shows them
as going, and the Guest has a confirmation with a personal link to their
answer.

## Edge cases

- The Host does not allow plus-ones → the invitation offers none and the Guest answers alone.
- One spot is left → the Guest may take it without the plus-one, or both join the waitlist.
- The email has already answered this event → the Product adds no second RSVP, changes nothing, and emails that address its personal link again.
