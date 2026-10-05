---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Guest answers going on the invitation with their name and email
    kind: actor
    actor: guest
    capability: rsvp-to-event
    entities:
      - { entity: guest, effect: creates, to: Going, facts: [Name, Email, Plus-one, Responded at] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product emails the Guest a confirmation with a personal link to their answer
    kind: product
    actor: guest
    entities:
      - { entity: guest, effect: reads, facts: [Email] }
  - text: Later, the Guest follows the personal link and sees their answer
    kind: actor
    actor: guest
    capability: open-invitation
    entities:
      - { entity: guest, effect: reads, facts: [Name, Plus-one] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Guest changes their answer to maybe
    kind: actor
    actor: guest
    capability: change-rsvp
    entities:
      - { entity: guest, from: Going, to: Maybe, facts: [Responded at] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Say yes, then change to maybe

## Trigger

A Guest answers yes and later becomes unsure they can come.

## Outcome

The Journey goal is achieved: the guest list shows the Guest as maybe, and the
spot they held is open for someone else.
