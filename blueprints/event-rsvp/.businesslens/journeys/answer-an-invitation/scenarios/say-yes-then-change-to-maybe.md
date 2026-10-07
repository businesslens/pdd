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
      - { entity: rsvp, effect: creates, to: Going, facts: [Name, Email, Plus-one, Responded at, Personal link] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product emails the Guest a confirmation with a personal link to their RSVP
    kind: product
    actor: guest
    capability: rsvp-to-event
    entities:
      - { entity: rsvp, effect: reads, facts: [Email, Personal link] }
  - text: Later, the Guest follows the personal link and sees their RSVP
    kind: actor
    actor: guest
    capability: open-invitation
    entities:
      - { entity: rsvp, effect: reads, facts: [Name, Plus-one] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Guest changes their answer to maybe
    kind: actor
    actor: guest
    capability: rsvp-to-event
    entities:
      - { entity: rsvp, from: Going, to: Maybe, facts: [Responded at] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Say yes, then change to maybe

## Trigger

A Guest answers yes and later becomes unsure they can come.

## Outcome

The Journey goal is achieved: the guest list shows the Guest as maybe, and the
spot they held is open for someone else.
