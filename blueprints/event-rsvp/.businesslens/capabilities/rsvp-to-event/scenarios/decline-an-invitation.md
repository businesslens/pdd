---
kind: primary
routes:
  web: Web
steps:
  - text: The Guest chooses not going on the invitation and gives their name and email
    kind: actor
    actor: guest
    entities: []
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product adds the Guest to the guest list as not going
    kind: product
    actor: guest
    entities:
      - { entity: guest, effect: creates, to: Not going, facts: [Name, Email, Plus-one, Responded at] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product emails the Guest a confirmation with a personal link to their answer
    kind: product
    actor: guest
    entities:
      - { entity: guest, effect: reads, facts: [Email] }
---

# Decline an invitation

## Trigger

A person holding the invitation link cannot come and wants the Host to know.

## Outcome

The Host's guest list shows the Guest as not going, no spot is taken, and the
Guest can change their mind through their personal link.
