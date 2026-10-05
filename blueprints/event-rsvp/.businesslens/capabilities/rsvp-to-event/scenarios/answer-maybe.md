---
kind: primary
routes:
  web: Web
steps:
  - text: The Guest chooses maybe on the invitation and gives their name and email
    kind: actor
    actor: guest
    entities: []
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product adds the Guest to the guest list as maybe, holding no spot
    kind: product
    actor: guest
    entities:
      - { entity: guest, effect: creates, to: Maybe, facts: [Name, Email, Plus-one, Responded at] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product emails the Guest a confirmation with a personal link to their answer
    kind: product
    actor: guest
    entities:
      - { entity: guest, effect: reads, facts: [Email] }
---

# Answer maybe

## Trigger

A person holding the invitation link is not sure yet whether they can come.

## Outcome

The Host's guest list shows the Guest as maybe, no spot is taken, and the Guest
can settle their answer later through their personal link.
