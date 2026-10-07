---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Guest answers maybe on the invitation with their name and email
    kind: actor
    actor: guest
    capability: rsvp-to-event
    entities:
      - { entity: rsvp, effect: creates, to: Maybe, facts: [Name, Email, Plus-one, Responded at, Personal link] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product emails the Guest a confirmation with a personal link to their RSVP
    kind: product
    actor: guest
    capability: rsvp-to-event
    entities:
      - { entity: rsvp, effect: reads, facts: [Email, Personal link] }
  - text: The Guest follows the personal link after the event has started
    kind: actor
    actor: guest
    capability: open-invitation
    entities:
      - { entity: event, effect: reads, facts: [Starts at] }
      - { entity: rsvp, effect: reads, facts: [Name, Plus-one] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
  - text: The Product shows the Guest's answer as it stands and takes no change
    kind: product
    actor: guest
    entities:
      - { entity: rsvp, effect: reads, facts: [] }
    contexts: { web: { place: rsvp-web::responding::invitation } }
---

# Try to change an answer after the event starts

## Trigger

A Guest who answered maybe decides only once the event is under way.

## Outcome

The Journey goal is not achieved: the guest list still shows the Guest as
maybe, because answers closed when the event started.
